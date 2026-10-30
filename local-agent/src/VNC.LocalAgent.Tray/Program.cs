using System.Runtime.Versioning;

namespace VNC.LocalAgent.Tray;

[SupportedOSPlatform("windows")]
internal static class Program
{
    [STAThread]
    static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new TrayApplicationContext());
    }
}
