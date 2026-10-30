using System.Runtime.Versioning;

namespace VNC.LocalAgent.Tray;

[SupportedOSPlatform("windows")]
public class TrayApplicationContext : ApplicationContext
{
    private readonly NotifyIcon _notifyIcon;
    private readonly ContextMenuStrip _contextMenu;

    public TrayApplicationContext()
    {
        _contextMenu = new ContextMenuStrip();
        
        var statusItem = new ToolStripMenuItem("VNC Agent: Real Agent Running") { Enabled = false };
        var pairItem = new ToolStripMenuItem("Pair with Web Portal...", null, OnPairClicked);
        var logsItem = new ToolStripMenuItem("Open Logs Directory", null, OnOpenLogsClicked);
        var exitItem = new ToolStripMenuItem("Exit Tray Notification", null, OnExitClicked);

        _contextMenu.Items.AddRange(new ToolStripItem[] {
            statusItem,
            new ToolStripSeparator(),
            pairItem,
            logsItem,
            new ToolStripSeparator(),
            exitItem
        });

        _notifyIcon = new NotifyIcon
        {
            Icon = SystemIcons.Shield,
            ContextMenuStrip = _contextMenu,
            Text = "Vortex Network Control Center Agent",
            Visible = true
        };

        _notifyIcon.ShowBalloonTip(3000, "VNC Agent Active", "Connected outbound to Vortex Network Control Center. No inbound ports open.", ToolTipIcon.Info);
    }

    private void OnPairClicked(object? sender, EventArgs e)
    {
        MessageBox.Show(
            "To pair your Windows device:\n1. Open the VNC Web Dashboard in your browser\n2. Navigate to 'Agents' -> 'Pair Agent'\n3. Copy the 6-character one-time pairing code\n4. Run the Install-VNC-Local-Agent.ps1 script with the code.",
            "VNC Local Agent Pairing",
            MessageBoxButtons.OK,
            MessageBoxIcon.Information);
    }

    private void OnOpenLogsClicked(object? sender, EventArgs e)
    {
        string logPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "VortexNetworkCenter", "logs");
        if (Directory.Exists(logPath))
        {
            System.Diagnostics.Process.Start("explorer.exe", logPath);
        }
        else
        {
            MessageBox.Show($"Log directory not created yet at: {logPath}", "Logs", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
    }

    private void OnExitClicked(object? sender, EventArgs e)
    {
        _notifyIcon.Visible = false;
        Application.Exit();
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _notifyIcon?.Dispose();
            _contextMenu?.Dispose();
        }
        base.Dispose(disposing);
    }
}
