using System.Runtime.Versioning;
using System.Security.Cryptography;
using System.Text;

namespace VNC.LocalAgent.Core.Security;

/// <summary>
/// DPAPI Secret Vault enforcing REQ-SEC-001:
/// Exclusively uses Windows DPAPI (ProtectedData).
/// Strictly NO Base64 or plaintext fallbacks.
/// Uses atomic write with temp file + flush + atomic move.
/// </summary>
[SupportedOSPlatform("windows")]
public class DpapiSecretVault
{
    private readonly string _vaultPath;
    private readonly DataProtectionScope _scope;
    private static readonly byte[] Entropy = Encoding.UTF8.GetBytes("VNC-Vortex-DPAPI-Entropy-v2.0");

    public DpapiSecretVault(string vaultPath, DataProtectionScope scope = DataProtectionScope.LocalMachine)
    {
        _vaultPath = vaultPath;
        _scope = scope;
        var dir = Path.GetDirectoryName(_vaultPath);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
        {
            Directory.CreateDirectory(dir);
        }
    }

    /// <summary>
    /// Encrypts and atomically writes data to disk.
    /// </summary>
    public void SaveSecret(string plainSecret)
    {
        if (plainSecret == null) throw new ArgumentNullException(nameof(plainSecret));

        byte[] plainBytes = Encoding.UTF8.GetBytes(plainSecret);
        byte[] encryptedBytes;

        try
        {
            encryptedBytes = ProtectedData.Protect(plainBytes, Entropy, _scope);
        }
        finally
        {
            // Wipe plaintext in memory
            Array.Clear(plainBytes, 0, plainBytes.Length);
        }

        // Atomic write: write to temp, flush, fsync, atomic replace
        string tempFile = _vaultPath + ".tmp." + Guid.NewGuid().ToString("N");
        try
        {
            using (var fs = new FileStream(tempFile, FileMode.CreateNew, FileAccess.Write, FileShare.None, 4096, FileOptions.WriteThrough))
            {
                fs.Write(encryptedBytes, 0, encryptedBytes.Length);
                fs.Flush(true);
            }

            if (File.Exists(_vaultPath))
            {
                File.Replace(tempFile, _vaultPath, null);
            }
            else
            {
                File.Move(tempFile, _vaultPath);
            }
        }
        catch
        {
            if (File.Exists(tempFile))
            {
                try { File.Delete(tempFile); } catch { /* ignore */ }
            }
            throw;
        }
    }

    /// <summary>
    /// Reads and decrypts data from disk using DPAPI.
    /// </summary>
    public string? ReadSecret()
    {
        if (!File.Exists(_vaultPath)) return null;

        byte[] encryptedBytes = File.ReadAllBytes(_vaultPath);
        if (encryptedBytes.Length == 0) return null;

        byte[] decryptedBytes = ProtectedData.Unprotect(encryptedBytes, Entropy, _scope);
        try
        {
            return Encoding.UTF8.GetString(decryptedBytes);
        }
        finally
        {
            Array.Clear(decryptedBytes, 0, decryptedBytes.Length);
        }
    }

    /// <summary>
    /// Securely deletes the vault file.
    /// </summary>
    public void Purge()
    {
        if (!File.Exists(_vaultPath)) return;

        try
        {
            // Overwrite with zeros before deletion
            var length = new FileInfo(_vaultPath).Length;
            byte[] zeros = new byte[length];
            File.WriteAllBytes(_vaultPath, zeros);
            File.Delete(_vaultPath);
        }
        catch
        {
            // Best effort
            if (File.Exists(_vaultPath)) File.Delete(_vaultPath);
        }
    }
}
