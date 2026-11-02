import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ProgressProvider, useProgress } from '@/context/ProgressContext';
import * as content from '@/lib/content';
import { claimCourseAttempt, loadProgress, saveProgress } from '@/lib/progress';
import type { ProgressData } from '@/lib/types';

const mocks = vi.hoisted(() => ({ user: { id: 'recovery-user' }, read: vi.fn(), update: vi.fn(), rpc: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/lib/supabase', () => ({
  logLearningEvent: vi.fn(),
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: mocks.read }) }),
      update: (payload: unknown) => ({ eq: (field: string, id: string) => mocks.update(payload, field, id) }),
    }),
    rpc: mocks.rpc,
  },
}));

const storageKey = 'math-k6-progress:recovery-user';
const badRaw = '{"private-damaged-progress":';
const oldKey = 'g3-fraction-intro|initial|a|fraction-intro-2026-09-11-v1';
const remote: ProgressData = {
  passedKnowledgePoints: ['g3-fraction-compare'], stars: { 'g3-fraction-compare': 3 },
  mastery: { 'g3-fraction-compare': { status: 'stable', delayedReviewCount: 2, lastAttemptAt: 42, nextReviewAt: 0 } },
  courseAttempts: { [oldKey]: { id: 'old-session', settled: false } },
};
const response = { data: { progress: remote, language_progress: { chinese: {
  completedLessonIds: ['zh-campus-words'], currentLessonId: 'zh-campus-reading', updatedAt: 2,
} } }, error: null };

function ProgressProbe() {
  const { progress, setCurrentLearning } = useProgress();
  return <><output data-testid="progress">{JSON.stringify(progress)}</output>
    <button onClick={() => setCurrentLearning('g4-angle')}>继续当前学习</button></>;
}

beforeEach(() => {
  localStorage.clear();
  mocks.user = { id: 'recovery-user' };
  mocks.read.mockReset().mockResolvedValue(response);
  mocks.update.mockReset().mockResolvedValue({ error: null });
  mocks.rpc.mockReset().mockResolvedValue({ error: null });
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('corrupt progress recovery through the actual provider', () => {
  it('backs up raw bytes, restores remote and in-session work, and retires every published old form', async () => {
    const keys = await content.loadPublishedCourseAttemptKeys();
    expect(keys.length).toBeGreaterThanOrEqual(12);
    for (const kp of content.getAllKnowledgePoints()) {
      const detail = await content.loadKnowledgePointDetail(kp.meta.id);
      if (!detail?.game?.evidenceVersion) continue;
      for (const mode of ['initial', 'd1', 'd7']) for (const form of ['a', 'b']) {
        expect(keys).toContain(`${kp.meta.id}|${mode}|${form}|${detail.game.evidenceVersion}`);
      }
    }
    localStorage.setItem(storageKey, badRaw);
    let resolveRead!: (value: typeof response) => void;
    mocks.read.mockReturnValue(new Promise((resolve) => { resolveRead = resolve; }));
    render(<ProgressProvider><ProgressProbe /></ProgressProvider>);
    fireEvent.click(screen.getByRole('button', { name: '继续当前学习' }));
    expect(mocks.update).not.toHaveBeenCalled();
    await act(async () => { resolveRead(response); });
    await screen.findByText(/已用云端记录恢复本机进度/);
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    const saved = loadProgress(mocks.user.id);
    expect(saved).toMatchObject({ ...remote, currentLearning: 'g4-angle',
      courseAttempts: { [oldKey]: { settled: true } },
      languageLessons: { chinese: { completedLessonIds: ['zh-campus-words'] } },
    });
    for (const key of keys) {
      expect(saved.courseAttempts?.[key].settled).toBe(true);
      expect(claimCourseAttempt(saved, key, 'repeat', mocks.user.id).claim).toBeNull();
    }
    const backupKeys = Object.keys(localStorage).filter((key) => key !== storageKey);
    expect(backupKeys.some((key) => key.includes(mocks.user.id) && localStorage.getItem(key) === badRaw)).toBe(true);
    const upload = mocks.update.mock.lastCall![0].progress;
    expect(upload.courseAttempts).toEqual(saved.courseAttempts);
    expect(upload.mastery).toMatchObject(remote.mastery!);
    expect(upload.languageLessons).toBeUndefined();
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('private-damaged-progress');
    // Only genuinely new versions remain eligible, never the restored old forms.
    expect(claimCourseAttempt(saved, 'g3-fraction-intro|initial|a|genuinely-new-question-set', 'fresh', mocks.user.id).claim).toBe('fresh');
  });

  it.each([
    { data: null, error: null },
    { data: { progress: null }, error: null },
    { data: { progress: [] }, error: null },
    { data: null, error: new Error('offline') },
  ])('does not replace bad cache from an unavailable or malformed remote snapshot: %j', async (result) => {
    localStorage.setItem(storageKey, badRaw);
    mocks.read.mockResolvedValue(result);
    const catalog = vi.spyOn(content, 'loadPublishedCourseAttemptKeys');
    render(<ProgressProvider><ProgressProbe /></ProgressProvider>);
    await screen.findByRole('button', { name: '重试恢复进度' });
    expect(localStorage.getItem(storageKey)).toBe(badRaw);
    expect(catalog).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
    mocks.read.mockResolvedValue(response);
    fireEvent.click(screen.getByRole('button', { name: '重试恢复进度' }));
    await screen.findByText(/已用云端记录恢复本机进度/);
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
  });

  it('leaves the original untouched and uploads nothing if the catalog cannot be verified', async () => {
    localStorage.setItem(storageKey, badRaw);
    vi.spyOn(content, 'loadPublishedCourseAttemptKeys').mockRejectedValue(new Error('chunk unavailable'));
    render(<ProgressProvider><ProgressProbe /></ProgressProvider>);
    await screen.findByRole('button', { name: '重试恢复进度' });
    expect(localStorage.getItem(storageKey)).toBe(badRaw);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each(['null', '[]', '42', '"text"', ''])('does not autosave over a malformed shape %j before the remote read', async (raw) => {
    localStorage.setItem(storageKey, raw);
    let resolveRead!: (value: typeof response) => void;
    mocks.read.mockReturnValue(new Promise((resolve) => { resolveRead = resolve; }));
    vi.useFakeTimers();
    render(<ProgressProvider><ProgressProbe /></ProgressProvider>);
    fireEvent.click(screen.getByRole('button', { name: '继续当前学习' }));
    await act(async () => { vi.advanceTimersByTime(600); });
    expect(localStorage.getItem(storageKey)).toBe(raw);
    expect(mocks.update).not.toHaveBeenCalled();
    vi.useRealTimers();
    await act(async () => { resolveRead(response); });
    await screen.findByText(/已用云端记录恢复本机进度/);
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(loadProgress(mocks.user.id).courseAttempts?.[oldKey].settled).toBe(true);
  });

  it.each(['backup', 'replacement'] as const)('does not sync when the %s write fails', async (failureSite) => {
    localStorage.setItem(storageKey, badRaw);
    const originalSet = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if ((failureSite === 'backup' && key.includes(':corrupt-backup:'))
        || (failureSite === 'replacement' && key === storageKey)) throw new Error('storage full');
      originalSet.call(this, key, value);
    });
    render(<ProgressProvider><ProgressProbe /></ProgressProvider>);
    await screen.findByRole('button', { name: '重试恢复进度' });
    expect(localStorage.getItem(storageKey)).toBe(badRaw);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('does not overwrite another tab that repaired the cache while the catalog loaded', async () => {
    localStorage.setItem(storageKey, badRaw);
    let resolveCatalog!: (keys: string[]) => void;
    const catalog = vi.spyOn(content, 'loadPublishedCourseAttemptKeys').mockReturnValue(new Promise((resolve) => { resolveCatalog = resolve; }));
    render(<ProgressProvider><ProgressProbe /></ProgressProvider>);
    await waitFor(() => expect(catalog).toHaveBeenCalled());
    const otherTab = JSON.stringify({ passedKnowledgePoints: ['g6-ratio'], stars: { 'g6-ratio': 2 } });
    localStorage.setItem(storageKey, otherTab);
    await act(async () => { resolveCatalog([oldKey]); });
    await screen.findByRole('button', { name: '重试恢复进度' });
    expect(localStorage.getItem(storageKey)).toBe(otherTab);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('discards recovery work after an account change', async () => {
    localStorage.setItem(storageKey, badRaw);
    let resolveCatalog!: (keys: string[]) => void;
    const catalog = vi.spyOn(content, 'loadPublishedCourseAttemptKeys').mockReturnValue(new Promise((resolve) => { resolveCatalog = resolve; }));
    const view = render(<ProgressProvider key="old"><ProgressProbe /></ProgressProvider>);
    await waitFor(() => expect(catalog).toHaveBeenCalled());
    mocks.user = { id: 'another-user' };
    mocks.read.mockResolvedValue({ data: { progress: {} }, error: null });
    view.rerender(<ProgressProvider key="new"><ProgressProbe /></ProgressProvider>);
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    await act(async () => { resolveCatalog([oldKey]); });
    expect(localStorage.getItem(storageKey)).toBe(badRaw);
    expect(mocks.update.mock.calls.every((call) => call[2] === 'another-user')).toBe(true);
    expect(loadProgress('another-user').courseAttempts).toBeUndefined();
  });

  it('never loads the recovery catalog during an ordinary successful sync', async () => {
    saveProgress({ passedKnowledgePoints: [], stars: {} }, mocks.user.id);
    const catalog = vi.spyOn(content, 'loadPublishedCourseAttemptKeys');
    render(<ProgressProvider><ProgressProbe /></ProgressProvider>);
    await waitFor(() => expect(mocks.update).toHaveBeenCalled());
    expect(catalog).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('学习进度恢复')).not.toBeInTheDocument();
  });
});
