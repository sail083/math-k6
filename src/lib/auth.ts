const PHONE_RE = /^1[3-9]\d{9}$/;
const USERNAME_RE = /^[a-z][a-z0-9_-]{2,31}$/i;

export function normalizeLoginIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

export function isValidLoginIdentifier(identifier: string): boolean {
  const normalized = normalizeLoginIdentifier(identifier);
  return PHONE_RE.test(normalized) || USERNAME_RE.test(normalized);
}
