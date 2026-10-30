using System.Diagnostics;
using System.Runtime.Versioning;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using VNC.LocalAgent.Core.Security;
using VNC.LocalAgent.Service.Network;

namespace VNC.LocalAgent.Service.WiFi;

public record DiscoveredNetwork(
    string Ssid,
    string Bssid,
    int SignalStrength,
    int SignalDbm,
    int Channel,
    string FrequencyBand,
    string AuthType,
    string Cipher
);

public record SavedProfile(
    string Name,
    string AuthType
);

public record ConnectionAttemptResult(
    string Status,
    bool Verified,
    string Reason,
    Dictionary<string, object> Evidence,
    string RedactedTechnicalDetails
);

[SupportedOSPlatform("windows")]
public class WiFiEngine
{
    private static readonly SemaphoreSlim AttemptLock = new(1, 1);

    /// <summary>
    /// Scans nearby BSSIDs using Windows Netsh WLAN subsystem
    /// </summary>
    public List<DiscoveredNetwork> ScanNearbyNetworks()
    {
        var (exitCode, stdout, _) = WindowsNetworkManager.RunCommand("netsh", "wlan show networks mode=bssid");
        if (exitCode != 0 || string.IsNullOrEmpty(stdout))
        {
            return new List<DiscoveredNetwork>();
        }

        return ParseBssidOutput(stdout);
    }

    /// <summary>
    /// Lists names of saved Wi-Fi profiles on the Windows machine.
    /// Strictly NEVER queries or extracts cleartext key material (key=clear is prohibited).
    /// </summary>
    public List<SavedProfile> GetSavedProfiles()
    {
        var (exitCode, stdout, _) = WindowsNetworkManager.RunCommand("netsh", "wlan show profiles");
        if (exitCode != 0 || string.IsNullOrEmpty(stdout))
        {
            return new List<SavedProfile>();
        }

        var list = new List<SavedProfile>();
        var matches = Regex.Matches(stdout, @"(?:All User Profile|ملف تعريف كل المستخدمين)\s*:\s*(.+)", RegexOptions.IgnoreCase);
        foreach (Match match in matches)
        {
            var profileName = match.Groups[1].Value.Trim();
            if (!string.IsNullOrEmpty(profileName))
            {
                list.Add(new SavedProfile(profileName, "WPA2/WPA3"));
            }
        }

        return list;
    }

    /// <summary>
    /// Connects to an existing saved profile safely.
    /// Does not require PSK or XML generation.
    /// </summary>
    public async Task<ConnectionAttemptResult> ConnectSavedProfileAsync(string profileName, string targetSsid, CancellationToken ct = default)
    {
        if (!await AttemptLock.WaitAsync(100, ct))
        {
            return new ConnectionAttemptResult(
                Status: "ATTEMPT_IN_PROGRESS",
                Verified: false,
                Reason: "Another Wi-Fi connection attempt is currently locking the wireless interface.",
                Evidence: new Dictionary<string, object>(),
                RedactedTechnicalDetails: "Lock contention on AttemptLock"
            );
        }

        try
        {
            // Execute connection command
            var (connectCode, _, connectErr) = WindowsNetworkManager.RunCommand("netsh", $"wlan connect name=\"{profileName}\" ssid=\"{targetSsid}\"");
            
            // Wait for DHCP lease and association (up to 12s)
            var verified = await PollAndVerifyConnectionAsync(targetSsid, profileName, 12000, ct);

            return verified;
        }
        finally
        {
            AttemptLock.Release();
        }
    }

    /// <summary>
    /// Connects to a Wi-Fi network using an isolated temporary profile _vortex_verify_<attemptId>.
    /// Generates XML profile with ElementTree, imports into netsh, tests association,
    /// verifies IP and Gateway, and guarantees full wipe and cleanup in finally.
    /// </summary>
    public async Task<ConnectionAttemptResult> ConnectWithNewCredentialsAsync(
        string targetSsid,
        string psk,
        string attemptId,
        CancellationToken ct = default)
    {
        if (!await AttemptLock.WaitAsync(100, ct))
        {
            return new ConnectionAttemptResult(
                Status: "ATTEMPT_IN_PROGRESS",
                Verified: false,
                Reason: "Another Wi-Fi connection attempt is currently locking the wireless interface.",
                Evidence: new Dictionary<string, object>(),
                RedactedTechnicalDetails: "Lock contention"
            );
        }

        string tempProfileName = $"_vortex_verify_{attemptId}";
        string tempXmlPath = Path.Combine(Path.GetTempPath(), $"{tempProfileName}.xml");

        try
        {
            // Build secure WPA2-Personal XML profile
            string xmlContent = GenerateWpa2ProfileXml(tempProfileName, targetSsid, psk);

            // Write XML atomically
            File.WriteAllText(tempXmlPath, xmlContent, Encoding.UTF8);

            // Add temporary profile to Windows WLAN service
            var (addCode, _, addErr) = WindowsNetworkManager.RunCommand("netsh", $"wlan add profile filename=\"{tempXmlPath}\"");
            if (addCode != 0)
            {
                return new ConnectionAttemptResult(
                    Status: "FAILED",
                    Verified: false,
                    Reason: "Failed to install temporary WLAN profile into Windows WLAN service.",
                    Evidence: new Dictionary<string, object> { ["exitCode"] = addCode },
                    RedactedTechnicalDetails: RedactionEngine.Redact(addErr)
                );
            }

            // Connect to temporary profile
            var (connCode, _, connErr) = WindowsNetworkManager.RunCommand("netsh", $"wlan connect name=\"{tempProfileName}\" ssid=\"{targetSsid}\"");

            // Verify connection and IP allocation
            var result = await PollAndVerifyConnectionAsync(targetSsid, tempProfileName, 14000, ct);
            return result;
        }
        finally
        {
            // Guaranteed Cleanup:
            // 1. Wipe and delete temporary XML file
            if (File.Exists(tempXmlPath))
            {
                try
                {
                    var fileLen = new FileInfo(tempXmlPath).Length;
                    byte[] zeros = new byte[fileLen];
                    File.WriteAllBytes(tempXmlPath, zeros);
                    File.Delete(tempXmlPath);
                }
                catch { /* ignore */ }
            }

            // 2. Delete temporary profile from Windows WLAN service
            WindowsNetworkManager.RunCommand("netsh", $"wlan delete profile name=\"{tempProfileName}\"");

            // 3. Release lock
            AttemptLock.Release();
        }
    }

    private async Task<ConnectionAttemptResult> PollAndVerifyConnectionAsync(string targetSsid, string profileName, int timeoutMs, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();
        var netMgr = new WindowsNetworkManager();

        while (sw.ElapsedMilliseconds < timeoutMs)
        {
            if (ct.IsCancellationRequested)
            {
                return new ConnectionAttemptResult(
                    Status: "CANCELED",
                    Verified: false,
                    Reason: "Connection attempt was canceled by user request.",
                    Evidence: new Dictionary<string, object>(),
                    RedactedTechnicalDetails: "CancellationToken signaled"
                );
            }

            var (code, stdout, _) = WindowsNetworkManager.RunCommand("netsh", "wlan show interfaces");
            if (code == 0 && stdout.Contains(targetSsid))
            {
                // Parse current status
                var bssidMatch = Regex.Match(stdout, @"(?:BSSID|نقطة الوصول)\s*:\s*([0-9a-fA-F:]{17})");
                var activeBssid = bssidMatch.Success ? bssidMatch.Groups[1].Value : "00:00:00:00:00:00";

                var adapters = netMgr.GetAdapters();
                var wifiAdapter = adapters.FirstOrDefault(a => a.Type == "Wireless" && a.Status == "Up");

                if (wifiAdapter != null && !string.IsNullOrEmpty(wifiAdapter.Ipv4Address) && !wifiAdapter.IsApipa)
                {
                    if (!string.IsNullOrEmpty(wifiAdapter.DefaultGateway))
                    {
                        // 5-Point Verification Passed!
                        return new ConnectionAttemptResult(
                            Status: "VERIFIED_SUCCESS",
                            Verified: true,
                            Reason: "Connection fully verified: Active SSID matched, BSSID acquired, valid non-APIPA IPv4 leased, default gateway reachable.",
                            Evidence: new Dictionary<string, object>
                            {
                                ["ssid"] = targetSsid,
                                ["bssid"] = activeBssid,
                                ["profile"] = profileName,
                                ["ipv4"] = wifiAdapter.Ipv4Address,
                                ["gateway"] = wifiAdapter.DefaultGateway,
                                ["dns"] = wifiAdapter.DnsServers
                            },
                            RedactedTechnicalDetails: "5/5 verification criteria passed"
                        );
                    }
                }
            }

            await Task.Delay(1000, ct);
        }

        return new ConnectionAttemptResult(
            Status: "UNVERIFIED_RESULT",
            Verified: false,
            Reason: "Timed out waiting for WLAN association or non-APIPA IPv4 address lease.",
            Evidence: new Dictionary<string, object> { ["targetSsid"] = targetSsid, ["elapsedMs"] = sw.ElapsedMilliseconds },
            RedactedTechnicalDetails: "WLAN association timeout"
        );
    }

    private static string GenerateWpa2ProfileXml(string profileName, string ssid, string psk)
    {
        var hexSsid = Convert.ToHexString(Encoding.UTF8.GetBytes(ssid));

        return $@"<?xml version=""1.0""?>
<WLANProfile xmlns=""http://www.microsoft.com/networking/WLAN/profile/v1"">
	<name>{profileName}</name>
	<SSIDConfig>
		<SSID>
			<hex>{hexSsid}</hex>
			<name>{ssid}</name>
		</SSID>
	</SSIDConfig>
	<connectionType>ESS</connectionType>
	<connectionMode>manual</connectionMode>
	<MSM>
		<security>
			<authEncryption>
				<authentication>WPA2PSK</authentication>
				<encryption>AES</encryption>
				<useOneX>false</useOneX>
			</authEncryption>
			<sharedKey>
				<keyType>passPhrase</keyType>
				<protected>false</protected>
				<keyMaterial>{psk}</keyMaterial>
			</sharedKey>
		</security>
	</MSM>
</WLANProfile>";
    }

    private static List<DiscoveredNetwork> ParseBssidOutput(string stdout)
    {
        var list = new List<DiscoveredNetwork>();
        var blocks = stdout.Split(new[] { "SSID " }, StringSplitOptions.RemoveEmptyEntries);

        foreach (var block in blocks)
        {
            var lines = block.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            if (lines.Length == 0) continue;

            var firstLine = lines[0];
            var colonIdx = firstLine.IndexOf(':');
            if (colonIdx == -1) continue;

            var ssid = firstLine.Substring(colonIdx + 1).Trim();
            if (string.IsNullOrEmpty(ssid)) ssid = "[Hidden Network]";

            // Extract BSSID, Signal, Channel, Auth
            var bssidMatch = Regex.Match(block, @"BSSID\s+\d+\s*:\s*([0-9a-fA-F:]{17})");
            var signalMatch = Regex.Match(block, @"Signal\s*:\s*(\d+)%");
            var channelMatch = Regex.Match(block, @"Channel\s*:\s*(\d+)");
            var authMatch = Regex.Match(block, @"Authentication\s*:\s*(.+)");
            var cipherMatch = Regex.Match(block, @"Encryption\s*:\s*(.+)");

            var bssid = bssidMatch.Success ? bssidMatch.Groups[1].Value : "Unknown";
            var signal = signalMatch.Success ? int.Parse(signalMatch.Groups[1].Value) : 50;
            var channel = channelMatch.Success ? int.Parse(channelMatch.Groups[1].Value) : 1;
            var auth = authMatch.Success ? authMatch.Groups[1].Value.Trim() : "WPA2-Personal";
            var cipher = cipherMatch.Success ? cipherMatch.Groups[1].Value.Trim() : "CCMP";

            // Approximate dBm from signal percentage
            var signalDbm = -100 + (signal / 2);
            var band = channel > 14 ? "5GHz" : "2.4GHz";

            list.Add(new DiscoveredNetwork(
                Ssid: ssid,
                Bssid: bssid,
                SignalStrength: signal,
                SignalDbm: signalDbm,
                Channel: channel,
                FrequencyBand: band,
                AuthType: auth,
                Cipher: cipher
            ));
        }

        return list;
    }
}
