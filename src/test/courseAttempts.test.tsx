import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import GameRunner from '@/components/GameRunner';
import { ProgressProvider, useProgress } from '@/context/ProgressContext';
import { claimCourseAttempt, DAY_MS, hasMeaningfulProgress, loadProgress, markInitialPass, markDelayedReviewPass, mergeCourseAttempts, parseProgress, saveProgress, toRemoteMathProgress } from '@/lib/progress';
import type { GameConfig, ProgressData, Question } from '@/lib/types';
import publishedGame from '@/content/knowledge-points/g3-fraction-compare/game.json';
import introPublishedGame from '@/content/knowledge-points/g3-fraction-intro/game.json';
import { getAllKnowledgePoints, loadKnowledgePointDetail } from '@/lib/content';

const account = vi.hoisted(() => ({ user: { id: 'attempt-user-a' } }));
const sync = vi.hoisted(() => ({ single: vi.fn(), update: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => account }));
vi.mock('@/lib/supabase', () => ({ logLearningEvent: vi.fn(), supabase: {
  from: () => ({ select: () => ({ eq: () => ({ single: sync.single }) }), update: () => ({ eq: sync.update }) }),
  rpc: vi.fn(async () => ({ data: {}, error: null })),
} }));

const game = publishedGame as GameConfig;
const courseId = game.knowledgePointId;
const NOW = 1_800_000_000_000;
const key = (mode = 'initial', form = 'a') => `${courseId}|${mode}|${form}|${game.evidenceVersion}`;
const empty = (): ProgressData => ({ passedKnowledgePoints: [], stars: {} });
let context: ReturnType<typeof useProgress>;
function Probe() { context = useProgress(); return null; }
function Session({ mode = null, onPassed, config = game }: { mode?: 'd1' | 'd7' | null; onPassed: () => void; config?: GameConfig }) {
  const [playing, setPlaying] = useState(true);
  return <ProgressProvider key={account.user.id}><Probe />{playing
    ? <GameRunner game={config} knowledgePointId={config.knowledgePointId} reviewMode={mode} onPassed={onPassed} onReviewCourse={() => setPlaying(false)} />
    : <button onClick={() => setPlaying(true)}>返回挑战</button>}</ProgressProvider>;
}
async function mount(mode: 'd1' | 'd7' | null = null, config = game) {
  const onPassed = vi.fn();
  const mounted = render(<Session mode={mode} onPassed={onPassed} config={config} />);
  await waitFor(() => expect(sync.update).toHaveBeenCalled());
  return { ...mounted, onPassed };
}
function answerAll(questions: Question[], failTransfer = false) {
  questions.forEach((question, index) => {
    if (question.type === 'choice') fireEvent.click(screen.getByRole('button', { name: name => name.endsWith(String(question.correctAnswer)) }));
    else {
      const input = screen.getByPlaceholderText('在此输入你的答案');
      for (let attempt = 0; attempt < (failTransfer ? 2 : 1); attempt++) {
        fireEvent.change(input, { target: { value: failTransfer ? '99/100' : question.correctAnswer } });
        fireEvent.click(screen.getByRole('button', { name: '确认' }));
      }
    }
    fireEvent.click(screen.getByRole('button', { name: index === questions.length - 1 ? '查看结果' : '下一题' }));
  });
}
const evidence = () => Object.values(context.progress.skillEvidence ?? {}).reduce((sum, record) => sum + record.transfer + record.retention, 0);

beforeEach(() => {
  localStorage.clear(); account.user = { id: 'attempt-user-a' };
  sync.single.mockReset().mockResolvedValue({ data: { progress: {}, language_progress: {} }, error: null });
  sync.update.mockReset().mockResolvedValue({ error: null });
  vi.spyOn(Date, 'now').mockReturnValue(NOW);
});
afterEach(() => vi.restoreAllMocks());

describe('persistent course attempt qualification', () => {
  it.each([null, 'd1', 'd7'] as const)('runs the intro course %s A-failure / repeated-A / fresh-B path independently', async (mode) => {
    const intro = introPublishedGame as GameConfig;
    const introId = intro.knowledgePointId;
    const history = { ...empty(), passedKnowledgePoints: [courseId], stars: { [courseId]: 2 } };
    const original = mode ? markInitialPass(history, introId, 3, NOW - DAY_MS, true) : history;
    if (mode === 'd7') original.mastery![introId].delayedReviewCount = 1;
    saveProgress(original, account.user.id);
    const mounted = await mount(mode, intro);
    const formA = mode ? intro.reviewSets![mode]!.questions : intro.questions;
    const formB = mode ? intro.reviewSets![mode]!.alternateQuestions! : intro.alternateQuestions!;
    answerAll(formA, true);
    expect(mounted.onPassed).not.toHaveBeenCalled();
    const before = evidence();
    fireEvent.click(screen.getByRole('button', { name: '再练当前题组' }));
    answerAll(formA);
    expect(screen.getByRole('heading', { name: '原题练习完成' })).toBeVisible();
    expect(evidence()).toBe(before);
    fireEvent.click(screen.getByRole('button', { name: '补学后换B组新题' }));
    fireEvent.click(screen.getByRole('button', { name: '开始B组新题验证' }));
    answerAll(formB);
    expect(mounted.onPassed).toHaveBeenCalledTimes(1);
    expect(context.progress.mastery![introId].delayedReviewCount).toBe(mode === 'd7' ? 2 : mode === 'd1' ? 1 : 0);
    expect(context.progress.courseAttempts![`${introId}|${mode ?? 'initial'}|b|${intro.evidenceVersion}`].settled).toBe(true);
    expect(context.progress.passedKnowledgePoints).toContain(courseId);
    expect(context.progress.stars[courseId]).toBe(2);
    expect(Object.keys(context.progress.courseAttempts!).every(id => id.startsWith(`${introId}|`))).toBe(true);
  });
  it('only enables the strict path for complete, distinct A/B forms using feedback-aware question types', async () => {
    const courses = await Promise.all(getAllKnowledgePoints().map(course => loadKnowledgePointDetail(course.meta.id)));
    const enabled = courses.filter(course => course?.game?.evidenceVersion);
    expect(enabled.map(course => course!.meta.id)).toContain(courseId);
    for (const course of enabled) {
      const config = course!.game!;
      const forms = [config.questions, config.alternateQuestions, config.reviewSets?.d1?.questions,
        config.reviewSets?.d1?.alternateQuestions, config.reviewSets?.d7?.questions, config.reviewSets?.d7?.alternateQuestions];
      for (const form of forms) {
        expect(form?.length).toBeGreaterThan(0);
        expect(form!.some(question => question.type === 'fill-blank')).toBe(true);
        expect(form!.every(question => question.type === 'choice' || question.type === 'fill-blank')).toBe(true);
      }
      const questions = forms.flatMap(form => form!);
      expect(new Set(questions.map(question => question.id)).size).toBe(questions.length);
      expect(new Set(questions.map(question => question.prompt)).size).toBe(questions.length);
    }
  });
  it('reads a newer mastery stage from another tab before skill writes or settlement', async () => {
    const old = markInitialPass(empty(), courseId, 3, NOW - DAY_MS, true);
    saveProgress(old, account.user.id);
    await mount('d1');
    let claim: string | null = null;
    act(() => { claim = context.beginCourseAttempt(key('d1')); });
    expect(claim).not.toBeNull();
    const otherTab = markDelayedReviewPass(loadProgress(account.user.id), courseId, NOW, 'd1');
    saveProgress(otherTab, account.user.id);
    saveProgress(old, account.user.id); // 旧标签页的防抖保存也不能把count1写回0
    saveProgress(empty(), account.user.id);
    expect(loadProgress(account.user.id).mastery![courseId].delayedReviewCount).toBe(1);
    expect(loadProgress(account.user.id).passedKnowledgePoints).toContain(courseId);
    expect(loadProgress(account.user.id).stars[courseId]).toBe(3);
    act(() => context.recordSkillEvidence('frac.compare_same_numerator', true, true, 'transfer', 'd1', { key: key('d1'), id: claim }));
    expect(evidence()).toBe(0);
    let accepted = true;
    act(() => { accepted = context.finishCourseAttempt(key('d1'), claim!, true, 3, true); });
    expect(accepted).toBe(false);
    expect(context.progress.mastery![courseId].delayedReviewCount).toBe(1);
  });
  it('does not grant evidence while the remote account snapshot is still unknown', async () => {
    let resolveRead!: (value: unknown) => void;
    sync.single.mockReturnValue(new Promise(resolve => { resolveRead = resolve; }));
    const onPassed = vi.fn();
    render(<Session onPassed={onPassed} />);
    await waitFor(() => expect(sync.single).toHaveBeenCalled());
    const wrong = game.questions[0].options!.find(option => option !== game.questions[0].correctAnswer)!;
    fireEvent.click(screen.getByRole('button', { name: name => name.endsWith(wrong) }));
    expect(loadProgress(account.user.id).courseAttempts?.[key()]).toBeDefined();
    await act(async () => resolveRead({ data: { progress: { ...empty(), courseAttempts: { [key()]: { id: 'remote-old', settled: true } } }, language_progress: {} }, error: null }));
    answerAll(game.questions);
    expect(onPassed).not.toHaveBeenCalled();
    expect(evidence()).toBe(0);
    expect(Object.values(context.progress.skillEvidence ?? {}).every(record => record.firstTryCorrect === 0)).toBe(true);
  });

  it('keeps a stale D1 page from earning B-form transfer after D1 has already passed', async () => {
    saveProgress(markInitialPass(empty(), courseId, 3, NOW - DAY_MS, true), account.user.id);
    const mounted = await mount('d1');
    answerAll(game.reviewSets!.d1!.questions);
    const before = evidence();
    fireEvent.click(screen.getByRole('button', { name: '回看讲解' }));
    fireEvent.click(screen.getByRole('button', { name: '返回挑战' }));
    fireEvent.click(screen.getByRole('button', { name: '补学后换B组新题' }));
    fireEvent.click(screen.getByRole('button', { name: '开始B组新题验证' }));
    answerAll(game.reviewSets!.d1!.alternateQuestions!);
    expect(evidence()).toBe(before);
    expect(mounted.onPassed).toHaveBeenCalledTimes(1);
    expect(context.progress.mastery![courseId].delayedReviewCount).toBe(1);
    expect(screen.getByRole('heading', { name: '原题练习完成' })).toBeVisible();
  });

  it('rechecks the stage on each skill write even when the session originally had a valid claim', async () => {
    saveProgress(markInitialPass(empty(), courseId, 3, NOW - DAY_MS, true), account.user.id);
    await mount('d1');
    let claim: string | null = null;
    act(() => { claim = context.beginCourseAttempt(key('d1')); });
    expect(claim).not.toBeNull();
    act(() => { context.markDelayedReviewPass(courseId, 'd1'); });
    act(() => context.recordSkillEvidence('frac.compare_same_numerator', true, true, 'transfer', 'd1', { key: key('d1'), id: claim }));
    expect(evidence()).toBe(0);
  });

  it('does not let another tab or an old delayed save erase consumed or settled records', () => {
    const claimed = claimCourseAttempt(empty(), key(), 'first-tab', account.user.id);
    expect(claimed.claim).toBe('first-tab');
    saveProgress(empty(), account.user.id);
    expect(claimCourseAttempt(empty(), key(), 'stale-tab', account.user.id).claim).toBeNull();
    saveProgress({ ...claimed.progress, courseAttempts: { [key()]: { id: 'first-tab', settled: true } } }, account.user.id);
    saveProgress(claimed.progress, account.user.id);
    expect(loadProgress(account.user.id).courseAttempts?.[key()].settled).toBe(true);
  });

  it.each(['choice', 'fill-blank'] as const)('persists before the first wrong %s feedback and survives an immediate remount', async (type) => {
    const question = game.questions.find(item => item.type === type)!;
    const config = { ...game, questions: [question] };
    const first = await mount(null, config);
    expect(loadProgress(account.user.id).courseAttempts).toBeUndefined();
    if (type === 'choice') fireEvent.click(screen.getByRole('button', { name: name => name.endsWith(question.options!.find(option => option !== question.correctAnswer)!) }));
    else {
      fireEvent.change(screen.getByPlaceholderText('在此输入你的答案'), { target: { value: '99/100' } });
      expect(loadProgress(account.user.id).courseAttempts).toBeUndefined();
      fireEvent.click(screen.getByRole('button', { name: '确认' }));
    }
    expect(loadProgress(account.user.id).courseAttempts?.[key()]).toMatchObject({ settled: false });
    expect(context.progress.skillEvidence ?? {}).toEqual({}); // 第一错尚未走onAnswer，题组却已消费
    first.unmount();
    const resumed = await mount(null, config);
    answerAll(config.questions);
    expect(screen.getByRole('heading', { name: '原题练习完成' })).toBeVisible();
    expect(resumed.onPassed).not.toHaveBeenCalled();
    expect(Object.values(context.progress.skillEvidence ?? {}).every(record => record.firstTryCorrect === 0)).toBe(true);
  });

  it('keeps repeated A practice out of mastery, then accepts a genuinely new B after the repair step', async () => {
    const mounted = await mount();
    answerAll(game.questions, true);
    expect(mounted.onPassed).not.toHaveBeenCalled();
    const before = evidence();
    fireEvent.click(screen.getByRole('button', { name: '回看讲解' }));
    fireEvent.click(screen.getByRole('button', { name: '返回挑战' }));
    answerAll(game.questions);
    expect(screen.getByRole('heading', { name: '原题练习完成' })).toBeVisible();
    expect(evidence()).toBe(before);
    expect(context.progress.passedKnowledgePoints).not.toContain(courseId);
    fireEvent.click(screen.getByRole('button', { name: '补学后换B组新题' }));
    expect(screen.getByRole('heading', { name: '先对照解析补学' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '开始B组新题验证' }));
    answerAll(game.alternateQuestions!);
    expect(mounted.onPassed).toHaveBeenCalledTimes(1);
    expect(context.progress.passedKnowledgePoints).toContain(courseId);
    expect(loadProgress(account.user.id).mastery?.[courseId].nextReviewAt).toBe(NOW + DAY_MS);
    expect(context.progress.courseAttempts?.[key('initial', 'b')].settled).toBe(true);
  });

  it.each(['d1', 'd7'] as const)('rejects repeated %s A evidence and advances the fresh B stage only once', async (mode) => {
    const initial = markInitialPass(empty(), courseId, 3, NOW - DAY_MS, true);
    if (mode === 'd7') initial.mastery![courseId].delayedReviewCount = 1;
    saveProgress(initial, account.user.id);
    const mounted = await mount(mode);
    const review = game.reviewSets![mode]!;
    answerAll(review.questions, true);
    const before = evidence();
    fireEvent.click(screen.getByRole('button', { name: '再练当前题组' }));
    answerAll(review.questions);
    expect(evidence()).toBe(before);
    expect(context.progress.mastery![courseId].delayedReviewCount).toBe(mode === 'd1' ? 0 : 1);
    fireEvent.click(screen.getByRole('button', { name: '补学后换B组新题' }));
    fireEvent.click(screen.getByRole('button', { name: '开始B组新题验证' }));
    answerAll(review.alternateQuestions!);
    expect(mounted.onPassed).toHaveBeenCalledTimes(1);
    expect(context.progress.mastery![courseId].delayedReviewCount).toBe(mode === 'd1' ? 1 : 2);
    const claim = context.progress.courseAttempts![key(mode, 'b')].id;
    let duplicate = true;
    act(() => { duplicate = context.finishCourseAttempt(key(mode, 'b'), claim, true, 3, true); });
    expect(duplicate).toBe(false);
    expect(context.progress.stars[courseId]).toBe(3);
  });

  it('does not reset B after failure and preserves existing stable history during practice', async () => {
    const initial = markInitialPass(empty(), courseId, 3, NOW - DAY_MS, true);
    initial.mastery![courseId] = { status: 'stable', lastAttemptAt: NOW, nextReviewAt: 0, delayedReviewCount: 2 };
    saveProgress(initial, account.user.id);
    const mounted = await mount();
    answerAll(game.questions, true);
    fireEvent.click(screen.getByRole('button', { name: '补学后换B组新题' }));
    fireEvent.click(screen.getByRole('button', { name: '开始B组新题验证' }));
    answerAll(game.alternateQuestions!, true);
    const before = evidence();
    fireEvent.click(screen.getByRole('button', { name: '再练当前题组' }));
    answerAll(game.alternateQuestions!);
    expect(evidence()).toBe(before);
    expect(mounted.onPassed).not.toHaveBeenCalled();
    expect(screen.getByText(/当前两组新题机会已使用/)).toBeVisible();
    expect(context.progress.mastery![courseId].status).toBe('stable');
    expect(context.progress.stars[courseId]).toBe(3);
  });

  it('keeps account claims isolated and never restores a consumed claim from an old snapshot', async () => {
    const first = claimCourseAttempt(empty(), key(), 'claim-a', 'attempt-user-a');
    expect(first.claim).toBe('claim-a');
    expect(claimCourseAttempt(empty(), key(), 'claim-a-again', 'attempt-user-a').claim).toBeNull();
    expect(claimCourseAttempt(empty(), key(), 'claim-b', 'attempt-user-b').claim).toBe('claim-b');
    expect(loadProgress('attempt-user-a').courseAttempts?.[key()].id).toBe('claim-a');
    expect(hasMeaningfulProgress(parseProgress(first.progress))).toBe(true);
    expect(toRemoteMathProgress(first.progress).courseAttempts).toEqual(first.progress.courseAttempts);
    expect(mergeCourseAttempts(first.progress.courseAttempts, {})).toEqual(first.progress.courseAttempts);
    const mounted = await mount(); // 实际Provider读回旧远端空快照仍保留本机消费
    expect(context.progress.courseAttempts?.[key()].id).toBe('claim-a');
    mounted.unmount();
    account.user = { id: 'attempt-user-b' };
    await mount();
    expect(context.progress.courseAttempts?.[key()].id).toBe('claim-b');
  });

  it('allows practice but grants no fresh evidence when synchronous storage fails', async () => {
    const mounted = await mount();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    answerAll(game.questions);
    expect(screen.getByRole('heading', { name: '原题练习完成' })).toBeVisible();
    expect(evidence()).toBe(0);
    expect(context.progress.passedKnowledgePoints).not.toContain(courseId);
    expect(mounted.onPassed).not.toHaveBeenCalled();
  });

  it('does not settle an early D7 or emit completion after the durable result save fails', async () => {
    saveProgress(markInitialPass(empty(), courseId, 3, NOW, true), account.user.id);
    await mount();
    let claim: string | null = null;
    act(() => { claim = context.beginCourseAttempt(key('d7')); });
    let accepted = true;
    act(() => { accepted = context.finishCourseAttempt(key('d7'), claim!, true, 3, true); });
    expect(accepted).toBe(false);
    expect(context.progress.mastery![courseId].delayedReviewCount).toBe(0);
    act(() => { claim = context.beginCourseAttempt(key('initial', 'b')); });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    act(() => { accepted = context.finishCourseAttempt(key('initial', 'b'), claim!, true, 3, true); });
    expect(accepted).toBe(false);
    expect(context.progress.courseAttempts![key('initial', 'b')].settled).toBe(true);
  });

  it('unions consumed and settled records deterministically, with damaged existing records failing closed', () => {
    const a = { [key()]: { id: 'a', settled: false } };
    const b = { [key()]: { id: 'b', settled: true } };
    expect(mergeCourseAttempts(a, b)).toEqual(mergeCourseAttempts(b, a));
    expect(mergeCourseAttempts(a, b)?.[key()]).toEqual({ id: 'a', settled: true });
    const parsed = parseProgress({ ...empty(), courseAttempts: { [key()]: null, invalid: { id: 'x', settled: false } } });
    expect(parsed.courseAttempts).toEqual({ [key()]: { id: 'invalid-record', settled: true } });
    expect(claimCourseAttempt(parsed, key(), 'new', account.user.id).claim).toBeNull();
  });
});
