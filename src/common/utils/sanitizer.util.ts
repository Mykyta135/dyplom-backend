// File: backend/src/common/utils/sanitizer.util.ts

const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
];

/**
 * Recursively redacts sensitive keys from an object.
 * Uses 'unknown' instead of 'any' for type safety.
 */
export function sanitizeObject(obj: unknown): unknown {
  // 1. Handle primitives and null
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // 2. Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map((item: unknown) => sanitizeObject(item));
  }

  // 3. Handle Objects
  // We cast to Record<string, unknown> after checking it's an object
  const record = obj as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  for (const key of Object.keys(record)) {
    const value = record[key];

    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      // Recursively sanitize nested objects/arrays
      sanitized[key] = sanitizeObject(value);
    }
  }

  return sanitized;
}
