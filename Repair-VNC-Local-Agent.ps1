# ==============================================================================
# Repair-VNC-Local-Agent.ps1
# Diagnostics and self-repair tool for Vortex Local Agent on Windows
# ==============================================================================

[CmdletBinding()]
param(
    [string]$ServerUrl = "https://localhost:3000"
)

$ErrorActionPreference = "Continue"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   VORTEX LOCAL AGENT - DIAGNOSTICS & REPAIR TOOL                " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$serviceName = "VNC-Local-Agent"
$InstallDir = "C:\Program Files\Vortex Network Control Center Agent"
$DataDir = "$env:ProgramData\VortexNetworkCenter"

# 1. Check Service
$svc = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if (-not $svc) {
    Write-Warning "[-] Service '$serviceName' is missing. Re-running installer recommended."
} else {
    Write-Host "[+] Service '$serviceName' found. Current status: $($svc.Status)" -ForegroundColor Green
    if ($svc.Status -ne [ServiceProcess.ServiceControllerStatus]::Running) {
        Write-Host "[*] Attempting to restart service..." -ForegroundColor Yellow
        Start-Service -Name $serviceName -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
        $svc.Refresh()
        Write-Host "[+] Status after restart: $($svc.Status)" -ForegroundColor Green
    }
}

# 2. Check DPAPI Vault
$vaultFile = Join-Path $DataDir "keys.dat"
if (Test-Path $vaultFile) {
    Write-Host "[+] DPAPI key vault found at: $vaultFile" -ForegroundColor Green
} else {
    Write-Warning "[-] Key vault file not found. Fresh pairing required."
}

# 3. Test Connectivity to Server
Write-Host "[*] Testing HTTPS connectivity to $ServerUrl/api/health ..." -ForegroundColor Yellow
try {
    $res = Invoke-RestMethod -Uri "$ServerUrl/api/health" -Method Get -TimeoutSec 10
    if ($res.status -eq "ok") {
        Write-Host "[+] Server is REACHABLE and reporting healthy." -ForegroundColor Green
    }
} catch {
    Write-Warning "[-] Server connection error: $($_.Exception.Message)"
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   REPAIR CHECKS COMPLETE                                       " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
