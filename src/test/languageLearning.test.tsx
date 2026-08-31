import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { chineseLessons } from '@/content/chinese';
import LanguageSubjectPage, { LessonPractice } from '@/pages/LanguageSubjectPage';
import type { LanguageLesson, ProgressData } from '@/lib/types';
import { saveProgress } from '@/lib/progress';

const progressMocks = vi.hoisted(() => ({
  progress: { passedKnowledgePoints: [], stars: {} } as ProgressData,
  startLanguageLesson: vi.fn(),
  completeLanguageLesson: vi.fn(),
}));

const syncMocks = vi.hoisted(() => ({
  user: { id: 'sync-user' },
  single: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
}));

vi.mock('@/context/ProgressContext', () => ({
  useProgress: () => progressMocks,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: syncMocks.user }),
}));

vi.mock('@/lib/supabase', () => ({
  logLearningEvent: vi.fn(),
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: syncMocks.single }) }),
      update: (value: unknown) => {
        syncMocks.update(value);
        return { eq: syncMocks.updateEq };
      },
    }),
  },
}));

const practiceLesson: LanguageLesson = {
  id: 'practice-test',
  title: '测试课',
  summary: '测试 2/3 通过规则',
  body: '测试内容',
  questions: [
    { id: 'p1', type: 'choice', prompt: '第一题', options: ['甲对', '甲错一', '甲错二'], correctAnswer: '甲对', explanation: '第一题依据。', points: 10 },
    { id: 'p2', type: 'choice', prompt: '第二题', options: ['乙对', '乙错一', '乙错二'], correctAnswer: '乙对', explanation: '第二题依据。', points: 10 },
    { id: 'p3', type: 'choice', prompt: '第三题', options: ['丙对', '丙错一', '丙错二'], correctAnswer: '丙对', explanation: '第三题依据。', points: 10 },
  ],
};

function clickOption(label: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }));
}

function nextQuestion(label: '下一题' | '查看结果' = '下一题') {
  fireEvent.click(screen.getByRole('button', { name: label }));
}

function LocationPath() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

beforeEach(() => {
  localStorage.clear();
  syncMocks.user = { id: 'sync-user' };
  progressMocks.progress = { passedKnowledgePoints: [], stars: {} };
  progressMocks.startLanguageLesson.mockReset();
  progressMocks.completeLanguageLesson.mockReset();
  syncMocks.single.mockReset();
  syncMocks.update.mockReset();
  syncMocks.updateEq.mockReset().mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Chinese V0.8 content', () => {
  it('contains exactly three independent lessons with three supported ten-point questions each', () => {
    expect(chineseLessons).toHaveLength(3);
    expect(new Set(chineseLessons.map((lesson) => lesson.id)).size).toBe(3);
    for (const lesson of chineseLessons) {
      expect(lesson.questions).toHaveLength(3);
      expect(lesson.questions.every((question) => question.points === 10)).toBe(true);
      expect(lesson.questions.every((question) => question.type === 'choice' || question.type === 'fill-blank')).toBe(true);
      expect(lesson.questions.every((question) => question.explanation.includes('再试'))).toBe(true);
    }
    expect(JSON.stringify(chineseLessons)).not.toContain('已掌握');
    expect(JSON.stringify(chineseLessons)).not.toContain('露珠');
  });

  it('keeps the reviewed reading text and required answer keys exact', () => {
    expect(chineseLessons[1].body).toBe('清晨，雨刚停，花坛里的泥土还很湿润。林一走进校园，发现小树的枝头长出了几片嫩芽。嫩芽浅绿浅绿的，像刚张开的小手。\n\n他弯下腰仔细观察。一颗小水珠挂在叶尖上，风一吹，水珠便落进泥土里。林一想：嫩芽还要慢慢长大。于是，他没有伸手去摘，只把看到的样子写进观察卡。\n\n放学前，林一又来到花坛。他站在小路边，没有踩进花坛，只在卡上补了一句：“明天，我再来看看。”');
    expect(chineseLessons.map((lesson) => lesson.questions.map((question) => question.correctAnswer))).toEqual([
      ['嫩芽；观察', '湿润', '再'],
      ['林一雨后观察、记录并保护嫩芽', '发现嫩芽→看见水珠→写进观察卡', '观察卡'],
      ['课间，我发现花坛里有嫩芽，就把样子画在观察卡上。', '清晨', '②→③→①'],
    ]);
  });
});

describe('language lesson practice', () => {
  it('passes with two correct answers out of three and calls completion once', () => {
    const onPassed = vi.fn();
    render(<MemoryRouter><LessonPractice lesson={practiceLesson} onPassed={onPassed} nextLessonId="next" /></MemoryRouter>);

    clickOption('甲对');
    nextQuestion();
    clickOption('乙对');
    nextQuestion();
    clickOption('丙错一');
    clickOption('丙错二');
    nextQuestion('查看结果');

    expect(screen.getByRole('heading', { name: '本课完成' })).toBeInTheDocument();
    expect(screen.getByText('答对 2 题，已经达到本课要求。')).toBeInTheDocument();
    expect(onPassed).toHaveBeenCalledTimes(1);
  });

  it('does not complete a failed lesson and restarts from question one', () => {
    const onPassed = vi.fn();
    render(<MemoryRouter><LessonPractice lesson={practiceLesson} onPassed={onPassed} nextLessonId={null} /></MemoryRouter>);

    clickOption('甲对');
    nextQuestion();
    clickOption('乙错一');
    clickOption('乙错二');
    nextQuestion();
    clickOption('丙错一');
    clickOption('丙错二');
    nextQuestion('查看结果');

    expect(screen.getByRole('heading', { name: '再练一次' })).toBeInTheDocument();
    expect(onPassed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '重新练习' }));
    expect(screen.getByText('第一题')).toBeInTheDocument();
  });
});

describe('Chinese subject routes', () => {
  it('starts the first lesson and shows the reviewed content', async () => {
    render(
      <MemoryRouter initialEntries={['/chinese/zh-campus-words']}>
        <Routes><Route path="/chinese/:lessonId" element={<LanguageSubjectPage />} /></Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: '会观察，也会用词' })).toBeInTheDocument();
    expect(screen.getByText(/观察，是有目的地仔细看/)).toBeInTheDocument();
    await waitFor(() => expect(progressMocks.startLanguageLesson).toHaveBeenCalledWith(
      'chinese',
      'zh-campus-words',
      ['zh-campus-words', 'zh-campus-reading', 'zh-campus-speaking'],
    ));
  });

  it('redirects a locked direct link to the Chinese overview', async () => {
    render(
      <MemoryRouter initialEntries={['/chinese/zh-campus-reading']}>
        <Routes>
          <Route path="/chinese" element={<><LanguageSubjectPage /><LocationPath /></>} />
          <Route path="/chinese/:lessonId" element={<><LanguageSubjectPage /><LocationPath /></>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/chinese'));
    expect(screen.getByRole('heading', { level: 1, name: '校园里的小发现' })).toBeInTheDocument();
    expect(progressMocks.startLanguageLesson).not.toHaveBeenCalled();
  });
});

describe('progress remote sync gate', () => {
  it('keeps the initial sync alive when auth refreshes the same user id object', async () => {
    saveProgress({
      passedKnowledgePoints: [],
      stars: {},
      languageLessons: {
        chinese: { completedLessonIds: [], currentLessonId: 'zh-campus-words', updatedAt: 1 },
      },
    }, 'sync-user');
    let resolveRead: (value: { data: { progress: object }; error: null }) => void = () => undefined;
    syncMocks.single.mockReturnValue(new Promise((resolve) => { resolveRead = resolve; }));
    const actual = await vi.importActual<typeof import('@/context/ProgressContext')>('@/context/ProgressContext');

    const { rerender } = render(<actual.ProgressProvider><div>同步中</div></actual.ProgressProvider>);
    await waitFor(() => expect(syncMocks.single).toHaveBeenCalledTimes(1));
    syncMocks.user = { id: 'sync-user' };
    rerender(<actual.ProgressProvider><div>令牌已刷新</div></actual.ProgressProvider>);
    await act(async () => { resolveRead({ data: { progress: {} }, error: null }); });

    await waitFor(() => expect(syncMocks.update).toHaveBeenCalledTimes(1));
  });

  it('merges an in-memory lesson start that happens before the remote read resolves', async () => {
    saveProgress({ passedKnowledgePoints: [], stars: {} }, 'sync-user');
    let resolveRead: (value: { data: { progress: object }; error: null }) => void = () => undefined;
    syncMocks.single.mockReturnValue(new Promise((resolve) => { resolveRead = resolve; }));
    const actual = await vi.importActual<typeof import('@/context/ProgressContext')>('@/context/ProgressContext');

    function StartControl() {
      const { progress, startLanguageLesson } = actual.useProgress();
      return <><button type="button" onClick={() => startLanguageLesson('chinese', 'zh-campus-words', ['zh-campus-words', 'zh-campus-reading'])}>开始课程</button><output data-testid="sync-progress">{progress.languageLessons?.chinese?.currentLessonId ?? ''}</output></>;
    }

    render(<actual.ProgressProvider><StartControl /></actual.ProgressProvider>);
    await waitFor(() => expect(syncMocks.single).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: '开始课程' }));
    await waitFor(() => expect(screen.getByTestId('sync-progress')).toHaveTextContent('zh-campus-words'));
    await act(async () => { resolveRead({ data: { progress: {} }, error: null }); });

    await waitFor(() => expect(syncMocks.update).toHaveBeenCalled());
    expect(syncMocks.update.mock.calls[0][0]).toMatchObject({
      progress: {
        languageLessons: {
          chinese: { currentLessonId: 'zh-campus-words' },
        },
      },
    });
  });

  it('writes a lesson completion that happens while the first merged update is in flight', async () => {
    const lessonIds = ['zh-campus-words', 'zh-campus-reading'];
    saveProgress({
      passedKnowledgePoints: [],
      stars: {},
      languageLessons: {
        chinese: { completedLessonIds: [], currentLessonId: lessonIds[0], updatedAt: 1 },
      },
    }, 'sync-user');
    syncMocks.single.mockResolvedValue({ data: { progress: {} }, error: null });
    let resolveFirstUpdate: (value: { error: null }) => void = () => undefined;
    syncMocks.updateEq
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirstUpdate = resolve; }))
      .mockResolvedValue({ error: null });
    const actual = await vi.importActual<typeof import('@/context/ProgressContext')>('@/context/ProgressContext');

    function CompleteControl() {
      const { progress, completeLanguageLesson } = actual.useProgress();
      return <><button type="button" onClick={() => completeLanguageLesson('chinese', lessonIds[0], lessonIds)}>完成课程</button><output data-testid="sync-progress">{progress.languageLessons?.chinese?.completedLessonIds.join(',') ?? ''}</output></>;
    }

    render(<actual.ProgressProvider><CompleteControl /></actual.ProgressProvider>);
    await waitFor(() => expect(syncMocks.update).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: '完成课程' }));
    await waitFor(() => expect(screen.getByTestId('sync-progress')).toHaveTextContent('zh-campus-words'));
    await act(async () => { resolveFirstUpdate({ error: null }); });

    await waitFor(() => expect(syncMocks.update).toHaveBeenCalledTimes(2));
    expect(syncMocks.update.mock.calls[1][0]).toMatchObject({
      progress: {
        languageLessons: {
          chinese: {
            completedLessonIds: ['zh-campus-words'],
            currentLessonId: 'zh-campus-reading',
          },
        },
      },
    });
  });

  it('does not auto-update before the first remote read and merges only after it resolves', async () => {
    vi.useFakeTimers();
    saveProgress({
      passedKnowledgePoints: [],
      stars: {},
      languageLessons: {
        chinese: { completedLessonIds: [], currentLessonId: 'zh-campus-words', updatedAt: 1 },
      },
    }, 'sync-user');
    let resolveRead: (value: { data: { progress: object }; error: null }) => void = () => undefined;
    syncMocks.single.mockReturnValue(new Promise((resolve) => { resolveRead = resolve; }));
    const actual = await vi.importActual<typeof import('@/context/ProgressContext')>('@/context/ProgressContext');

    render(<actual.ProgressProvider><div>同步测试</div></actual.ProgressProvider>);
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    expect(syncMocks.updateEq).not.toHaveBeenCalled();

    await act(async () => { resolveRead({ data: { progress: {} }, error: null }); });
    await vi.waitFor(() => expect(syncMocks.updateEq).toHaveBeenCalledTimes(1));
  });

  it('never overwrites an unknown remote snapshot after the initial read fails', async () => {
    vi.useFakeTimers();
    saveProgress({
      passedKnowledgePoints: [],
      stars: {},
      languageLessons: {
        chinese: { completedLessonIds: [], currentLessonId: 'zh-campus-words', updatedAt: 1 },
      },
    }, 'sync-user');
    syncMocks.single.mockResolvedValue({ data: null, error: new Error('read failed') });
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const actual = await vi.importActual<typeof import('@/context/ProgressContext')>('@/context/ProgressContext');

    render(<actual.ProgressProvider><div>失败同步测试</div></actual.ProgressProvider>);
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });

    expect(syncMocks.updateEq).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
