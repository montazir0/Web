import test from 'node:test';
import assert from 'node:assert/strict';
import { redactString, redactObject } from '../shared/redaction.js';
import { verifyWifiConnection, isApipaAddress, isTelemetryStale, evaluateDeviceMetrics } from '../shared/verifier.js';
import { generatePairingCode, ReplayGuard, computeSha256 } from '../shared/crypto-utils.js';

test('redactString strips sensitive passwords, tokens, and keyMaterial', () => {
  const sample = 'WlanConnect password="SuperSecretPassword123" with bearer eyJhbGciOiJIUzI1NiJ9';
  const sanitized = redactString(sample);
  assert.ok(!sanitized.includes('SuperSecretPassword123'), 'Raw password must not be present');
  assert.ok(sanitized.includes('password=[REDACTED]'), 'Must replace with [REDACTED]');
  assert.ok(!sanitized.includes('eyJhbGciOiJIUzI1NiJ9'), 'Token must not be present');
});

test('redactObject recursively redacts objects without mutating input', () => {
  const payload = {
    ssid: 'Vortex_Office',
    psk: 'TopSecretWpaKey',
    adapter: 'Wi-Fi 6',
    nested: {
      password: 'admin',
      gateway: '192.168.1.1'
    }
  };

  const clean = redactObject(payload);
  assert.equal(clean.psk, '[REDACTED]');
  assert.equal(clean.nested.password, '[REDACTED]');
  assert.equal(clean.ssid, 'Vortex_Office');
  assert.equal(clean.nested.gateway, '192.168.1.1');
  // Check original not mutated
  assert.equal(payload.psk, 'TopSecretWpaKey');
});

test('isApipaAddress correctly detects 169.254.x.x addresses', () => {
  assert.equal(isApipaAddress('169.254.10.45'), true);
  assert.equal(isApipaAddress('192.168.1.50'), false);
  assert.equal(isApipaAddress('10.0.0.1'), false);
  assert.equal(isApipaAddress(''), false);
});

test('verifyWifiConnection requires all 5 gates for VERIFIED_SUCCESS', () => {
  const successCase = verifyWifiConnection({
    targetSsid: 'Home-Fiber',
    activeSsid: 'Home-Fiber',
    activeBssid: '00:14:22:01:23:45',
    ipv4Address: '192.168.1.105',
    defaultGateway: '192.168.1.1',
    authFailedEventObserved: false
  });
  assert.equal(successCase.status, 'VERIFIED_SUCCESS');
  assert.equal(successCase.verified, true);

  // If IP is APIPA, connection must fail verification (Fail-Closed)
  const apipaCase = verifyWifiConnection({
    targetSsid: 'Home-Fiber',
    activeSsid: 'Home-Fiber',
    activeBssid: '00:14:22:01:23:45',
    ipv4Address: '169.254.88.12',
    defaultGateway: '192.168.1.1',
    authFailedEventObserved: false
  });
  assert.equal(apipaCase.status, 'UNVERIFIED_RESULT');
  assert.equal(apipaCase.verified, false);

  // If Auth failed event observed, must be FAILED
  const authFailCase = verifyWifiConnection({
    targetSsid: 'Home-Fiber',
    activeSsid: 'Home-Fiber',
    activeBssid: '00:14:22:01:23:45',
    ipv4Address: '192.168.1.105',
    defaultGateway: '192.168.1.1',
    authFailedEventObserved: true
  });
  assert.equal(authFailCase.status, 'FAILED');
});

test('evaluateDeviceMetrics enforces no fake RF/ONT telemetry on ping alone', () => {
  // Reachable but unauthenticated
  const unauth = evaluateDeviceMetrics('nanostation', true, false);
  assert.equal(unauth.reachability, 'reachable');
  assert.equal(unauth.telemetryAllowed, false);

  // Unreachable
  const unreachable = evaluateDeviceMetrics('ont', false, false);
  assert.equal(unreachable.reachability, 'unreachable');
  assert.equal(unreachable.telemetryAllowed, false);
});

test('ReplayGuard blocks replay of duplicate nonces within window', () => {
  const guard = new ReplayGuard(60);
  const now = Date.now();
  const timestamp = new Date(now).toISOString();
  const nonce = 'abcdef1234567890abcdef1234567890';

  // First consumption succeeds
  const first = guard.validate(nonce, timestamp, now);
  assert.equal(first.valid, true);

  // Second consumption fails with replay error
  const second = guard.validate(nonce, timestamp, now);
  assert.equal(second.valid, false);
  assert.ok(second.reason?.includes('Replay detected'));

  // Expired timestamp fails
  const staleTimestamp = new Date(now - 120_000).toISOString();
  const third = guard.validate('new-nonce-1234567890123456', staleTimestamp, now);
  assert.equal(third.valid, false);
  assert.ok(third.reason?.includes('outside allowed time window'));
});

test('generatePairingCode generates 6 uppercase characters without ambiguous letters', () => {
  const code = generatePairingCode();
  assert.equal(code.length, 6);
  assert.match(code, /^[2-9A-HJ-KM-NP-Z]{6}$/);
  assert.ok(!code.includes('0') && !code.includes('O') && !code.includes('1') && !code.includes('I'));
});
