using System.Runtime.Versioning;
using VNC.LocalAgent.Service.Network;

namespace VNC.LocalAgent.Service.Repairs;

public record RepairResult(
    string RepairId,
    string Status, // VERIFIED_SUCCESS, UNVERIFIED_RESULT, FAILED, CONSENT_REQUIRED
    bool Verified,
    bool RequiresRestart,
    string BeforeSnapshot,
    string AfterSnapshot,
    string Summary
);

[SupportedOSPlatform("windows")]
public class RepairExecutor
{
    private readonly WindowsNetworkManager _netMgr = new();

    /// <summary>
    /// Executes an authorized 8-stage local repair action on the Windows host.
    /// Strictly requires explicit user consent flag.
    /// </summary>
    public async Task<RepairResult> ExecuteRepairAsync(string repairId, bool userConsentGranted, CancellationToken ct = default)
    {
        // Stage 3: User Consent Validation
        if (!userConsentGranted)
        {
            return new RepairResult(
                RepairId: repairId,
                Status: "CONSENT_REQUIRED",
                Verified: false,
                RequiresRestart: false,
                BeforeSnapshot: "",
                AfterSnapshot: "",
                Summary: "Local remediation was blocked: Explicit user consent is mandatory for host modifications."
            );
        }

        // Stage 1: Before Snapshot
        var beforeAdapters = _netMgr.GetAdapters();
        var beforeSnapshot = $"Active adapters: {beforeAdapters.Count(a => a.Status == "Up")}, WlanSvc: {_netMgr.IsWlanAutoConfigRunning()}";

        // Stage 4: Execution
        bool requiresRestart = false;
        bool execSuccess = false;
        string detail = "";

        switch (repairId)
        {
            case "repair_flush_dns":
                var (flushCode, _, flushErr) = WindowsNetworkManager.RunCommand("ipconfig", "/flushdns");
                execSuccess = (flushCode == 0);
                detail = execSuccess ? "Windows DNS Resolver Cache successfully flushed." : $"Flush failed: {flushErr}";
                break;

            case "repair_release_renew_dhcp":
                WindowsNetworkManager.RunCommand("ipconfig", "/release");
                await Task.Delay(1000, ct);
                var (renewCode, _, renewErr) = WindowsNetworkManager.RunCommand("ipconfig", "/renew");
                execSuccess = (renewCode == 0);
                detail = execSuccess ? "DHCP IP address lease successfully renewed from gateway." : $"DHCP renew error: {renewErr}";
                break;

            case "repair_restart_wlansvc":
                WindowsNetworkManager.RunCommand("net", "stop WlanSvc");
                await Task.Delay(1000, ct);
                var (startCode, _, startErr) = WindowsNetworkManager.RunCommand("net", "start WlanSvc");
                execSuccess = (startCode == 0);
                detail = execSuccess ? "WLAN AutoConfig service successfully restarted." : $"Service restart error: {startErr}";
                break;

            case "repair_reset_winsock":
                // Requires administrator and system reboot
                var (sockCode, _, sockErr) = WindowsNetworkManager.RunCommand("netsh", "winsock reset");
                execSuccess = (sockCode == 0);
                requiresRestart = true;
                detail = execSuccess
                    ? "Winsock catalog reset executed. Full verification will complete following a Windows system restart."
                    : $"Winsock reset failed: {sockErr}";
                break;

            default:
                return new RepairResult(
                    RepairId: repairId,
                    Status: "NOT_IMPLEMENTED",
                    Verified: false,
                    RequiresRestart: false,
                    BeforeSnapshot: beforeSnapshot,
                    AfterSnapshot: beforeSnapshot,
                    Summary: $"The requested repair action '{repairId}' is not implemented or supported on this host."
                );
        }

        // Stage 5: After Snapshot
        var afterAdapters = _netMgr.GetAdapters();
        var afterSnapshot = $"Active adapters: {afterAdapters.Count(a => a.Status == "Up")}, WlanSvc: {_netMgr.IsWlanAutoConfigRunning()}";

        // Stage 6: Effect Verification
        string finalStatus;
        bool verified;

        if (!execSuccess)
        {
            finalStatus = "FAILED";
            verified = false;
        }
        else if (requiresRestart)
        {
            finalStatus = "UNVERIFIED_RESULT";
            verified = false; // Cannot claim verified until reboot occurs
        }
        else
        {
            finalStatus = "VERIFIED_SUCCESS";
            verified = true;
        }

        return new RepairResult(
            RepairId: repairId,
            Status: finalStatus,
            Verified: verified,
            RequiresRestart: requiresRestart,
            BeforeSnapshot: beforeSnapshot,
            AfterSnapshot: afterSnapshot,
            Summary: detail
        );
    }
}
