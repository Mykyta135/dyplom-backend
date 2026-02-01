import { SetMetadata } from '@nestjs/common';

export const AUDIT_METADATA_KEY = 'audit_payload_fields';

/**
 * Decorator to specify which fields of the request body to include in the audit log.
 * @param fields An array of keys to extract from the request body.
 *         If not provided, the payload will be empty.
 */
export const Audit = (fields?: string[]) =>
  SetMetadata(AUDIT_METADATA_KEY, fields ?? []);
