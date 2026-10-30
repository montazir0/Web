# ==============================================================================
# Uninstall-VNC-Local-Agent.ps1
# Clean uninstaller for Vortex Network Control Center Agent
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$PurgeAllData
)

$ErrorActionPreference = "Continue"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   UNINSTALLING VORTEX NETWORK CONTROL CENTER LOCAL AGENT        " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Stop and remove Windows Service
$serviceName = "VNC-Local-Agent"
Write-Host "[*] Stopping and removing service $serviceName..." -ForegroundColor Yellow
Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
sc.exe delete $serviceName | Out-Null

# 2. Remove Tray from Run registry
Write-Host "[*] Removing Tray auto-start..." -ForegroundColor Yellow
$runKey = "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run"
Remove-ItemProperty -Path $runKey -Name "VNCLocalAgentTray" -ErrorAction SilentlyContinue

# 3. Remove Firewall rule
Write-Host "[*] Removing firewall rules..." -ForegroundColor Yellow
Remove-NetFirewallRule -DisplayName "VNC-Local-Agent-Outbound" -ErrorAction SilentlyContinue

# 4. Remove installation binaries
$InstallDir = "C:\Program Files\Vortex Network Control Center Agent"
if (Test-Path $InstallDir) {
    Write-Host "[*] Removing binaries from $InstallDir..." -ForegroundColor Yellow
    Remove-Item -Path $InstallDir -Recurse -Force -ErrorAction SilentlyContinue
}

# 5. Handle logs and data
$DataDir = "$env:ProgramData\VortexNetworkCenter"
if ($PurgeAllData -and (Test-Path $DataDir)) {
    Write-Host "[*] Purging all configuration, keys, and audit logs..." -ForegroundColor Yellow
    Remove-Item -Path $DataDir -Recurse -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "[+] Audit logs and configuration preserved in $DataDir" -ForegroundColor Green
}

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "   UNINSTALLATION COMPLETE!                                     " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
