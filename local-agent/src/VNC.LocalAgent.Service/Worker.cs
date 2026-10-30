using System.Runtime.Versioning;
using System.Text.Json;
using VNC.LocalAgent.Core.Models;
using VNC.LocalAgent.Core.Protocol;
using VNC.LocalAgent.Core.Security;
using VNC.LocalAgent.Service.Diagnostics;
using VNC.LocalAgent.Service.Network;
using VNC.LocalAgent.Service.Repairs;
using VNC.LocalAgent.Service.WiFi;

namespace VNC.LocalAgent.Service;

[SupportedOSPlatform("windows")]
public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IConfiguration _config;
    private readonly WindowsNetworkManager _netMgr = new();
    private readonly WiFiEngine _wifiEngine = new();
    private readonly DiagnosticsRunner _diagRunner = new();
    private readonly RepairExecutor _repairExecutor = new();

    public Worker(ILogger<Worker> logger, IConfiguration config)
    {
        _logger = logger;
        _config = config;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("VNC Local Agent Background Service starting up...");

        string agentId = _config["Agent:Id"] ?? ("vnc_win_" + Environment.MachineName.ToLowerInvariant());
        string serverUrl = _config["Agent:ServerUrl"] ?? "https://localhost:3000";
        string vaultPath = _config["Agent:VaultPath"] ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "VortexNetworkCenter", "keys.dat");

        var keyPair = new KeyPairManager(vaultPath);
        var client = new AgentHttpClient(serverUrl, agentId, keyPair);

        var capabilities = GetCapabilities();

        _logger.LogInformation("Outbound-only connection established. Host: {Host}, Agent ID: {AgentId}", Environment.MachineName, agentId);

        var lastHeartbeat = DateTime.MinValue;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // 1. Send periodic heartbeat every 15s
                if (DateTime.UtcNow - lastHeartbeat > TimeSpan.FromSeconds(15))
                {
                    try
                    {
                        var hb = await client.SendHeartbeatAsync(capabilities, stoppingToken);
                        lastHeartbeat = DateTime.UtcNow;
                        _logger.LogDebug("Heartbeat ack received. Pending jobs: {Count}", hb.PendingJobsCount);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning("Heartbeat ping failed: {Message}", ex.Message);
                    }
                }

                // 2. Poll for pending job outbound
                var job = await client.PollNextJobAsync(stoppingToken);
                if (job != null)
                {
                    _logger.LogInformation("Claimed Job: {JobId}, Operation: {Op}", job.JobId, job.Operation);
                    await ExecuteAndSubmitJobAsync(client, keyPair, job, stoppingToken);
                }

                // Sleep between polls
                await Task.Delay(2000, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Agent loop, retrying in 5 seconds...");
                await Task.Delay(5000, stoppingToken);
            }
        }

        _logger.LogInformation("VNC Local Agent gracefully shutting down.");
    }

    private async Task ExecuteAndSubmitJobAsync(
        AgentHttpClient client,
        KeyPairManager keyPair,
        JobDispatch job,
        CancellationToken ct)
    {
        string status = "FAILED";
        bool verified = false;
        var evidence = new Dictionary<string, object>();
        string technicalDetails = "";

        try
        {
            switch (job.Operation)
            {
                case "wifi_scan":
                    var scanList = _wifiEngine.ScanNearbyNetworks();
                    status = "VERIFIED_SUCCESS";
                    verified = true;
                    evidence["networks"] = scanList;
                    evidence["count"] = scanList.Count;
                    break;

                case "wifi_saved_profiles":
                    var profiles = _wifiEngine.GetSavedProfiles();
                    status = "VERIFIED_SUCCESS";
                    verified = true;
                    evidence["profiles"] = profiles;
                    break;

                case "wifi_connect_saved":
                    var savedProfileName = job.Payload.GetValueOrDefault("profileName")?.ToString() ?? "";
                    var targetSsid = job.Payload.GetValueOrDefault("ssid")?.ToString() ?? savedProfileName;
                    var savedResult = await _wifiEngine.ConnectSavedProfileAsync(savedProfileName, targetSsid, ct);
                    status = savedResult.Status;
                    verified = savedResult.Verified;
                    evidence = savedResult.Evidence;
                    technicalDetails = savedResult.RedactedTechnicalDetails;
                    break;

                case "wifi_connect_new":
                    var newSsid = job.Payload.GetValueOrDefault("ssid")?.ToString() ?? "";
                    var psk = job.Payload.GetValueOrDefault("psk")?.ToString() ?? "";
                    var newResult = await _wifiEngine.ConnectWithNewCredentialsAsync(newSsid, psk, job.JobId, ct);
                    status = newResult.Status;
                    verified = newResult.Verified;
                    evidence = newResult.Evidence;
                    technicalDetails = newResult.RedactedTechnicalDetails;
                    break;

                case "diagnostics_run":
                    var diagResults = await _diagRunner.RunAllDiagnosticsAsync(ct);
                    status = "VERIFIED_SUCCESS";
                    verified = true;
                    evidence["results"] = diagResults;
                    break;

                case "repair_execute":
                    var repairId = job.Payload.GetValueOrDefault("repairId")?.ToString() ?? "";
                    var repairRes = await _repairExecutor.ExecuteRepairAsync(repairId, job.UserConsentGranted, ct);
                    status = repairRes.Status;
                    verified = repairRes.Verified;
                    evidence["repairId"] = repairRes.RepairId;
                    evidence["requiresRestart"] = repairRes.RequiresRestart;
                    evidence["summary"] = repairRes.Summary;
                    technicalDetails = $"Before: {repairRes.BeforeSnapshot} | After: {repairRes.AfterSnapshot}";
                    break;

                default:
                    status = "NOT_IMPLEMENTED";
                    verified = false;
                    technicalDetails = $"Operation '{job.Operation}' not supported by Windows Agent v2.0.";
                    break;
            }
        }
        catch (Exception ex)
        {
            status = "FAILED";
            verified = false;
            technicalDetails = RedactionEngine.Redact(ex.ToString());
        }

        var timestamp = DateTime.UtcNow.ToString("O");
        var signaturePayload = $"{job.JobId}:{status}:{verified}:{timestamp}";
        var signature = keyPair.SignPayload(signaturePayload);

        var submission = new JobResultSubmission(
            JobId: job.JobId,
            AgentId: job.AgentId,
            Status: status,
            Verified: verified,
            Evidence: evidence,
            TechnicalDetailsRedacted: technicalDetails,
            AgentSignature: signature,
            CapturedAt: timestamp
        );

        await client.SubmitJobResultAsync(submission, ct);
        _logger.LogInformation("Job {JobId} completed with status: {Status}, Verified: {Verified}", job.JobId, status, verified);
    }

    private List<AgentCapability> GetCapabilities()
    {
        return new List<AgentCapability>
        {
            new("cap_windows_adapters", "Windows Adapters Query", "Read physical & virtual network interfaces", true, false),
            new("cap_wlansvc_query", "WLAN AutoConfig State", "Query state of Windows WlanSvc", true, false),
            new("cap_wifi_scan", "Wi-Fi Scanning", "Scan nearby BSSID networks and signal strengths", true, false),
            new("cap_wifi_saved_profiles", "Wi-Fi Saved Profiles", "List profile names without leaking keys", true, false),
            new("cap_wifi_connect_saved", "Connect Saved Wi-Fi", "Connect to existing Windows Wi-Fi profile", true, false),
            new("cap_wifi_connect_new", "Connect New Wi-Fi", "Connect via isolated temporary profile with verification", true, true),
            new("cap_network_diagnostics", "Local Diagnostics", "Run local Windows network stack diagnostics", true, false),
            new("cap_local_repair", "Local Network Repairs", "Execute user-authorized remediations (DNS, Winsock, DHCP)", true, true)
        };
    }
}
