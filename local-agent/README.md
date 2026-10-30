# Vortex Network Control Center - Real Windows Local Agent (v2.0)

**Build Status in Linux Container:** `PENDING_WINDOWS_BUILD_VALIDATION`  
*(Note: As documented in the roadmap, Google AI Studio Linux sandbox does not host Windows SDK/.NET 8 Windows desktop compilers; all complete C# .NET 8 source code, project solutions, security vaults, and tests are provided in pristine condition ready for Windows compilation).*

---

## 1. Overview & Security Principles
- **Outbound Only**: The agent initiates all communication outwards to the Vortex Network Control Center web application via HTTPS. **Zero listening ports** are opened on your Windows computer.
- **Fail Closed**: No measurement or operation succeeds without cryptographically signed evidence and explicit verification.
- **Zero Cloud Passwords**: Wi-Fi PSKs and passwords are NEVER sent to the cloud. Saved profiles are read by name only. New network testing uses an isolated, temporary XML profile `_vortex_verify_<attemptId>` that is securely zeroed and deleted after verification.
- **Windows DPAPI Vault**: Private keys are encrypted using Windows Data Protection API (`System.Security.Cryptography.ProtectedData`).
- **No Unrelated Processes**: The agent strictly manages its own PID and child jobs. It never interacts with or touches VortexAI or any unrelated third-party software.

---

## 2. Requirements on Windows
- Windows 10 (version 1909+) or Windows 11 (64-bit)
- PowerShell 5.1 or PowerShell 7+
- .NET 8.0 SDK or .NET 8.0 Runtime (x64)

---

## 3. How to Build on Windows
To build self-contained executables from source on your Windows development machine:

```powershell
# Open PowerShell in the local-agent folder
cd local-agent

# Execute the automated build script
.\build.ps1 -Configuration Release -OutputDirectory .\publish
```

Or run `build.bat`.

This will:
1. Restore all NuGet dependencies.
2. Run unit tests (`dotnet test`).
3. Compile `VNC.LocalAgent.Service.exe` (Windows Service) and `VNC.LocalAgent.Tray.exe` (User Tray notification app).
4. Calculate and output SHA-256 checksums in `publish\manifest.xml`.

---

## 4. How to Install
Run the automated installation script with Administrator privileges:

```powershell
# Open Administrator PowerShell in the repository root:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\Install-VNC-Local-Agent.ps1
```

The installer:
1. Verifies Administrator privileges and Windows version.
2. Creates the target directory at `C:\Program Files\Vortex Network Control Center Agent`.
3. Verifies SHA-256 hashes of all binaries.
4. Registers the Windows Service `VNC-Local-Agent` with **Automatic Delayed Start**.
5. Registers the user Tray application in the Windows Run registry.
6. Prompts for your 6-character one-time pairing code from the Web UI.
7. Generates an ECDSA keypair, stores the private key under DPAPI, and registers the public key with the web portal.
8. Starts the service and verifies the first outbound heartbeat.
9. Prints a true PASS/FAIL verification report.

---

## 5. How to Pair with the Web Portal
1. Open the Vortex Network Control Center in your browser.
2. Go to the **Agents** tab.
3. Click **Pair New Agent**.
4. A 6-character code (e.g. `K9X2P4`) will appear with a 5-minute countdown.
5. In the PowerShell installer prompt, paste the code when prompted:
   ```text
   Enter one-time Pairing Code from Web UI: K9X2P4
   ```
6. The agent securely submits its public key and binds to your account.

---

## 6. How to Run & How to Stop

### Using Windows Services Manager:
```powershell
# Start Service
Start-Service -Name "VNC-Local-Agent"

# Stop Service
Stop-Service -Name "VNC-Local-Agent"

# Query Status
Get-Service -Name "VNC-Local-Agent"
```

### Using Command Line:
```powershell
sc.exe start VNC-Local-Agent
sc.exe stop VNC-Local-Agent
sc.exe query VNC-Local-Agent
```

---

## 7. How to Unpair & Uninstall
To cleanly uninstall the agent, remove services, and unpair from the server:

```powershell
# Run the uninstall script as Administrator:
.\Uninstall-VNC-Local-Agent.ps1
```

The uninstaller will ask whether to preserve or purge the local audit log and key vault.

---

## 8. How to Read Logs
Local logs are written atomically to:
`%ProgramData%\VortexNetworkCenter\logs\` (usually `C:\ProgramData\VortexNetworkCenter\logs\agent.log`).

To monitor live logs in PowerShell:
```powershell
Get-Content -Path "C:\ProgramData\VortexNetworkCenter\logs\agent.log" -Wait -Tail 20
```

---

## 9. How to Run Agent Tests
```powershell
cd local-agent
dotnet test tests\VNC.LocalAgent.Tests\VNC.LocalAgent.Tests.csproj
```

---

## 10. Verification of Zero Password Leakage
To audit and verify that no passwords or PSKs leave your machine:
1. Inspect `src/VNC.LocalAgent.Service/WiFi/WiFiEngine.cs`:
   - `GetSavedProfiles()` uses `netsh wlan show profiles` (never passes `key=clear`).
   - `ConnectWithNewCredentialsAsync` creates `_vortex_verify_<id>.xml` in `%TEMP%`.
   - The XML file is wiped with zeroes and deleted in the `finally` block before the method returns.
2. Inspect `src/VNC.LocalAgent.Core/Security/RedactionEngine.cs`:
   - All logs, errors, and JSON results pass through regex redaction replacing keys with `[REDACTED]`.
3. Check the web portal backend and Firestore: no collection contains Wi-Fi PSKs.
