@echo off
echo ==================================================
echo   Building Vortex Network Center Local Agent
echo ==================================================
powershell.exe -ExecutionPolicy Bypass -File "%~dp0build.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed with exit code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)
echo [SUCCESS] Windows Local Agent built successfully.
