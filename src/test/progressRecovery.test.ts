import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureCorruptProgress, loadProgress, parseProgress, recoverCorruptProgress, saveProgress } from '@/lib/progress';
import type { ProgressData } from '@/lib/types';

const userId = 'recovery-user-a';
const accountKey = `math-k6-progress:${userId}`;
const backupPrefix = `${accountKey}:corrupt-backup:`;
const raw = '{\n  "label": "恢复样本🌱",\n  "unfinished":';
const attemptKey = 'g3-fraction-intro|initial|a|fraction-intro-2026-09-11-v1';
const candidate: ProgressData = {
  passedKnowledgePoints: ['g3-fraction-intro'],
  stars: { 'g3-fraction-intro': 3 },
  courseAttempts: { [attemptKey]: { id: 'quarantined', settled: true } },
};
const backupKeys = () => Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)!)
  .filter(key => key.startsWith(backupPrefix));
const capture = () => {
  localStorage.setItem(accountKey, raw);
  return captureCorruptProgress(userId)!;
};

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('explicit account progress recovery', () => {
  it.each([raw, '', 'null', '[]', '17', 'false', '"old text"'])('captures malformed storage and refuses an ordinary overwrite: %j', (broken) => {
    localStorage.setItem(accountKey, broken);
    expect(captureCorruptProgress(userId)).toEqual({ key: accountKey, raw: broken });
    expect(saveProgress(candidate, userId)).toBe(false);
    expect(localStorage.getItem(accountKey)).toBe(broken);
    expect(backupKeys()).toEqual([]);
  });

  it('does not treat missing storage or legacy JSON objects as corrupt', () => {
    expect(captureCorruptProgress(userId)).toBeNull();
    for (const valid of ['{}', '{"passedKnowledgePoints":[]}', JSON.stringify(candidate)]) {
      localStorage.setItem(accountKey, valid);
      expect(captureCorruptProgress(userId)).toBeNull();
    }
  });

  it('keeps an empty account entry from falling back to owned legacy progress', () => {
    localStorage.setItem('math-k6-progress-owner', userId);
    localStorage.setItem('math-k6-progress', JSON.stringify(candidate));
    localStorage.setItem(accountKey, '');
    expect(loadProgress(userId).passedKnowledgePoints).toEqual([]);
    expect(saveProgress(candidate, userId)).toBe(false);
    expect(localStorage.getItem(accountKey)).toBe('');
    expect(captureCorruptProgress(userId)).toEqual({ key: accountKey, raw: '' });
  });

  it('backs up exact original text before restoring and verifying the caller candidate', () => {
    const snapshot = capture();
    expect(recoverCorruptProgress(snapshot, candidate, userId, () => true)).toBe(true);
    expect(backupKeys()).toHaveLength(1);
    expect(localStorage.getItem(backupKeys()[0])).toBe(raw);
    expect(loadProgress(userId)).toEqual(parseProgress(candidate));
    expect(loadProgress(userId).courseAttempts?.[attemptKey].settled).toBe(true);
    expect(captureCorruptProgress(userId)).toBeNull();
    expect(saveProgress(candidate, userId)).toBe(true);
    expect(recoverCorruptProgress(snapshot, candidate, userId, () => true)).toBe(false);
    expect(backupKeys()).toHaveLength(1);
  });

  it('does not touch an unowned or another-account legacy value, and recovers owned legacy into the scoped key', () => {
    localStorage.setItem('math-k6-progress', raw);
    expect(captureCorruptProgress(userId)).toBeNull();
    localStorage.setItem('math-k6-progress-owner', 'another-user');
    expect(captureCorruptProgress(userId)).toBeNull();
    localStorage.setItem('math-k6-progress-owner', userId);
    const snapshot = captureCorruptProgress(userId)!;
    expect(snapshot).toEqual({ key: 'math-k6-progress', raw });
    expect(recoverCorruptProgress(snapshot, candidate, userId, () => true)).toBe(true);
    expect(localStorage.getItem('math-k6-progress')).toBe(raw);
    expect(localStorage.getItem('math-k6-progress-owner')).toBe(userId);
    expect(loadProgress(userId)).toEqual(parseProgress(candidate));
    expect(localStorage.getItem('math-k6-progress:another-user')).toBeNull();
  });

  it('refuses a snapshot from a different account even when its raw bytes match', () => {
    const snapshot = capture();
    localStorage.setItem('math-k6-progress:recovery-user-b', raw);
    expect(recoverCorruptProgress(snapshot, candidate, 'recovery-user-b', () => true)).toBe(false);
    expect(localStorage.getItem(accountKey)).toBe(raw);
    expect(localStorage.getItem('math-k6-progress:recovery-user-b')).toBe(raw);
    expect(backupKeys()).toEqual([]);
  });

  it('does not overwrite an older backup if a generated backup key already exists', () => {
    const snapshot = capture();
    const backupId = '11111111-1111-4111-8111-111111111111';
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(backupId);
    localStorage.setItem(`${backupPrefix}${backupId}`, 'previous incident');
    expect(recoverCorruptProgress(snapshot, candidate, userId, () => true)).toBe(false);
    expect(localStorage.getItem(`${backupPrefix}${backupId}`)).toBe('previous incident');
    expect(localStorage.getItem(accountKey)).toBe(raw);
  });

  it.each(['{}', '{"newer":', ''])('refuses a snapshot changed while the trusted read was pending: %j', (newRaw) => {
    const snapshot = capture();
    localStorage.setItem(accountKey, newRaw);
    expect(recoverCorruptProgress(snapshot, candidate, userId, () => true)).toBe(false);
    expect(localStorage.getItem(accountKey)).toBe(newRaw);
    expect(backupKeys()).toEqual([]);
  });

  it('refuses an inactive account before creating a backup', () => {
    const snapshot = capture();
    expect(recoverCorruptProgress(snapshot, candidate, userId, () => false)).toBe(false);
    expect(localStorage.getItem(accountKey)).toBe(raw);
    expect(backupKeys()).toEqual([]);
  });

  it.each(['throw', 'mismatch'] as const)('does not overwrite active storage when backup verification fails: %s', (failure) => {
    const snapshot = capture();
    const originalSet = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key.startsWith(backupPrefix)) {
        if (failure === 'throw') throw new Error('storage unavailable');
        return originalSet.call(this, key, 'incomplete-backup');
      }
      return originalSet.call(this, key, value);
    });
    expect(recoverCorruptProgress(snapshot, candidate, userId, () => true)).toBe(false);
    expect(localStorage.getItem(accountKey)).toBe(raw);
  });

  it.each(['inactive', 'changed'] as const)('rechecks account and original after backup readback: %s', (change) => {
    const snapshot = capture();
    let active = true;
    const originalSet = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      originalSet.call(this, key, value);
      if (key.startsWith(backupPrefix)) {
        if (change === 'inactive') active = false;
        else originalSet.call(this, accountKey, '{"newer":true}');
      }
    });
    expect(recoverCorruptProgress(snapshot, candidate, userId, () => active)).toBe(false);
    expect(localStorage.getItem(accountKey)).toBe(change === 'inactive' ? raw : '{"newer":true}');
    expect(localStorage.getItem(backupKeys()[0])).toBe(raw);
  });

  it.each(['throw', 'mismatch'] as const)('reports final restore failures while preserving the verified backup: %s', (failure) => {
    const snapshot = capture();
    const originalSet = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === accountKey) {
        if (failure === 'throw') throw new Error('restore unavailable');
        return originalSet.call(this, key, '{"incomplete":true}');
      }
      return originalSet.call(this, key, value);
    });
    expect(recoverCorruptProgress(snapshot, candidate, userId, () => true)).toBe(false);
    expect(localStorage.getItem(backupKeys()[0])).toBe(raw);
    if (failure === 'throw') expect(localStorage.getItem(accountKey)).toBe(raw);
  });

  it('keeps storage exceptions and ordinary-save diagnostics free of original contents', () => {
    capture();
    expect(saveProgress(candidate, userId)).toBe(false);
    expect(console.error).toHaveBeenCalledWith('Failed to save progress.');
    expect(vi.mocked(console.error).mock.calls.flat().every(value => !String(value).includes(raw))).toBe(true);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error(raw); });
    expect(() => captureCorruptProgress(userId)).toThrow('Unable to read account progress storage.');
    expect(recoverCorruptProgress({ key: accountKey, raw }, candidate, userId, () => true)).toBe(false);
  });
});
