import { describe, expect, it } from 'vitest';
import {
  isValidLoginIdentifier,
  normalizeLoginIdentifier,
} from '@/lib/auth';

describe('login identifier rules', () => {
  it('accepts and normalizes the administrator username', () => {
    expect(isValidLoginIdentifier(' Admin ')).toBe(true);
    expect(normalizeLoginIdentifier(' Admin ')).toBe('admin');
  });

  it('keeps valid phone logins and rejects malformed identifiers', () => {
    expect(isValidLoginIdentifier('13800138000')).toBe(true);
    expect(isValidLoginIdentifier('123')).toBe(false);
    expect(isValidLoginIdentifier('管理员')).toBe(false);
  });
});
