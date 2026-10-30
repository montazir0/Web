using System.Runtime.Versioning;
using System.Security.Cryptography;
using System.Text;

namespace VNC.LocalAgent.Core.Security;

/// <summary>
/// Cryptographic key manager for VNC Local Agent.
/// Generates and maintains ECDsa (P-256) keypair.
/// Enforces DPAPI-protected private key persistence.
/// </summary>
[SupportedOSPlatform("windows")]
public class KeyPairManager
{
    private readonly DpapiSecretVault _vault;
    private ECDsa? _ecdsa;

    public KeyPairManager(string keyVaultPath)
    {
        _vault = new DpapiSecretVault(keyVaultPath);
        LoadOrGenerate();
    }

    private void LoadOrGenerate()
    {
        var existingPkcs8Pem = _vault.ReadSecret();
        if (!string.IsNullOrEmpty(existingPkcs8Pem))
        {
            try
            {
                _ecdsa = ECDsa.Create();
                _ecdsa.ImportFromPem(existingPkcs8Pem);
                return;
            }
            catch
            {
                // Corrupted vault fails closed and regenerates securely
            }
        }

        // Generate new ECDSA P-256 keypair
        _ecdsa = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        string newPkcs8Pem = _ecdsa.ExportPkcs8PrivateKeyPem();
        _vault.SaveSecret(newPkcs8Pem);
    }

    /// <summary>
    /// Exports the public key in SubjectPublicKeyInfo PEM format
    /// </summary>
    public string GetPublicKeyPem()
    {
        if (_ecdsa == null) throw new InvalidOperationException("Key not initialized");
        return _ecdsa.ExportSubjectPublicKeyInfoPem();
    }

    /// <summary>
    /// Computes SHA-256 fingerprint of the public key
    /// </summary>
    public string GetPublicKeyFingerprint()
    {
        if (_ecdsa == null) throw new InvalidOperationException("Key not initialized");
        byte[] spki = _ecdsa.ExportSubjectPublicKeyInfo();
        byte[] hash = SHA256.HashData(spki);
        return BitConverter.ToString(hash).Replace("-", ":").ToUpperInvariant();
    }

    /// <summary>
    /// Signs a UTF-8 payload with ECDSA SHA-256
    /// </summary>
    public string SignPayload(string payload)
    {
        if (_ecdsa == null) throw new InvalidOperationException("Key not initialized");
        byte[] data = Encoding.UTF8.GetBytes(payload);
        byte[] signature = _ecdsa.SignData(data, HashAlgorithmName.SHA256);
        return Convert.ToBase64String(signature);
    }

    /// <summary>
    /// Verifies a signature against this public key
    /// </summary>
    public bool VerifySignature(string payload, string base64Signature)
    {
        if (_ecdsa == null) throw new InvalidOperationException("Key not initialized");
        try
        {
            byte[] data = Encoding.UTF8.GetBytes(payload);
            byte[] signature = Convert.FromBase64String(base64Signature);
            return _ecdsa.VerifyData(data, signature, HashAlgorithmName.SHA256);
        }
        catch
        {
            return false;
        }
    }
}
