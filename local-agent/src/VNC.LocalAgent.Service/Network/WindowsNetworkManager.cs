using System.Diagnostics;
using System.Net.NetworkInformation;
using System.Runtime.Versioning;
using System.ServiceProcess;
using System.Text.RegularExpressions;

namespace VNC.LocalAgent.Service.Network;

public record AdapterInfo(
    string Name,
    string Description,
    string Type,
    string Status,
    string MacAddress,
    string? Ipv4Address,
    string? DefaultGateway,
    List<string> DnsServers,
    bool IsDhcpEnabled,
    bool IsApipa
);

[SupportedOSPlatform("windows")]
public class WindowsNetworkManager
{
    /// <summary>
    /// Checks if Windows WLAN AutoConfig (WlanSvc) service is running
    /// </summary>
    public bool IsWlanAutoConfigRunning()
    {
        try
        {
            using var sc = new ServiceController("WlanSvc");
            return sc.Status == ServiceControllerStatus.Running;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Reads physical and virtual network adapters on the Windows host
    /// </summary>
    public List<AdapterInfo> GetAdapters()
    {
        var list = new List<AdapterInfo>();
        var nics = NetworkInterface.GetAllNetworkInterfaces();

        foreach (var nic in nics)
        {
            // Skip loopback interfaces
            if (nic.NetworkInterfaceType == NetworkInterfaceType.Loopback) continue;

            var ipProps = nic.GetIPProperties();
            var ipv4Props = ipProps.GetIPv4Properties();

            string? ipv4 = null;
            string? gateway = null;
            var dnsList = new List<string>();
            bool isApipa = false;

            foreach (var unicast in ipProps.UnicastAddresses)
            {
                if (unicast.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                {
                    ipv4 = unicast.Address.ToString();
                    if (ipv4.StartsWith("169.254.")) isApipa = true;
                    break;
                }
            }

            foreach (var gw in ipProps.GatewayAddresses)
            {
                if (gw.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                {
                    gateway = gw.Address.ToString();
                    break;
                }
            }

            foreach (var dns in ipProps.DnsAddresses)
            {
                if (dns.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                {
                    dnsList.Add(dns.ToString());
                }
            }

            string type = nic.NetworkInterfaceType switch
            {
                NetworkInterfaceType.Wireless80211 => "Wireless",
                NetworkInterfaceType.Ethernet => "Ethernet",
                _ => "Virtual"
            };

            list.Add(new AdapterInfo(
                Name: nic.Name,
                Description: nic.Description,
                Type: type,
                Status: nic.OperationalStatus.ToString(),
                MacAddress: nic.GetPhysicalAddress().ToString(),
                Ipv4Address: ipv4,
                DefaultGateway: gateway,
                DnsServers: dnsList,
                IsDhcpEnabled: ipv4Props?.IsDhcpEnabled ?? false,
                IsApipa: isApipa
            ));
        }

        return list;
    }

    /// <summary>
    /// Executes a system command safely with timeout and captured output
    /// </summary>
    public static (int exitCode, string stdout, string stderr) RunCommand(string filename, string arguments, int timeoutMs = 15000)
    {
        using var process = new Process();
        process.StartInfo.FileName = filename;
        process.StartInfo.Arguments = arguments;
        process.StartInfo.UseShellExecute = false;
        process.StartInfo.RedirectStandardOutput = true;
        process.StartInfo.RedirectStandardError = true;
        process.StartInfo.CreateNoWindow = true;

        process.Start();

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();

        if (!process.WaitForExit(timeoutMs))
        {
            try { process.Kill(); } catch { }
            return (-1, "", "Process timed out");
        }

        return (process.ExitCode, stdoutTask.Result, stderrTask.Result);
    }
}
