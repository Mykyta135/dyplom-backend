import { SetMetadata } from '@nestjs/common';
export const AUDIT_LOG_KEY = 'audit_log';
export const Audit = (action: string) => SetMetadata(AUDIT_LOG_KEY, action);
