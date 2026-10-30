/**
 * Redaction Sanitizer
 * Enforces REQ-SEC-003: Comprehensive redaction of passwords, PSKs, tokens,
 * cookies, auth headers, and private keys from logs, technical details, and payloads.
 */

const SECRET_PATTERNS: RegExp[] = [
  /password\s*[:=]\s*["']?([^"',;\s]+)["']?/gi,
  /passphrase\s*[:=]\s*["']?([^"',;\s]+)["']?/gi,
  /keyMaterial\s*[:=]\s*["']?([^"',;\s]+)["']?/gi,
  /<keyMaterial>([^<]+)<\/keyMaterial>/gi,
  /psk\s*[:=]\s*["']?([^"',;\s]+)["']?/gi,
  /token\s*[:=]\s*["']?([^"',;\s]+)["']?/gi,
  /bearer\s+([a-zA-Z0-9_\-\.]+)/gi,
  /cookie\s*[:=]\s*["']?([^"',;\s]+)["']?/gi,
  /auth(orization)?\s*[:=]\s*["']?([^"',;\s]+)["']?/gi,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gi,
  /api[_-]?key\s*[:=]\s*["']?([^"',;\s]+)["']?/gi
];

const SENSITIVE_KEYS = new Set([
  'password',
  'passphrase',
  'keymaterial',
  'psk',
  'token',
  'authorization',
  'cookie',
  'privatekey',
  'secret',
  'apikey',
  'wificredential'
]);

/**
 * Redacts secrets from a plain string.
 */
export function redactString(input: string): string {
  if (!input || typeof input !== 'string') return input;

  let redacted = input;

  // Redact full private key blocks
  redacted = redacted.replace(
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gi,
    '[REDACTED_PRIVATE_KEY]'
  );

  // Redact keyMaterial in XML
  redacted = redacted.replace(/<keyMaterial>([^<]+)<\/keyMaterial>/gi, '<keyMaterial>[REDACTED_PSK]</keyMaterial>');

  // Redact key-value secrets
  redacted = redacted.replace(
    /(password|passphrase|psk|token|secret|api[_-]?key|cookie)\s*[:=]\s*["']?([^"',;\s&]+)["']?/gi,
    '$1=[REDACTED]'
  );

  // Redact Bearer tokens
  redacted = redacted.replace(/bearer\s+([a-zA-Z0-9_\-\.]+)/gi, 'Bearer [REDACTED_TOKEN]');

  return redacted;
}

/**
 * Recursively redacts objects and arrays without mutating the original.
 */
export function redactObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return redactString(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('secret')) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactObject(value);
      }
    }
    return result as unknown as T;
  }

  return obj;
}
