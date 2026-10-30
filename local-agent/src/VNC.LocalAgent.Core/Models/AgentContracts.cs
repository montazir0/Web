using System.Text.Json.Serialization;

namespace VNC.LocalAgent.Core.Models;

public record AgentCapability(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("supported")] bool Supported,
    [property: JsonPropertyName("requiresAdmin")] bool RequiresAdmin
);

public record PairingRequest(
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("agentId")] string AgentId,
    [property: JsonPropertyName("hostname")] string Hostname,
    [property: JsonPropertyName("osVersion")] string OsVersion,
    [property: JsonPropertyName("agentVersion")] string AgentVersion,
    [property: JsonPropertyName("publicKey")] string PublicKey,
    [property: JsonPropertyName("keyFingerprint")] string KeyFingerprint,
    [property: JsonPropertyName("capabilities")] List<AgentCapability> Capabilities,
    [property: JsonPropertyName("outboundOnly")] bool OutboundOnly,
    [property: JsonPropertyName("timestamp")] string Timestamp
);

public record PairingResponse(
    [property: JsonPropertyName("ok")] bool Ok,
    [property: JsonPropertyName("agentId")] string AgentId,
    [property: JsonPropertyName("token")] string Token,
    [property: JsonPropertyName("message")] string Message
);

public record HeartbeatPayload(
    [property: JsonPropertyName("agentId")] string AgentId,
    [property: JsonPropertyName("hostname")] string Hostname,
    [property: JsonPropertyName("osVersion")] string OsVersion,
    [property: JsonPropertyName("agentVersion")] string AgentVersion,
    [property: JsonPropertyName("capabilities")] List<AgentCapability> Capabilities,
    [property: JsonPropertyName("timestamp")] string Timestamp,
    [property: JsonPropertyName("signature")] string Signature
);

public record HeartbeatResponse(
    [property: JsonPropertyName("ok")] bool Ok,
    [property: JsonPropertyName("pendingJobsCount")] int PendingJobsCount,
    [property: JsonPropertyName("updateRequired")] bool UpdateRequired,
    [property: JsonPropertyName("serverTime")] string ServerTime
);

public record JobDispatch(
    [property: JsonPropertyName("jobId")] string JobId,
    [property: JsonPropertyName("agentId")] string AgentId,
    [property: JsonPropertyName("operation")] string Operation,
    [property: JsonPropertyName("payload")] Dictionary<string, object> Payload,
    [property: JsonPropertyName("risk")] string Risk,
    [property: JsonPropertyName("userConsentGranted")] bool UserConsentGranted,
    [property: JsonPropertyName("nonce")] string Nonce,
    [property: JsonPropertyName("createdAt")] string CreatedAt,
    [property: JsonPropertyName("expiresAt")] string ExpiresAt
);

public record JobResultSubmission(
    [property: JsonPropertyName("jobId")] string JobId,
    [property: JsonPropertyName("agentId")] string AgentId,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("verified")] bool Verified,
    [property: JsonPropertyName("evidence")] Dictionary<string, object> Evidence,
    [property: JsonPropertyName("technicalDetailsRedacted")] string TechnicalDetailsRedacted,
    [property: JsonPropertyName("agentSignature")] string AgentSignature,
    [property: JsonPropertyName("capturedAt")] string CapturedAt
);

public record AuditEvent(
    [property: JsonPropertyName("eventId")] string EventId,
    [property: JsonPropertyName("timestamp")] string Timestamp,
    [property: JsonPropertyName("actor")] string Actor,
    [property: JsonPropertyName("action")] string Action,
    [property: JsonPropertyName("target")] string Target,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("redactedSummary")] string RedactedSummary,
    [property: JsonPropertyName("verified")] bool Verified
);
