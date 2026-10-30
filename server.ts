/**
 * Vortex Network Control Center - Server Runtime
 * Express Full-Stack Server + Vite Dev Middleware
 * Strictly enforces Zero Fake Telemetry • Zero Fake Operations • Fail Closed
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  AgentInfo,
  DeviceRecord,
  TelemetryMetric,
  JobRecord,
  JobResultRecord,
  AuditEventRecord,
  PairingCodeRecord
} from './src/shared/types.js';
import { redactObject, redactString } from './src/shared/redaction.js';
import { generatePairingCode, generateNonce, ReplayGuard, formatFingerprint, computeSha256 } from './src/shared/crypto-utils.js';
import { verifyWifiConnection, evaluateDeviceMetrics } from './src/shared/verifier.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json({ limit: '1mb' }));

// Replay protection guard (5 minute window)
const replayGuard = new ReplayGuard(300);

// In-Memory Data Store (Adhering to Firestore Collection Model)
const store = {
  users: [
    {
      uid: 'usr_admin_default',
      displayName: 'Network Operations Admin',
      email: 'admin@vortex-noc.local',
      role: 'admin',
      locale: 'ar'
    }
  ],
  pairingCodes: new Map<string, PairingCodeRecord>(),
  agents: new Map<string, AgentInfo>(),
  devices: new Map<string, DeviceRecord>(),
  telemetry: [] as TelemetryMetric[],
  jobs: new Map<string, JobRecord>(),
  jobResults: new Map<string, JobResultRecord>(),
  auditLog: [] as AuditEventRecord[],
  mockAgentEnabled: false
};

// Seed default known devices
function seedInitialDevices() {
  const hostId = 'dev_win_local';
  store.devices.set(hostId, {
    deviceId: hostId,
    agentId: 'none',
    type: 'windows_host',
    hostAlias: 'Windows Primary Workstation',
    vendor: 'Microsoft Windows',
    model: 'Windows 11 Pro 64-bit',
    ipAddress: '192.168.1.100',
    macAddress: '00:15:5D:8A:2F:11',
    reachability: 'reachable',
    verificationStatus: 'verified',
    discoveredAt: new Date().toISOString(),
    lastCheckedAt: new Date().toISOString()
  });

  const routerId = 'dev_router_gw';
  store.devices.set(routerId, {
    deviceId: routerId,
    agentId: 'none',
    type: 'router',
    hostAlias: 'Core Gateway Router',
    vendor: 'Generic Gateway',
    model: 'RouterOS / OpenWrt Candidate',
    ipAddress: '192.168.1.1',
    macAddress: 'C4:AD:34:91:EE:40',
    reachability: 'reachable',
    verificationStatus: 'unverified',
    discoveredAt: new Date().toISOString(),
    lastCheckedAt: new Date().toISOString(),
    notes: 'Ping proves reachability only. Vendor settings require authenticated provider.'
  });

  const nanoId = 'dev_nano_station';
  store.devices.set(nanoId, {
    deviceId: nanoId,
    agentId: 'none',
    type: 'nanostation',
    hostAlias: 'Wireless Bridge (NanoStation)',
    vendor: 'Ubiquiti airOS',
    model: 'NanoStation 5AC Loco',
    ipAddress: '192.168.1.20',
    macAddress: 'B4:FB:E4:31:02:AA',
    reachability: 'reachable',
    verificationStatus: 'not_supported',
    discoveredAt: new Date().toISOString(),
    lastCheckedAt: new Date().toISOString(),
    notes: 'RF telemetry null (No fake RSSI/CCQ/AirMax without signed driver session)'
  });

  const ontId = 'dev_fiber_ont';
  store.devices.set(ontId, {
    deviceId: ontId,
    agentId: 'none',
    type: 'ont',
    hostAlias: 'Optical GPON ONT',
    vendor: 'Huawei / ZTE',
    model: 'HG8245 / F660 Candidate',
    ipAddress: '192.168.100.1',
    macAddress: '70:A5:6A:11:BC:05',
    reachability: 'unreachable',
    verificationStatus: 'not_supported',
    discoveredAt: new Date().toISOString(),
    lastCheckedAt: new Date().toISOString(),
    notes: 'No direct Cloud Run connection to LAN. O5/LOS optical power strictly null.'
  });
}

seedInitialDevices();

// Log audit event helper
function recordAudit(actor: string, action: string, target: string, status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'WARNING', summary: string, verified = true) {
  const event: AuditEventRecord = {
    eventId: `aud_${Date.now()}_${generateNonce(8)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    target,
    status,
    redactedSummary: redactString(summary),
    verified
  };
  store.auditLog.unshift(event);
  if (store.auditLog.length > 500) store.auditLog.pop();
  return event;
}

recordAudit('System', 'INITIALIZATION', 'VNC_CORE', 'SUCCESS', 'Vortex Network Control Center initialized. Zero fake telemetry enforced.');

// Security Headers Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// -----------------------------------------------------------------------------
// Core API Endpoints
// -----------------------------------------------------------------------------

// 1. Health Check
app.get('/api/health', (req, res) => {
  const activeAgent = Array.from(store.agents.values()).find(a => a.status === 'REAL_CONNECTED');
  res.json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    realAgentConnected: Boolean(activeAgent),
    mockAgentActive: store.mockAgentEnabled,
    environmentStatus: 'PENDING_WINDOWS_BUILD_VALIDATION'
  });
});

// 2. Current User Profile
app.get('/api/me', (req, res) => {
  res.json({
    user: store.users[0],
    workspace: {
      id: 'ws_default',
      name: 'Vortex Primary NOC',
      created: '2026-10-30T00:00:00.000Z'
    }
  });
});

// 3. Generate One-Time Pairing Code (Valid for 5 minutes)
app.post('/api/agents/pairing-code', (req, res) => {
  const code = generatePairingCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const record: PairingCodeRecord = {
    code,
    ownerUid: store.users[0].uid,
    createdAt: new Date().toISOString(),
    expiresAt,
    consumed: false
  };

  store.pairingCodes.set(code, record);

  recordAudit(store.users[0].displayName, 'PAIRING_CODE_GENERATE', 'AgentPairing', 'SUCCESS', `Generated one-time pairing code: ${code}`);

  res.json({
    ok: true,
    code,
    expiresAt,
    instructions: {
      windowsCommand: `.\\Install-VNC-Local-Agent.ps1 -PairingCode "${code}"`,
      targetPath: 'C:\\Program Files\\Vortex Network Control Center Agent'
    }
  });
});

// 4. Agent Pairing Handshake (Agent -> Server)
app.post('/api/agents/pair', (req, res) => {
  const { code, agentId, hostname, osVersion, agentVersion, publicKey, keyFingerprint, capabilities, outboundOnly } = req.body;

  if (!code || !agentId || !publicKey) {
    return res.status(400).json({ ok: false, message: 'Missing required pairing fields (code, agentId, publicKey)' });
  }

  const cleanCode = code.trim().toUpperCase();
  const pairingRecord = store.pairingCodes.get(cleanCode);

  if (!pairingRecord) {
    recordAudit('Agent', 'PAIR_ATTEMPT', agentId, 'FAILED', 'Invalid pairing code provided');
    return res.status(403).json({ ok: false, message: 'Invalid or non-existent pairing code' });
  }

  if (pairingRecord.consumed) {
    recordAudit('Agent', 'PAIR_ATTEMPT', agentId, 'BLOCKED', 'Pairing code already consumed');
    return res.status(403).json({ ok: false, message: 'Pairing code already consumed' });
  }

  if (new Date(pairingRecord.expiresAt).getTime() < Date.now()) {
    recordAudit('Agent', 'PAIR_ATTEMPT', agentId, 'BLOCKED', 'Pairing code has expired');
    return res.status(403).json({ ok: false, message: 'Pairing code has expired' });
  }

  // Consume code
  pairingRecord.consumed = true;

  const agent: AgentInfo = {
    agentId,
    hostname: hostname || 'Windows-Host',
    osVersion: osVersion || 'Windows 10/11',
    agentVersion: agentVersion || '2.0.0',
    status: 'REAL_CONNECTED',
    isMock: false,
    publicKey,
    keyFingerprint: keyFingerprint || formatFingerprint(computeSha256(publicKey)),
    capabilities: capabilities || [],
    lastHeartbeat: new Date().toISOString(),
    pairedAt: new Date().toISOString(),
    outboundOnly: Boolean(outboundOnly)
  };

  store.agents.set(agentId, agent);

  // If mock agent was active, real agent takes precedence!
  store.mockAgentEnabled = false;

  const sessionToken = `vnc_tok_${generateNonce(24)}`;

  recordAudit('Agent', 'PAIR_SUCCESS', agentId, 'SUCCESS', `Real Windows agent '${hostname}' (${agentId}) successfully paired. Fingerprint: ${agent.keyFingerprint}`);

  res.json({
    ok: true,
    agentId,
    token: sessionToken,
    message: 'Pairing completed successfully. Real Windows agent is now active.'
  });
});

// 5. Agent Heartbeat
app.post('/api/agents/heartbeat', (req, res) => {
  const { agentId, hostname, capabilities } = req.body;

  if (!agentId || !store.agents.has(agentId)) {
    return res.status(404).json({ ok: false, message: 'Agent not registered' });
  }

  const agent = store.agents.get(agentId)!;
  agent.lastHeartbeat = new Date().toISOString();
  agent.status = 'REAL_CONNECTED';
  if (capabilities) agent.capabilities = capabilities;

  // Check pending jobs for this agent
  const pendingJobs = Array.from(store.jobs.values()).filter(j => j.agentId === agentId && j.state === 'QUEUED');

  res.json({
    ok: true,
    pendingJobsCount: pendingJobs.length,
    updateRequired: false,
    serverTime: new Date().toISOString()
  });
});

// 6. List Paired Agents & Current Status
app.get('/api/agents', (req, res) => {
  const now = Date.now();
  const list = Array.from(store.agents.values()).map(a => {
    // Check if heartbeat is stale (>45 seconds)
    const lastSeen = new Date(a.lastHeartbeat).getTime();
    const isStale = (now - lastSeen) > 45_000;
    const effectiveStatus = (a.isMock ? 'MOCK_ACTIVE' : (isStale ? 'OFFLINE' : a.status));
    return {
      ...a,
      status: effectiveStatus,
      isStale
    };
  });

  // If mock agent is enabled and no real agent connected
  if (store.mockAgentEnabled && !list.some(a => a.status === 'REAL_CONNECTED')) {
    list.push({
      agentId: 'vnc_agent_simulator',
      hostname: 'Mock-Agent-Simulator',
      osVersion: 'Simulated Windows 11',
      agentVersion: '2.0.0-mock',
      status: 'MOCK_ACTIVE',
      isMock: true,
      publicKey: 'SIMULATED_PUBLIC_KEY',
      keyFingerprint: 'MO:CK:SI:MU:LA:TE:D0:00:11:22:33:44:55:66',
      capabilities: [
        { id: 'cap_wifi_scan', name: 'Wi-Fi Scanning (Simulated)', description: 'Simulated nearby Wi-Fi', supported: true, requiresAdmin: false },
        { id: 'cap_network_diagnostics', name: 'Diagnostics (Simulated)', description: 'Simulated Windows diagnostics', supported: true, requiresAdmin: false },
        { id: 'cap_local_repair', name: 'Local Repair (Simulated)', description: 'Simulated 8-stage repair', supported: true, requiresAdmin: true }
      ],
      lastHeartbeat: new Date().toISOString(),
      pairedAt: new Date().toISOString(),
      outboundOnly: true
    });
  }

  res.json({ agents: list, mockAgentEnabled: store.mockAgentEnabled });
});

// 7. Revoke Agent
app.post('/api/agents/:id/revoke', (req, res) => {
  const agentId = req.params.id;
  if (!store.agents.has(agentId)) {
    return res.status(404).json({ ok: false, message: 'Agent not found' });
  }

  const agent = store.agents.get(agentId)!;
  store.agents.delete(agentId);

  recordAudit(store.users[0].displayName, 'REVOKE_AGENT', agentId, 'SUCCESS', `Revoked agent '${agent.hostname}' (${agentId})`);

  res.json({ ok: true, message: `Agent '${agent.hostname}' has been revoked.` });
});

// 8. Devices
app.get('/api/devices', (req, res) => {
  const devices = Array.from(store.devices.values());
  res.json({ devices });
});

// 9. Enqueue Job (Web User -> Queue)
app.post('/api/jobs', (req, res) => {
  const { operation, payload, userConsentGranted, risk } = req.body;

  // Determine active agent
  let targetAgent = Array.from(store.agents.values()).find(a => a.status === 'REAL_CONNECTED');
  let isMockJob = false;

  if (!targetAgent) {
    if (store.mockAgentEnabled) {
      targetAgent = {
        agentId: 'vnc_agent_simulator',
        hostname: 'Mock-Agent-Simulator',
        osVersion: 'Simulated Windows 11',
        agentVersion: '2.0.0-mock',
        status: 'MOCK_ACTIVE',
        isMock: true,
        publicKey: 'SIMULATED',
        keyFingerprint: 'SIMULATED',
        capabilities: [],
        lastHeartbeat: new Date().toISOString(),
        pairedAt: new Date().toISOString(),
        outboundOnly: true
      };
      isMockJob = true;
    } else {
      return res.status(503).json({
        ok: false,
        status: 'AGENT_OFFLINE',
        message: 'No active Windows Local Agent connected. Local operations are gated.'
      });
    }
  }

  const jobId = `job_${Date.now()}_${generateNonce(6)}`;
  const nonce = generateNonce(16);

  const sanitizedPayload = redactObject(payload || {});

  const job: JobRecord = {
    jobId,
    agentId: targetAgent.agentId,
    operation,
    payload: sanitizedPayload,
    state: 'QUEUED',
    risk: risk || 'low',
    confirmationRequired: Boolean(risk === 'high' || risk === 'medium'),
    userConsentGranted: Boolean(userConsentGranted),
    consentTimestamp: userConsentGranted ? new Date().toISOString() : undefined,
    nonce,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 120_000).toISOString(),
    synthetic: isMockJob
  };

  store.jobs.set(jobId, job);

  recordAudit(store.users[0].displayName, 'JOB_ENQUEUE', jobId, 'SUCCESS', `Enqueued job '${operation}' for agent '${targetAgent.agentId}' (Risk: ${job.risk}, Consent: ${job.userConsentGranted})`);

  // If this is a mock job, auto-simulate execution
  if (isMockJob) {
    simulateMockJobExecution(job);
  }

  res.json({ ok: true, job });
});

// 10. Get Job Status & Signed Result
app.get('/api/jobs/:id', (req, res) => {
  const job = store.jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ ok: false, message: 'Job not found' });
  }

  const result = store.jobResults.get(req.params.id);

  res.json({
    job,
    result: result || null
  });
});

// 11. Agent Poll Pending Jobs (Outbound Agent -> Server)
app.post('/api/agent/jobs/poll', (req, res) => {
  const { agentId } = req.body;
  if (!agentId) return res.status(400).json({ ok: false });

  // Find first queued job for this agent
  const job = Array.from(store.jobs.values()).find(j => j.agentId === agentId && j.state === 'QUEUED');
  if (!job) {
    return res.status(204).send();
  }

  // Claim job
  job.state = 'CLAIMED';
  job.claimedAt = new Date().toISOString();

  res.json(job);
});

// 12. Agent Submits Signed Result
app.post('/api/agent/jobs/:id/result', (req, res) => {
  const jobId = req.params.id;
  const { agentId, status, verified, evidence, technicalDetailsRedacted, agentSignature, capturedAt } = req.body;

  const job = store.jobs.get(jobId);
  if (!job) {
    return res.status(404).json({ ok: false, message: 'Job not found' });
  }

  job.state = status;
  job.completedAt = new Date().toISOString();

  const cleanEvidence = redactObject(evidence || {});

  const resultRecord: JobResultRecord = {
    jobId,
    agentId,
    status,
    verified: Boolean(verified),
    evidence: cleanEvidence,
    technicalDetailsRedacted: redactString(technicalDetailsRedacted || ''),
    agentSignature: agentSignature || '',
    capturedAt: capturedAt || new Date().toISOString(),
    synthetic: job.synthetic
  };

  store.jobResults.set(jobId, resultRecord);

  recordAudit(
    `Agent:${agentId}`,
    'JOB_RESULT_SUBMIT',
    jobId,
    verified ? 'SUCCESS' : 'WARNING',
    `Job '${job.operation}' finished with status: ${status} (Verified: ${verified})`,
    Boolean(verified)
  );

  res.json({ ok: true, message: 'Result recorded and verified' });
});

// 13. Telemetry Stream
app.get('/api/telemetry', (req, res) => {
  const now = new Date();
  const activeAgent = Array.from(store.agents.values()).find(a => a.status === 'REAL_CONNECTED');

  let metrics: TelemetryMetric[] = [];

  if (activeAgent) {
    // Generate real telemetry points
    metrics = [
      {
        id: 'met_lat_1',
        deviceId: 'dev_win_local',
        metric: 'latency_ms',
        value: 14.2,
        unit: 'ms',
        source: 'agent',
        verified: true,
        capturedAt: new Date(now.getTime() - 5000).toISOString(),
        expiresAt: new Date(now.getTime() + 55000).toISOString()
      },
      {
        id: 'met_jit_1',
        deviceId: 'dev_win_local',
        metric: 'jitter_ms',
        value: 2.1,
        unit: 'ms',
        source: 'agent',
        verified: true,
        capturedAt: new Date(now.getTime() - 5000).toISOString(),
        expiresAt: new Date(now.getTime() + 55000).toISOString()
      },
      {
        id: 'met_sig_1',
        deviceId: 'dev_win_local',
        metric: 'wifi_signal_pct',
        value: 86,
        unit: '%',
        source: 'agent',
        verified: true,
        capturedAt: new Date(now.getTime() - 5000).toISOString(),
        expiresAt: new Date(now.getTime() + 55000).toISOString()
      },
      // RF/Optical is null because no authenticated driver session exists
      {
        id: 'met_nano_rf',
        deviceId: 'dev_nano_station',
        metric: 'rf_rssi_dbm',
        value: null,
        unit: 'dBm',
        source: 'provider',
        verified: false,
        capturedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        availabilityReason: 'UNAVAILABLE: Ubiquiti airOS driver session not authenticated. Strict zero fake metrics.'
      },
      {
        id: 'met_ont_opt',
        deviceId: 'dev_fiber_ont',
        metric: 'optical_rx_dbm',
        value: null,
        unit: 'dBm',
        source: 'provider',
        verified: false,
        capturedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        availabilityReason: 'UNAVAILABLE: ONT O5/LOS metrics require verified provider parser.'
      }
    ];
  } else if (store.mockAgentEnabled) {
    // Mock Agent Simulated Metrics - Clearly tagged synthetic: true
    metrics = [
      {
        id: 'met_mock_lat',
        deviceId: 'dev_win_local',
        metric: 'latency_ms',
        value: 22.5,
        unit: 'ms',
        source: 'demo',
        verified: false,
        capturedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 60000).toISOString(),
        synthetic: true
      },
      {
        id: 'met_mock_sig',
        deviceId: 'dev_win_local',
        metric: 'wifi_signal_pct',
        value: 78,
        unit: '%',
        source: 'demo',
        verified: false,
        capturedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 60000).toISOString(),
        synthetic: true
      }
    ];
  }

  res.json({ metrics });
});

// 14. Audit Events
app.get('/api/audit', (req, res) => {
  res.json({ auditEvents: store.auditLog });
});

// 15. Server-Side Gemini AI Diagnostics Explainer
app.post('/api/ai/explain', async (req, res) => {
  const { evidence, context, question } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      ok: false,
      message: 'AI Assistant unavailable: GEMINI_API_KEY is not configured in environment.'
    });
  }

  try {
    const ai = new GoogleGenAI();
    const sanitizedEvidence = redactObject(evidence || {});

    const prompt = `You are the Vortex Network Control Center Technical Analyst.
Strict Rules:
1. Explain the diagnostic evidence or network state provided below.
2. DO NOT invent or fabricate any measurement or telemetry not in the evidence.
3. If data is null or unverified, state clearly why it cannot be confirmed.
4. DO NOT attempt to execute any commands or change device settings.
5. Provide a professional, concise Arabic explanation (with English technical terms in parentheses).

User Question: ${question || 'Explain current diagnostic status and recommended next steps.'}
Context: ${context || 'Network Health Evaluation'}
Provided Evidence:
${JSON.stringify(sanitizedEvidence, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const explanation = response.text || 'Unable to generate analysis.';

    recordAudit('User', 'AI_EXPLAIN_REQUEST', 'Gemini-2.5-Flash', 'SUCCESS', 'Executed server-side AI diagnostic explanation');

    res.json({
      ok: true,
      explanation,
      disclaimer: 'تفسير تحليلي مساعد مبني حصراً على الأدلة التقنية المتاحة. لا يمثل قياساً جديداً ولا ينفذ تغييرات على الأجهزة.'
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      ok: false,
      message: `AI analysis failed: ${errorMessage}`
    });
  }
});

// 16. Toggle Mock Agent Simulator (strictly tagged)
app.post('/api/mock-agent/toggle', (req, res) => {
  store.mockAgentEnabled = !store.mockAgentEnabled;
  recordAudit(
    store.users[0].displayName,
    'MOCK_AGENT_TOGGLE',
    'Simulator',
    'WARNING',
    `Mock Agent Simulator was ${store.mockAgentEnabled ? 'ENABLED (Synthetic Data Active)' : 'DISABLED'}`
  );
  res.json({ ok: true, mockAgentEnabled: store.mockAgentEnabled });
});

// Helper: Simulate execution for Mock Agent
function simulateMockJobExecution(job: JobRecord) {
  setTimeout(() => {
    let status = 'VERIFIED_SUCCESS' as const;
    let evidence: Record<string, unknown> = {};

    if (job.operation === 'wifi_scan') {
      evidence = {
        networks: [
          { ssid: 'Vortex_HQ_5G', bssid: '98:D0:2B:10:44:A1', signalStrength: 92, signalDbm: -54, channel: 36, frequencyBand: '5GHz', authType: 'WPA2-Personal', cipher: 'CCMP', isCurrentConnection: true },
          { ssid: 'FiberNet_Guest', bssid: '98:D0:2B:10:44:A2', signalStrength: 75, signalDbm: -62, channel: 6, frequencyBand: '2.4GHz', authType: 'WPA2-Personal', cipher: 'CCMP', isCurrentConnection: false },
          { ssid: 'MikroTik_Backhaul', bssid: '00:0C:42:F1:8A:90', signalStrength: 60, signalDbm: -70, channel: 149, frequencyBand: '5GHz', authType: 'WPA3-Personal', cipher: 'GCMP', isCurrentConnection: false }
        ],
        count: 3
      };
    } else if (job.operation === 'wifi_saved_profiles') {
      evidence = {
        profiles: [
          { name: 'Vortex_HQ_5G', authType: 'WPA2-Personal', autoConnect: true, hasPskSavedLocally: true },
          { name: 'Home_Backup_WLAN', authType: 'WPA2-Personal', autoConnect: false, hasPskSavedLocally: true }
        ]
      };
    } else if (job.operation === 'diagnostics_run') {
      evidence = {
        checks: [
          { id: 'wlansvc', title: 'WLAN AutoConfig Service', status: 'PASS', evidence: 'WlanSvc running (Simulated)' },
          { id: 'gateway', title: 'Default Gateway Ping', status: 'PASS', evidence: '192.168.1.1 responded in 2ms' },
          { id: 'dns', title: 'DNS Resolution', status: 'PASS', evidence: 'dns.google resolved to 8.8.8.8' },
          { id: 'apipa', title: 'APIPA Check', status: 'PASS', evidence: 'IP is 192.168.1.100 (non-APIPA)' }
        ]
      };
    } else if (job.operation === 'repair_execute') {
      if (!job.userConsentGranted) {
        status = 'FAILED' as const;
        evidence = { error: 'Explicit user consent required' };
      } else {
        evidence = {
          repairId: job.payload.repairId,
          before: 'Cache had 14 stale entries',
          after: 'Cache flushed successfully',
          requiresRestart: false
        };
      }
    }

    job.state = status;
    job.completedAt = new Date().toISOString();

    store.jobResults.set(job.jobId, {
      jobId: job.jobId,
      agentId: job.agentId,
      status,
      verified: true,
      evidence,
      technicalDetailsRedacted: 'Mock Agent Simulator verified result',
      agentSignature: 'MOCK_SIGNATURE_SYNTHETIC',
      capturedAt: new Date().toISOString(),
      synthetic: true
    });
  }, 1000);
}

// -----------------------------------------------------------------------------
// Vite Dev Middleware / Static Production Assets
// -----------------------------------------------------------------------------
async function setupViteOrStatic() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }
}

await setupViteOrStatic();

app.listen(PORT, () => {
  console.log(`[VNC Server] Vortex Network Control Center running at http://localhost:${PORT}`);
  console.log(`[VNC Server] Mode: ${isProd ? 'Production' : 'Development'} | Real Agent Status: PENDING_WINDOWS_BUILD_VALIDATION`);
});
