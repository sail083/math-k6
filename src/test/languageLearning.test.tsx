import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { chineseLessonIds, chineseLessons } from '@/content/chinese';
import { englishLessonIds, englishLessons, englishUnits } from '@/content/english';
import LanguageSubjectPage, { LessonPractice, ReadAloudButton } from '@/pages/LanguageSubjectPage';
import type { LanguageLesson, ProgressData } from '@/lib/types';
import { saveProgress } from '@/lib/progress';

const progressMocks = vi.hoisted(() => ({
  progress: { passedKnowledgePoints: [], stars: {} } as ProgressData,
  startLanguageLesson: vi.fn(),
  completeLanguageLesson: vi.fn(),
}));

const syncMocks = vi.hoisted(() => ({
  user: { id: 'sync-user' },
  select: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
  rpc: vi.fn(),
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
      select: (columns: string) => {
        syncMocks.select(columns);
        return { eq: () => ({ single: syncMocks.single }) };
      },
      update: (value: unknown) => {
        syncMocks.update(value);
        return { eq: syncMocks.updateEq };
      },
    }),
    rpc: syncMocks.rpc,
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
  syncMocks.select.mockReset();
  syncMocks.single.mockReset();
  syncMocks.update.mockReset();
  syncMocks.updateEq.mockReset().mockResolvedValue({ error: null });
  syncMocks.rpc.mockReset().mockResolvedValue({ data: {}, error: null });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(window, 'speechSynthesis');
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

describe('English 2022 curriculum content', () => {
  it('adds the reviewed FLTRP unit while preserving the original animal lesson IDs', () => {
    expect(englishLessonIds).toEqual([
      'en-g3a-u1-meet',
      'en-g3a-u1-help',
      'en-g3a-u1-friend-card',
      'en-park-animals',
      'en-park-sentences',
      'en-park-listen-read',
    ]);
    expect(new Set(englishLessonIds).size).toBe(6);
    expect(englishUnits.map((unit) => [unit.grade, unit.semester, unit.unit, unit.title, unit.lessonIds])).toEqual([
      [3, '上册', 1, "Let's be friends!", englishLessonIds.slice(0, 3)],
      [3, '下册', 1, 'Animal friends', englishLessonIds.slice(3)],
    ]);
    for (const lesson of englishLessons) {
      expect(lesson.questions).toHaveLength(3);
      expect(lesson.questions.every((question) => question.points === 10)).toBe(true);
      expect(lesson.questions.every((question) => question.type === 'choice' || question.type === 'fill-blank')).toBe(true);
      expect(lesson.questions.every((question) => /[\u4e00-\u9fff]/.test(question.explanation) && question.explanation.includes('再试'))).toBe(true);
    }
    expect(englishLessons.map((lesson) => lesson.questions.map((question) => question.correctAnswer))).toEqual([
      ["I'm Lin.", 'nine', 'Nice to meet you!'],
      ['Thank you!', 'play', "Let's help."],
      ["She's", 'friends', "I'm Lin. This is my friend Mia. We are friends."],
      ['兔子', '小鸟', 'dog'],
      ['I can see a bird.', 'is', 'The dog is brown.'],
      ['Under a tree.', 'White.', 'small'],
    ]);
    expect(englishLessons[2].project?.title).toBe('我的朋友卡');
    expect(englishLessons[4].body).toContain('cat、dog、bird、rabbit 都以辅音音素开头');
    expect(englishLessons[5].body).toBe('Today I am at the park. I can see a brown dog under a tree. A white rabbit is near the flowers. The bird is yellow and small. The animals are quiet. I like the little rabbit best.');
    expect(englishLessons.filter((lesson) => lesson.speakable)).toHaveLength(4);
    expect(JSON.stringify(englishLessons)).not.toMatch(/中文谐音|口语达标|听力达标/);
  });
});

describe('English read-aloud helper', () => {
  it('speaks the same visible body in en-US at a slower rate and cancels overlap', () => {
    const cancel = vi.fn();
    const speak = vi.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel, speak },
    });
    class MockUtterance {
      text: string;
      lang = '';
      rate = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);

    const body = englishLessons[2].body;
    const { unmount } = render(<ReadAloudButton text={body} />);
    fireEvent.click(screen.getByRole('button', { name: '朗读英文正文' }));

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak.mock.calls[0][0]).toMatchObject({ text: body, lang: 'en-US', rate: 0.85 });
    fireEvent.click(screen.getByRole('button', { name: '正在朗读' }));
    expect(cancel).toHaveBeenCalledTimes(2);
    expect(speak).toHaveBeenCalledTimes(2);
    expect(speak.mock.calls[1][0]).toMatchObject({ text: body, lang: 'en-US', rate: 0.85 });
    unmount();
    expect(cancel).toHaveBeenCalledTimes(3);
  });

  it('keeps a visible text fallback when speech synthesis is unsupported or errors', () => {
    vi.stubGlobal('SpeechSynthesisUtterance', undefined);
    const { unmount } = render(<ReadAloudButton text={englishLessons[2].body} />);

    expect(screen.getByRole('button', { name: '朗读英文正文' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('当前浏览器不支持朗读，请直接阅读下方英文正文。');
    unmount();

    const cancel = vi.fn();
    const speak = vi.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel, speak },
    });
    class ErrorUtterance {
      text: string;
      lang = '';
      rate = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    vi.stubGlobal('SpeechSynthesisUtterance', ErrorUtterance);
    render(<ReadAloudButton text={englishLessons[2].body} />);
    fireEvent.click(screen.getByRole('button', { name: '朗读英文正文' }));
    act(() => (speak.mock.calls[0][0] as ErrorUtterance).onerror?.());

    expect(screen.getByRole('status')).toHaveTextContent('朗读暂时不可用，请直接阅读下方英文正文。');
  });
});

describe('language lesson practice', () => {
  it('passes with two correct answers out of three and calls completion once', () => {
    const onPassed = vi.fn();
    render(<MemoryRouter><LessonPractice lesson={practiceLesson} onPassed={onPassed} nextLessonId="next" subject="chinese" /></MemoryRouter>);

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
    render(<MemoryRouter><LessonPractice lesson={practiceLesson} onPassed={onPassed} nextLessonId={null} subject="chinese" /></MemoryRouter>);

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
        <Routes><Route path="/chinese/:lessonId" element={<LanguageSubjectPage subject="chinese" />} /></Routes>
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
          <Route path="/chinese" element={<><LanguageSubjectPage subject="chinese" /><LocationPath /></>} />
          <Route path="/chinese/:lessonId" element={<><LanguageSubjectPage subject="chinese" /><LocationPath /></>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/chinese'));
    expect(screen.getByRole('heading', { level: 1, name: '校园里的小发现' })).toBeInTheDocument();
    expect(progressMocks.startLanguageLesson).not.toHaveBeenCalled();
  });
});

describe('English subject routes', () => {
  it('starts the first FLTRP lesson with its unit-local order', async () => {
    render(
      <MemoryRouter initialEntries={['/english/en-g3a-u1-meet']}>
        <Routes><Route path="/english/:lessonId" element={<LanguageSubjectPage subject="english" />} /></Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: '认识新朋友' })).toBeInTheDocument();
    expect(screen.getByText(/Hello! I'm Lin/)).toBeInTheDocument();
    await waitFor(() => expect(progressMocks.startLanguageLesson).toHaveBeenCalledWith(
      'english',
      'en-g3a-u1-meet',
      englishUnits[0].lessonIds,
    ));
  });

  it('keeps the original animal unit reachable with its existing IDs', async () => {
    render(
      <MemoryRouter initialEntries={['/english/en-park-animals']}>
        <Routes><Route path="/english/:lessonId" element={<LanguageSubjectPage subject="english" />} /></Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: '认识公园里的动物' })).toBeInTheDocument();
    await waitFor(() => expect(progressMocks.startLanguageLesson).toHaveBeenCalledWith(
      'english',
      'en-park-animals',
      englishUnits[1].lessonIds,
    ));
  });

  it('redirects a locked English lesson and shows completion state independently', async () => {
    const { unmount: unmountLocked } = render(
      <MemoryRouter initialEntries={['/english/en-g3a-u1-help']}>
        <Routes>
          <Route path="/english" element={<><LanguageSubjectPage subject="english" /><LocationPath /></>} />
          <Route path="/english/:lessonId" element={<><LanguageSubjectPage subject="english" /><LocationPath /></>} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/english'));
    expect(progressMocks.startLanguageLesson).not.toHaveBeenCalled();
    unmountLocked();

    progressMocks.progress = {
      passedKnowledgePoints: [],
      stars: {},
      languageLessons: {
        english: { completedLessonIds: [englishLessonIds[0]], currentLessonId: englishLessonIds[1], updatedAt: 1 },
      },
    };
    render(
      <MemoryRouter initialEntries={['/english']}>
        <Routes><Route path="/english" element={<LanguageSubjectPage subject="english" />} /></Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('已完成 1 / 6 课')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /一起帮助、一起玩/ })).toHaveAttribute('href', '/english/en-g3a-u1-help');
    expect(screen.getByRole('article', { name: /制作我的朋友卡，完成前一课后开放/ })).toBeInTheDocument();
  });

  it('shows the speakable lesson body permanently beside the read-aloud control', () => {
    progressMocks.progress = {
      passedKnowledgePoints: [],
      stars: {},
      languageLessons: {
        english: { completedLessonIds: englishLessonIds.slice(0, 2), currentLessonId: englishLessonIds[2], updatedAt: 1 },
      },
    };
    render(
      <MemoryRouter initialEntries={['/english/en-g3a-u1-friend-card']}>
        <Routes><Route path="/english/:lessonId" element={<LanguageSubjectPage subject="english" />} /></Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(englishLessons[2].body)).toBeVisible();
    expect(screen.getByRole('button', { name: '朗读英文正文' })).toHaveClass('min-h-11');
    const draft = screen.getByRole('textbox', { name: '朋友卡内容' });
    fireEvent.change(draft, { target: { value: "I'm Lin. We are friends." } });
    expect(screen.getByText('朋友卡已写好，可以继续完成小练习。')).toBeVisible();
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
    expect(syncMocks.select).toHaveBeenCalledWith('progress, language_progress');
  });

  it('restarts the initial sync after the StrictMode effect cleanup', async () => {
    localStorage.setItem('math-k6-progress', JSON.stringify({
      passedKnowledgePoints: ['legacy-math'],
      stars: { 'legacy-math': 2 },
    }));
    let resolveFirstRead: (value: { data: { progress: object; language_progress: object }; error: null }) => void = () => undefined;
    syncMocks.single
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirstRead = resolve; }))
      .mockResolvedValue({ data: { progress: {}, language_progress: {} }, error: null });
    const actual = await vi.importActual<typeof import('@/context/ProgressContext')>('@/context/ProgressContext');

    function StrictState() {
      const context = actual.useProgress();
      return <output data-testid="strict-sync-state">{context.legacyProgressAvailable ? 'ready' : 'waiting'}</output>;
    }

    render(<StrictMode><actual.ProgressProvider><StrictState /></actual.ProgressProvider></StrictMode>);
    await waitFor(() => expect(syncMocks.single).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(syncMocks.update).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('strict-sync-state')).toHaveTextContent('ready'));
    await act(async () => resolveFirstRead({ data: { progress: {}, language_progress: {} }, error: null }));
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
    expect(syncMocks.update.mock.calls[0][0]).toHaveProperty('progress');
    expect(syncMocks.update.mock.calls[0][0]).not.toHaveProperty('progress.languageLessons');
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
    expect(syncMocks.update.mock.calls.every(([payload]) => (
      !(payload as { progress?: ProgressData }).progress?.languageLessons
    ))).toBe(true);
    expect(syncMocks.rpc).toHaveBeenCalledWith('complete_language_lesson', {
      subject_input: 'chinese',
      lesson_id_input: 'zh-campus-words',
      user_id_input: 'sync-user',
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

  it('retries local language completions through the atomic RPC after login', async () => {
    saveProgress({
      passedKnowledgePoints: [],
      stars: {},
      languageLessons: {
        english: { completedLessonIds: [englishLessonIds[0]], currentLessonId: englishLessonIds[1], updatedAt: 2 },
      },
    }, 'sync-user');
    syncMocks.single.mockResolvedValue({ data: { progress: {}, language_progress: {} }, error: null });
    const actual = await vi.importActual<typeof import('@/context/ProgressContext')>('@/context/ProgressContext');

    render(<actual.ProgressProvider><div>登录重试</div></actual.ProgressProvider>);

    await waitFor(() => expect(syncMocks.rpc).toHaveBeenCalledWith('complete_language_lesson', {
      subject_input: 'english',
      lesson_id_input: englishLessonIds[0],
      user_id_input: 'sync-user',
    }));
    expect(syncMocks.select).toHaveBeenCalledWith('progress, language_progress');
    expect(syncMocks.update.mock.calls.every(([payload]) => (
      !(payload as { progress?: ProgressData }).progress?.languageLessons
    ))).toBe(true);
  });

  it('ignores an unknown local lesson ID without blocking math sync', async () => {
    saveProgress({
      passedKnowledgePoints: ['math-1'],
      stars: { 'math-1': 2 },
      languageLessons: {
        chinese: { completedLessonIds: ['unknown-lesson'], currentLessonId: null, updatedAt: 1 },
      },
    }, 'sync-user');
    syncMocks.single.mockResolvedValue({ data: { progress: {}, language_progress: {} }, error: null });
    const actual = await vi.importActual<typeof import('@/context/ProgressContext')>('@/context/ProgressContext');

    render(<actual.ProgressProvider><div>脏数据兼容</div></actual.ProgressProvider>);

    await waitFor(() => expect(syncMocks.update).toHaveBeenCalled());
    expect(syncMocks.rpc).not.toHaveBeenCalled();
    expect(syncMocks.update.mock.calls[0][0]).toMatchObject({
      progress: { passedKnowledgePoints: ['math-1'] },
    });
    expect(syncMocks.update.mock.calls[0][0]).not.toHaveProperty('progress.languageLessons');
  });

  it('stops the old account RPC loop after switching accounts', async () => {
    syncMocks.user = { id: 'user-a' };
    saveProgress({
      passedKnowledgePoints: [],
      stars: {},
      languageLessons: {
        chinese: {
          completedLessonIds: chineseLessonIds.slice(0, 2),
          currentLessonId: chineseLessonIds[2],
          updatedAt: 2,
        },
      },
    }, 'user-a');
    syncMocks.single.mockResolvedValue({ data: { progress: {}, language_progress: {} }, error: null });
    let resolveFirstRpc: (value: { data: object; error: null }) => void = () => undefined;
    syncMocks.rpc
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirstRpc = resolve; }))
      .mockResolvedValue({ data: {}, error: null });
    const actual = await vi.importActual<typeof import('@/context/ProgressContext')>('@/context/ProgressContext');

    function AccountProvider() {
      return <actual.ProgressProvider key={syncMocks.user.id}><div>{syncMocks.user.id}</div></actual.ProgressProvider>;
    }

    const { rerender } = render(<AccountProvider />);
    await waitFor(() => expect(syncMocks.rpc).toHaveBeenCalledTimes(1));
    expect(syncMocks.rpc).toHaveBeenLastCalledWith('complete_language_lesson', {
      subject_input: 'chinese',
      lesson_id_input: expect.any(String),
      user_id_input: 'user-a',
    });
    expect(chineseLessonIds.slice(0, 2)).toContain(syncMocks.rpc.mock.calls[0][1].lesson_id_input);

    syncMocks.user = { id: 'user-b' };
    rerender(<AccountProvider />);
    await act(async () => resolveFirstRpc({ data: {}, error: null }));
    await waitFor(() => expect(screen.getByText('user-b')).toBeVisible());
    expect(syncMocks.rpc).toHaveBeenCalledTimes(1);
  });

  it('leaves legacy nested remote progress untouched when its RPC migration fails', async () => {
    saveProgress({ passedKnowledgePoints: [], stars: {} }, 'sync-user');
    syncMocks.single.mockResolvedValue({
      data: {
        progress: {
          passedKnowledgePoints: [],
          stars: {},
          languageLessons: {
            english: { completedLessonIds: [englishLessonIds[0]], currentLessonId: null, updatedAt: 1 },
          },
        },
        language_progress: { chinese: ['zh-campus-words'] },
      },
      error: null,
    });
    const actual = await vi.importActual<typeof import('@/context/ProgressContext')>('@/context/ProgressContext');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    syncMocks.rpc.mockResolvedValue({ data: null, error: new Error('offline') });

    render(<actual.ProgressProvider><div>旧格式迁移</div></actual.ProgressProvider>);

    await waitFor(() => expect(syncMocks.rpc).toHaveBeenCalledWith('complete_language_lesson', {
      subject_input: 'english',
      lesson_id_input: englishLessonIds[0],
      user_id_input: 'sync-user',
    }));
    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(syncMocks.update).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('pauses remote math writes when RPC fails and resumes after the online retry succeeds', async () => {
    const lessonIds = ['zh-campus-words', 'zh-campus-reading'];
    saveProgress({
      passedKnowledgePoints: [],
      stars: {},
      languageLessons: {
        chinese: { completedLessonIds: [], currentLessonId: lessonIds[0], updatedAt: 1 },
      },
    }, 'sync-user');
    syncMocks.single.mockResolvedValue({ data: { progress: {}, language_progress: {} }, error: null });
    const actual = await vi.importActual<typeof import('@/context/ProgressContext')>('@/context/ProgressContext');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    function CompleteControl() {
      const { progress, completeLanguageLesson } = actual.useProgress();
      return <><button type="button" onClick={() => completeLanguageLesson('chinese', lessonIds[0], lessonIds)}>完成课程</button><output data-testid="local-completion">{progress.languageLessons?.chinese?.completedLessonIds.join(',') ?? ''}</output></>;
    }

    render(<actual.ProgressProvider><CompleteControl /></actual.ProgressProvider>);
    await waitFor(() => expect(syncMocks.update).toHaveBeenCalled());
    const updateCountBeforeFailure = syncMocks.update.mock.calls.length;
    syncMocks.rpc.mockResolvedValueOnce({ data: null, error: new Error('offline') });
    fireEvent.click(screen.getByRole('button', { name: '完成课程' }));

    await waitFor(() => expect(screen.getByTestId('local-completion')).toHaveTextContent(lessonIds[0]));
    await waitFor(() => expect(syncMocks.rpc).toHaveBeenCalledWith('complete_language_lesson', {
      subject_input: 'chinese',
      lesson_id_input: lessonIds[0],
      user_id_input: 'sync-user',
    }));
    expect(error).toHaveBeenCalledWith(
      '[ProgressSync] Failed to save language completion:',
      expect.any(Error),
    );
    expect(syncMocks.update).toHaveBeenCalledTimes(updateCountBeforeFailure);

    window.dispatchEvent(new Event('online'));
    await waitFor(() => expect(syncMocks.rpc).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(syncMocks.update).toHaveBeenCalledTimes(updateCountBeforeFailure + 1));
    const finalUpdate = syncMocks.update.mock.calls.at(-1);
    expect(finalUpdate).toBeDefined();
    expect((finalUpdate![0] as { progress?: ProgressData }).progress).not.toHaveProperty('languageLessons');
    error.mockRestore();
  });

  it('offers unowned legacy progress only after a successful read and imports on confirmation', async () => {
    localStorage.setItem('math-k6-progress', JSON.stringify({
      passedKnowledgePoints: ['legacy-math'],
      stars: { 'legacy-math': 2 },
    }));
    syncMocks.single.mockResolvedValue({ data: { progress: {}, language_progress: {} }, error: null });
    const actual = await vi.importActual<typeof import('@/context/ProgressContext')>('@/context/ProgressContext');

    function LegacyControl() {
      const context = actual.useProgress();
      return <>
        <output data-testid="legacy-offer">{context.legacyProgressAvailable ? context.legacyCompletedKnowledgePointCount : 'no'}</output>
        <output data-testid="legacy-imported">{context.progress.passedKnowledgePoints.join(',')}</output>
        <button type="button" onClick={context.importLegacyProgress}>确认导入</button>
      </>;
    }

    render(<actual.ProgressProvider><LegacyControl /></actual.ProgressProvider>);
    await waitFor(() => expect(screen.getByTestId('legacy-offer')).toHaveTextContent('1'));
    expect(screen.getByTestId('legacy-imported')).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole('button', { name: '确认导入' }));
    await waitFor(() => expect(screen.getByTestId('legacy-imported')).toHaveTextContent('legacy-math'));
    expect(screen.getByTestId('legacy-offer')).toHaveTextContent('no');
    expect(localStorage.getItem('math-k6-progress-owner')).toBe('sync-user');
  });

  it('restarts the full read and language sync when the browser comes online', async () => {
    const lessonIds = [chineseLessonIds[0], chineseLessonIds[1]];
    saveProgress({
      passedKnowledgePoints: [],
      stars: {},
      languageLessons: {
        chinese: { completedLessonIds: [], currentLessonId: lessonIds[0], updatedAt: 1 },
      },
    }, 'sync-user');
    syncMocks.single
      .mockResolvedValueOnce({ data: null, error: new Error('offline read') })
      .mockResolvedValue({ data: { progress: {}, language_progress: {} }, error: null });
    const actual = await vi.importActual<typeof import('@/context/ProgressContext')>('@/context/ProgressContext');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    function OfflineCompletion() {
      const { progress, completeLanguageLesson } = actual.useProgress();
      return <>
        <button type="button" onClick={() => completeLanguageLesson('chinese', lessonIds[0], lessonIds)}>离线完成</button>
        <output data-testid="offline-completion">{progress.languageLessons?.chinese?.completedLessonIds.join(',') ?? ''}</output>
      </>;
    }

    render(<actual.ProgressProvider><OfflineCompletion /></actual.ProgressProvider>);
    await waitFor(() => expect(syncMocks.single).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: '离线完成' }));
    await waitFor(() => expect(screen.getByTestId('offline-completion')).toHaveTextContent(lessonIds[0]));
    expect(syncMocks.rpc).not.toHaveBeenCalled();
    expect(syncMocks.update).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('online'));
    await waitFor(() => expect(syncMocks.single).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(syncMocks.rpc).toHaveBeenCalledWith('complete_language_lesson', {
      subject_input: 'chinese',
      lesson_id_input: lessonIds[0],
      user_id_input: 'sync-user',
    }));
    await waitFor(() => expect(syncMocks.update).toHaveBeenCalled());
    expect(syncMocks.update.mock.calls.at(-1)?.[0]).not.toHaveProperty('progress.languageLessons');
    error.mockRestore();
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

    localStorage.setItem('math-k6-progress', JSON.stringify({
      passedKnowledgePoints: ['legacy-math'],
      stars: { 'legacy-math': 2 },
    }));
    function FailedReadState() {
      return <output data-testid="legacy-after-read-failure">{actual.useProgress().legacyProgressAvailable ? 'yes' : 'no'}</output>;
    }
    render(<actual.ProgressProvider><FailedReadState /></actual.ProgressProvider>);
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });

    expect(syncMocks.updateEq).not.toHaveBeenCalled();
    expect(screen.getByTestId('legacy-after-read-failure')).toHaveTextContent('no');
    error.mockRestore();
  });
});
