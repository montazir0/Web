using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using VNC.LocalAgent.Core.Models;
using VNC.LocalAgent.Core.Security;

namespace VNC.LocalAgent.Core.Protocol;

/// <summary>
/// Outbound-only HTTP client for VNC Local Agent.
/// Enforces Zero Inbound Ports: Never opens any listening socket on user device.
/// All communication is outbound HTTPS to the server.
/// </summary>
public class AgentHttpClient
{
    private readonly HttpClient _httpClient;
    private readonly string _serverBaseUrl;
    private readonly KeyPairManager _keyPair;
    private readonly string _agentId;
    private string? _authToken;

    public AgentHttpClient(string serverBaseUrl, string agentId, KeyPairManager keyPair, HttpClient? httpClient = null)
    {
        _serverBaseUrl = serverBaseUrl.TrimEnd('/');
        _agentId = agentId;
        _keyPair = keyPair;
        _httpClient = httpClient ?? new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
    }

    public void SetAuthToken(string token)
    {
        _authToken = token;
    }

    /// <summary>
    /// Executes initial pairing request using one-time code
    /// </summary>
    public async Task<PairingResponse> PairAsync(string code, List<AgentCapability> capabilities, CancellationToken ct = default)
    {
        var timestamp = DateTime.UtcNow.ToString("O");
        var request = new PairingRequest(
            Code: code,
            AgentId: _agentId,
            Hostname: Environment.MachineName,
            OsVersion: Environment.OSVersion.ToString(),
            AgentVersion: "2.0.0",
            PublicKey: _keyPair.GetPublicKeyPem(),
            KeyFingerprint: _keyPair.GetPublicKeyFingerprint(),
            Capabilities: capabilities,
            OutboundOnly: true,
            Timestamp: timestamp
        );

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_serverBaseUrl}/api/agents/pair", content, ct);
        var responseString = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"Pairing failed with HTTP {response.StatusCode}: {responseString}");
        }

        var result = JsonSerializer.Deserialize<PairingResponse>(responseString, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        if (result != null && !string.IsNullOrEmpty(result.Token))
        {
            _authToken = result.Token;
        }

        return result ?? new PairingResponse(false, _agentId, "", "Invalid response from server");
    }

    /// <summary>
    /// Sends signed heartbeat to server
    /// </summary>
    public async Task<HeartbeatResponse> SendHeartbeatAsync(List<AgentCapability> capabilities, CancellationToken ct = default)
    {
        var timestamp = DateTime.UtcNow.ToString("O");
        var signString = $"{_agentId}:{timestamp}";
        var signature = _keyPair.SignPayload(signString);

        var payload = new HeartbeatPayload(
            AgentId: _agentId,
            Hostname: Environment.MachineName,
            OsVersion: Environment.OSVersion.ToString(),
            AgentVersion: "2.0.0",
            Capabilities: capabilities,
            Timestamp: timestamp,
            Signature: signature
        );

        var json = JsonSerializer.Serialize(payload);
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_serverBaseUrl}/api/agents/heartbeat")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

        AddAuthHeaders(request);

        var response = await _httpClient.SendAsync(request, ct);
        var responseString = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"Heartbeat failed ({response.StatusCode}): {responseString}");
        }

        return JsonSerializer.Deserialize<HeartbeatResponse>(responseString, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? new HeartbeatResponse(false, 0, false, timestamp);
    }

    /// <summary>
    /// Polls outbound for any pending assigned jobs
    /// </summary>
    public async Task<JobDispatch?> PollNextJobAsync(CancellationToken ct = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_serverBaseUrl}/api/agent/jobs/poll")
        {
            Content = new StringContent(JsonSerializer.Serialize(new { agentId = _agentId }), Encoding.UTF8, "application/json")
        };

        AddAuthHeaders(request);

        var response = await _httpClient.SendAsync(request, ct);
        if (response.StatusCode == System.Net.HttpStatusCode.NoContent || !response.IsSuccessStatusCode)
        {
            return null;
        }

        var responseString = await response.Content.ReadAsStringAsync(ct);
        if (string.IsNullOrWhiteSpace(responseString)) return null;

        return JsonSerializer.Deserialize<JobDispatch>(responseString, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }

    /// <summary>
    /// Submits a cryptographically signed job result with evidence and redacted technical details
    /// </summary>
    public async Task SubmitJobResultAsync(JobResultSubmission submission, CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(submission);
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_serverBaseUrl}/api/agent/jobs/{submission.JobId}/result")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

        AddAuthHeaders(request);

        var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(ct);
            throw new HttpRequestException($"Failed to submit job result: {err}");
        }
    }

    private void AddAuthHeaders(HttpRequestMessage request)
    {
        if (!string.IsNullOrEmpty(_authToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _authToken);
        }
        request.Headers.Add("X-Agent-ID", _agentId);
        request.Headers.Add("X-Agent-Nonce", Guid.NewGuid().ToString("N"));
    }
}
