# Build-VNC-LocalAgent.ps1
# Compiles and publishes VNC Local Agent for Windows 10/11 x64
param(
    [string]$Configuration = "Release",
    [string]$OutputDirectory = ".\publish"
)

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Vortex Network Control Center - Agent Builder  " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Check for .NET 8 SDK
if (-not (Get-Command "dotnet" -ErrorAction SilentlyContinue)) {
    Write-Error "ERROR: .NET 8 SDK ('dotnet') is required to compile the Local Agent. Download from https://dotnet.microsoft.com/download"
    exit 1
}

$dotnetVersion = dotnet --version
Write-Host "[+] Found .NET SDK version: $dotnetVersion" -ForegroundColor Green

# 2. Restore NuGet packages
Write-Host "[*] Restoring NuGet dependencies..." -ForegroundColor Yellow
dotnet restore VNC.LocalAgent.sln

# 3. Run Agent Unit Tests
Write-Host "[*] Executing Agent Unit Tests..." -ForegroundColor Yellow
dotnet test tests\VNC.LocalAgent.Tests\VNC.LocalAgent.Tests.csproj -c $Configuration --no-restore
if ($LASTEXITCODE -ne 0) {
    Write-Error "[-] Unit tests failed! Build aborted."
    exit 1
}
Write-Host "[+] All Unit Tests Passed!" -ForegroundColor Green

# 4. Publish Self-Contained Service for Windows x64
$serviceOut = Join-Path $OutputDirectory "service"
Write-Host "[*] Publishing VNC.LocalAgent.Service to $serviceOut ..." -ForegroundColor Yellow
dotnet publish src\VNC.LocalAgent.Service\VNC.LocalAgent.Service.csproj `
    -c $Configuration `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -o $serviceOut

# 5. Publish Tray Application for Windows x64
$trayOut = Join-Path $OutputDirectory "tray"
Write-Host "[*] Publishing VNC.LocalAgent.Tray to $trayOut ..." -ForegroundColor Yellow
dotnet publish src\VNC.LocalAgent.Tray\VNC.LocalAgent.Tray.csproj `
    -c $Configuration `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -o $trayOut

# 6. Generate SHA-256 Checksums
Write-Host "[*] Calculating SHA-256 checksums..." -ForegroundColor Yellow
$hashes = @()
Get-ChildItem -Path $OutputDirectory -Recurse -Filter "*.exe" | ForEach-Object {
    $hash = Get-FileHash -Path $_.FullName -Algorithm SHA256
    $hashes += [PSCustomObject]@{
        FileName = $_.Name
        SHA256 = $hash.Hash
        SizeKB = [math]::Round($_.Length / 1KB, 2)
    }
}

$hashes | Format-Table -AutoSize
$hashes | Export-Clixml -Path (Join-Path $OutputDirectory "manifest.xml")

Write-Host "==================================================" -ForegroundColor Green
Write-Host "   BUILD SUCCESSFUL! Artifacts ready in: $OutputDirectory" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
