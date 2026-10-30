using System.Net;
using System.Net.NetworkInformation;
using System.Runtime.Versioning;
using VNC.LocalAgent.Service.Network;

namespace VNC.LocalAgent.Service.Diagnostics;

public record DiagnosticReportItem(
    string TestId,
    string Title,
    string Category,
    string Status, // PASS, FAIL, WARN, SKIPPED
    string Evidence,
    bool Verified
);

[SupportedOSPlatform("windows")]
public class DiagnosticsRunner
{
    private readonly WindowsNetworkManager _netMgr = new();

    public async Task<List<DiagnosticReportItem>> RunAllDiagnosticsAsync(CancellationToken ct = default)
    {
        var results = new List<DiagnosticReportItem>();

        // 1. WLAN AutoConfig Service Test
        bool wlanRunning = _netMgr.IsWlanAutoConfigRunning();
        results.Add(new DiagnosticReportItem(
            TestId: "diag_wlansvc",
            Title: "Windows WLAN AutoConfig Service (WlanSvc)",
            Category: "windows",
            Status: wlanRunning ? "PASS" : "FAIL",
            Evidence: wlanRunning ? "Service is Running" : "Service is Stopped or Disabled",
            Verified: true
        ));

        // 2. Network Adapters & APIPA Check
        var adapters = _netMgr.GetAdapters();
        var activeAdapter = adapters.FirstOrDefault(a => a.Status == "Up");
        if (activeAdapter == null)
        {
            results.Add(new DiagnosticReportItem(
                TestId: "diag_adapter_state",
                Title: "Physical Network Adapter Association",
                Category: "windows",
                Status: "FAIL",
                Evidence: "No active network adapters with operational status 'Up'.",
                Verified: true
            ));
        }
        else if (activeAdapter.IsApipa)
        {
            results.Add(new DiagnosticReportItem(
                TestId: "diag_apipa_check",
                Title: "APIPA IP Check (169.254.x.x)",
                Category: "windows",
                Status: "FAIL",
                Evidence: $"Adapter '{activeAdapter.Name}' has APIPA address {activeAdapter.Ipv4Address}. DHCP lease failed.",
                Verified: true
            ));
        }
        else
        {
            results.Add(new DiagnosticReportItem(
                TestId: "diag_apipa_check",
                Title: "IPv4 Lease & Subnet Configuration",
                Category: "windows",
                Status: "PASS",
                Evidence: $"Valid IPv4 {activeAdapter.Ipv4Address} on '{activeAdapter.Name}'.",
                Verified: true
            ));
        }

        // 3. Default Gateway Reachability (Ping)
        if (activeAdapter != null && !string.IsNullOrEmpty(activeAdapter.DefaultGateway))
        {
            bool gwReachable = await PingHostAsync(activeAdapter.DefaultGateway, 2000);
            results.Add(new DiagnosticReportItem(
                TestId: "diag_gateway_ping",
                Title: "Default Gateway Reachability",
                Category: "gateway",
                Status: gwReachable ? "PASS" : "FAIL",
                Evidence: gwReachable
                    ? $"Default Gateway {activeAdapter.DefaultGateway} responded to ICMP echo."
                    : $"Default Gateway {activeAdapter.DefaultGateway} did not reply to ICMP ping.",
                Verified: true
            ));
        }
        else
        {
            results.Add(new DiagnosticReportItem(
                TestId: "diag_gateway_ping",
                Title: "Default Gateway Reachability",
                Category: "gateway",
                Status: "FAIL",
                Evidence: "No default gateway assigned on the active interface.",
                Verified: true
            ));
        }

        // 4. DNS Resolution Check
        bool dnsSuccess = false;
        string dnsEvidence = "";
        try
        {
            var hostEntry = await Dns.GetHostEntryAsync("dns.google");
            dnsSuccess = hostEntry.AddressList.Length > 0;
            dnsEvidence = $"Resolved dns.google to {hostEntry.AddressList[0]}";
        }
        catch (Exception ex)
        {
            dnsEvidence = $"DNS lookup failed: {ex.Message}";
        }

        results.Add(new DiagnosticReportItem(
            TestId: "diag_dns_lookup",
            Title: "DNS Server Name Resolution",
            Category: "dns",
            Status: dnsSuccess ? "PASS" : "FAIL",
            Evidence: dnsEvidence,
            Verified: true
        ));

        return results;
    }

    private static async Task<bool> PingHostAsync(string hostOrIp, int timeoutMs)
    {
        try
        {
            using var ping = new Ping();
            var reply = await ping.SendPingAsync(hostOrIp, timeoutMs);
            return reply.Status == IPStatus.Success;
        }
        catch
        {
            return false;
        }
    }
}
