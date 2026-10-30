/**
 * Pure Verifier Rules
 * Enforces Zero Fake Telemetry • Zero Fake Operations • Fail Closed
 */

import { JobState, TelemetryMetric } from './types.js';

export interface WifiVerificationInput {
  targetSsid: string;
  activeSsid?: string;
  activeBssid?: string;
  activeProfileName?: string;
  expectedProfileName?: string;
  ipv4Address?: string;
  defaultGateway?: string;
  wlanEventCodes?: number[];
  authFailedEventObserved?: boolean;
}

export interface WifiVerificationResult {
  status: JobState;
  verified: boolean;
  reason: string;
  evidence: {
    ssidMatch: boolean;
    bssidAcquired: boolean;
    validNonApipaIp: boolean;
    gatewayPresent: boolean;
    authClean: boolean;
  };
}

/**
 * Checks if an IPv4 address is in the APIPA (Automatic Private IP Addressing) range (169.254.0.0/16)
 */
export function isApipaAddress(ip?: string): boolean {
  if (!ip) return false;
  return ip.startsWith('169.254.');
}

/**
 * Validates a Wi-Fi connection result according to REQ-WIFI-004:
 * CONNECTED_VERIFIED requires target SSID match, BSSID, IPv4 not APIPA, Gateway present, and no auth failures.
 */
export function verifyWifiConnection(input: WifiVerificationInput): WifiVerificationResult {
  const ssidMatch = Boolean(input.activeSsid && input.activeSsid === input.targetSsid);
  const bssidAcquired = Boolean(input.activeBssid && input.activeBssid !== '00:00:00:00:00:00');
  const validNonApipaIp = Boolean(input.ipv4Address && !isApipaAddress(input.ipv4Address) && input.ipv4Address !== '0.0.0.0');
  const gatewayPresent = Boolean(input.defaultGateway && input.defaultGateway !== '0.0.0.0');
  const authClean = !input.authFailedEventObserved;

  const evidence = {
    ssidMatch,
    bssidAcquired,
    validNonApipaIp,
    gatewayPresent,
    authClean
  };

  if (input.authFailedEventObserved) {
    return {
      status: 'FAILED',
      verified: true,
      reason: 'WLAN authentication failure event explicitly detected by Windows subsystem.',
      evidence
    };
  }

  // All 5 verification gates must pass for VERIFIED_SUCCESS
  if (ssidMatch && bssidAcquired && validNonApipaIp && gatewayPresent && authClean) {
    return {
      status: 'VERIFIED_SUCCESS',
      verified: true,
      reason: 'Connection verified: Active SSID matched, valid BSSID acquired, non-APIPA IPv4 leased, default gateway reachable.',
      evidence
    };
  }

  // If connected to SSID but IP/Gateway is still missing/unverified
  if (ssidMatch && (!validNonApipaIp || !gatewayPresent)) {
    return {
      status: 'UNVERIFIED_RESULT',
      verified: false,
      reason: 'WLAN link established but valid IPv4 address or default gateway could not be confirmed (Fail-Closed).',
      evidence
    };
  }

  return {
    status: 'FAILED',
    verified: false,
    reason: 'Connection failed: Interface did not associate with the requested SSID.',
    evidence
  };
}

/**
 * Validates if telemetry metric is stale (>60s old)
 */
export function isTelemetryStale(metric: TelemetryMetric, nowMs = Date.now()): boolean {
  const capturedMs = new Date(metric.capturedAt).getTime();
  if (isNaN(capturedMs)) return true;
  return nowMs - capturedMs > 60_000;
}

/**
 * Enforces fail-closed evaluation of remote device telemetry:
 * Ping reaching an IP ONLY proves reachability, never proves RF, CCQ, O5 status or optical power.
 */
export function evaluateDeviceMetrics(type: string, pingReachable: boolean, authenticatedProviderSession: boolean) {
  if (!pingReachable) {
    return {
      reachability: 'unreachable' as const,
      telemetryAllowed: false,
      reason: 'Device IP does not respond to ping on local subnet.'
    };
  }

  if (!authenticatedProviderSession) {
    return {
      reachability: 'reachable' as const,
      telemetryAllowed: false,
      reason: 'Device is ping-reachable, but deep metrics (RF/PON/O5) require an authenticated vendor driver session. Values set to null.'
    };
  }

  return {
    reachability: 'reachable' as const,
    telemetryAllowed: true,
    reason: 'Authenticated provider active.'
  };
}
