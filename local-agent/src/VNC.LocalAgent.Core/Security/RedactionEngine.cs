using System.Text.RegularExpressions;

namespace VNC.LocalAgent.Core.Security;

/// <summary>
/// Redaction engine for C# Windows Local Agent.
/// Enforces REQ-SEC-003: Redacts passwords, PSKs, tokens, cookies, auth headers.
/// </summary>
public static class RedactionEngine
{
    private static readonly Regex PskPattern = new(
        @"<keyMaterial>([^<]+)<\/keyMaterial>",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex KeyValueSecretPattern = new(
        @"(password|passphrase|psk|token|secret|api[_-]?key|cookie)\s*[:=]\s*[""']?([^""',;\s&]+)[""']?",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex BearerPattern = new(
        @"bearer\s+([a-zA-Z0-9_\-\.]+)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex PrivateKeyPattern = new(
        @"-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public static string Redact(string input)
    {
        if (string.IsNullOrEmpty(input)) return input;

        var result = PrivateKeyPattern.Replace(input, "[REDACTED_PRIVATE_KEY]");
        result = PskPattern.Replace(result, "<keyMaterial>[REDACTED_PSK]</keyMaterial>");
        result = KeyValueSecretPattern.Replace(result, "$1=[REDACTED]");
        result = BearerPattern.Replace(result, "Bearer [REDACTED_TOKEN]");

        return result;
    }
}
