/**
 * Vortex Network Control Center - Core Types & Contracts
 * Strictly enforces: Zero Fake Telemetry • Zero Fake Operations • Fail Closed
 */

export type AgentStatus = 
  | 'REAL_CONNECTED'
  | 'MOCK_ACTIVE'
  | 'OFFLINE'
  | 'UPDATE_REQUIRED'
  | 'CAPABILITY_MISSING';

export type JobState = 
  | 'QUEUED'
  | 'CLAIMED'
  | 'RUNNING'
  | 'VERIFIED_SUCCESS'
  | 'FAILED'
  | 'UNVERIFIED_RESULT'
  | 'CANCELED'
  | 'EXPIRED'
  | 'NOT_IMPLEMENTED';

export type TelemetrySource = 'agent' | 'provider' | 'user' | 'demo';

export type RiskLevel = 'none' | 'low' | 'medium' | 'high';

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  supported: boolean;
  requiresAdmin: boolean;
}

export interface AgentInfo {
  agentId: string;
  hostname: string;
  osVersion: string;
  agentVersion: string;
  status: AgentStatus;
  isMock: boolean;
  publicKey: string;
  keyFingerprint: string;
  capabilities: AgentCapability[];
  lastHeartbeat: string;
  pairedAt: string;
  outboundOnly: boolean;
  ipAddress?: string;
}

export interface PairingCodeRecord {
  code: string;
  ownerUid: string;
  createdAt: string;
  expiresAt: string;
  consumed: boolean;
}

export interface WifiNetwork {
  ssid: string;
  bssid: string;
  signalStrength: number; // percentage 0-100
  signalDbm: number; // dBm e.g. -55
  channel: number;
  frequencyBand: '2.4GHz' | '5GHz' | '6GHz';
  authType: 'WPA2-Personal' | 'WPA3-Personal' | 'WPA2-Enterprise' | 'Open' | string;
  cipher: 'CCMP' | 'GCMP' | 'TKIP' | 'None' | string;
  isCurrentConnection: boolean;
}

export interface SavedWifiProfile {
  name: string;
  authType: string;
  autoConnect: boolean;
  hasPskSavedLocally: boolean; // Locally on Windows only
  lastConnected?: string;
}

export interface WindowsNetworkAdapter {
  id: string;
  name: string;
  description: string;
  type: 'Wireless' | 'Ethernet' | 'Virtual';
  status: 'Up' | 'Down' | 'Disconnected' | 'Disabled';
  macAddress: string;
  ipv4Address?: string;
  ipv4Subnet?: string;
  gateway?: string;
  dnsServers: string[];
  dhcpEnabled: boolean;
  isApipa: boolean;
  wlanServiceRunning: boolean;
}

export interface DeviceRecord {
  deviceId: string;
  agentId: string;
  type: 'windows_host' | 'router' | 'nanostation' | 'ont';
  hostAlias: string;
  vendor: string;
  model: string;
  ipAddress: string;
  macAddress?: string;
  reachability: 'reachable' | 'unreachable' | 'unknown';
  verificationStatus: 'verified' | 'unverified' | 'not_supported';
  discoveredAt: string;
  lastCheckedAt: string;
  notes?: string;
  synthetic?: boolean;
}

export interface TelemetryMetric {
  id: string;
  deviceId: string;
  metric: 'latency_ms' | 'jitter_ms' | 'packet_loss_pct' | 'wifi_signal_pct' | 'rf_rssi_dbm' | 'optical_rx_dbm';
  value: number | null; // null if unmeasured or unavailable
  unit: string;
  source: TelemetrySource;
  verified: boolean;
  capturedAt: string;
  expiresAt: string;
  availabilityReason?: string;
  synthetic?: boolean;
}

export interface JobRecord {
  jobId: string;
  agentId: string;
  operation: string;
  payload: Record<string, unknown>;
  state: JobState;
  risk: RiskLevel;
  confirmationRequired: boolean;
  userConsentGranted: boolean;
  consentTimestamp?: string;
  nonce: string;
  createdAt: string;
  expiresAt: string;
  claimedAt?: string;
  completedAt?: string;
  synthetic?: boolean;
}

export interface JobResultRecord {
  jobId: string;
  agentId: string;
  status: JobState;
  verified: boolean;
  evidence: Record<string, unknown>;
  technicalDetailsRedacted: string;
  agentSignature: string;
  capturedAt: string;
  synthetic?: boolean;
}

export interface AuditEventRecord {
  eventId: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'WARNING';
  redactedSummary: string;
  clientIp?: string;
  verified: boolean;
}

export interface DiagnosticCheck {
  id: string;
  title: string;
  category: 'windows' | 'wifi' | 'gateway' | 'dns';
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIPPED';
  evidence: string;
  verified: boolean;
  capturedAt: string;
}

export interface RepairOption {
  id: string;
  name: string;
  description: string;
  risk: RiskLevel;
  requiresAdmin: boolean;
  requiresRestart: boolean;
  expectedOutcome: string;
  rollbackSupported: boolean;
}
