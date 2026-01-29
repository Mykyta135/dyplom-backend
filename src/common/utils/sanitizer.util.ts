const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
];

export function sanitizeObject(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item: unknown) => sanitizeObject(item));
  }

  const record = obj as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  for (const key of Object.keys(record)) {
    const value = record[key];

    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeObject(value);
    }
  }

  return sanitized;
}
