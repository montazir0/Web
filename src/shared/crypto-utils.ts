/**
 * Cryptographic & Replay Protection Utilities
 * Enforces REQ-SEC-001 & Agent Pairing / Signature Contracts
 */

import crypto from 'node:crypto';

// Safe character set for pairing codes (excludes ambiguous chars 0, O, 1, I, L)
const PAIRING_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generates a clean 6-character one-time pairing code
 */
export function generatePairingCode(): string {
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += PAIRING_CHARS[bytes[i] % PAIRING_CHARS.length];
  }
  return code;
}

/**
 * Generates a cryptographically strong random nonce
 */
export function generateNonce(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Computes SHA-256 fingerprint for public keys or file bytes
 */
export function computeSha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Computes formatted SHA-256 fingerprint (colon-separated uppercase)
 */
export function formatFingerprint(sha256Hex: string): string {
  const clean = sha256Hex.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
  return clean.match(/.{1,2}/g)?.slice(0, 16).join(':') || sha256Hex;
}

/**
 * In-memory replay cache to protect against replay attacks within a time window
 */
export class ReplayGuard {
  private seenNonces = new Map<string, number>();
  private readonly windowMs: number;

  constructor(windowSeconds = 300) {
    this.windowMs = windowSeconds * 1000;
  }

  /**
   * Validates a request's timestamp and nonce.
   * Returns true if request is fresh and nonce has not been used.
   */
  public validate(nonce: string, timestampIso: string, nowMs = Date.now()): { valid: boolean; reason?: string } {
    if (!nonce || nonce.length < 16) {
      return { valid: false, reason: 'Missing or short nonce' };
    }

    const requestTime = new Date(timestampIso).getTime();
    if (isNaN(requestTime)) {
      return { valid: false, reason: 'Invalid ISO timestamp' };
    }

    // Check if timestamp is outside the allowed window (±windowMs)
    if (Math.abs(nowMs - requestTime) > this.windowMs) {
      return { valid: false, reason: 'Request timestamp is outside allowed time window (clock skew or expired)' };
    }

    // Clean up expired nonces
    this.cleanup(nowMs);

    // Check if nonce was already seen
    if (this.seenNonces.has(nonce)) {
      return { valid: false, reason: 'Replay detected: Nonce has already been consumed' };
    }

    // Record nonce with its expiry time
    this.seenNonces.set(nonce, nowMs + this.windowMs);
    return { valid: true };
  }

  private cleanup(nowMs: number): void {
    for (const [nonce, expiry] of this.seenNonces.entries()) {
      if (expiry <= nowMs) {
        this.seenNonces.delete(nonce);
      }
    }
  }

  public clear(): void {
    this.seenNonces.clear();
  }
}
