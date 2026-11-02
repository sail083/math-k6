import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { englishLessonIds } from '@/content/english';
import { chineseLessonIds } from '@/content/chinese';
import { LearningCenter } from '@/pages/LearningCenterPage';
import type { PrimaryTask } from '@/lib/platformTasks';

const primaryTask: PrimaryTask = {
  id: 'chinese:resume:zh-campus-words',
  subject: 'chinese',
  phase: 'resume',
  title: '会观察，也会用词',
  reason: '按顺序继续语文课程',
  duration: '约5分钟',
  cta: '继续学习',
  link: '/chinese/zh-campus-words',
};

const progressState = vi.hoisted(() => ({
  progress: { passedKnowledgePoints: [] as string[], stars: {} as Record<string, number> },
}));
const mockEmitEvent = vi.hoisted(() => vi.fn());

const authState = vi.hoisted(() => ({
  user: { id: 'student-1', user_metadata: { username: '小航' } } as {
    id: string;
    user_metadata: { username: string };
  } | null,
  login: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    user: authState.user,
    session: null,
    loading: false,
    login: authState.login,
    register: vi.fn(),
    resetPassword: vi.fn(),
    logout: authState.logout,
  }),
}));

vi.mock('@/context/ProgressContext', () => ({
  ProgressProvider: ({ children }: { children: ReactNode }) => children,
  useProgress: () => ({
    progress: progressState.progress,
    legacyProgressAvailable: false,
    legacyCompletedKnowledgePointCount: 0,
    importLegacyProgress: vi.fn(),
    dismissLegacyProgress: vi.fn(),
    startLanguageLesson: vi.fn(),
    completeLanguageLesson: vi.fn(),
    emitEvent: mockEmitEvent,
  }),
}));

vi.mock('@/pages/HomePage', () => ({ default: () => <h1 data-testid="math-page">math-home</h1> }));
vi.mock('@/pages/GradePage', () => ({ default: () => <h1 data-testid="math-page">grade</h1> }));
vi.mock('@/pages/KnowledgePointPage', () => ({ default: () => <h1 data-testid="math-page">knowledge-point</h1> }));
vi.mock('@/pages/ProgressDashboard', () => ({ default: () => <h1 data-testid="math-page">dashboard</h1> }));
vi.mock('@/pages/KnowledgeMapPage', () => ({ default: () => <h1 data-testid="math-page">map</h1> }));
vi.mock('@/pages/SkillRepairPage', () => ({ default: () => <h1 data-testid="math-page">repair</h1> }));

beforeEach(() => {
  authState.user = { id: 'student-1', user_metadata: { username: '小航' } };
  authState.login.mockReset();
  authState.logout.mockReset();
  progressState.progress = { passedKnowledgePoints: [], stars: {} };
  mockEmitEvent.mockReset();
  window.history.replaceState({}, '', '/');
});

describe('integrated learning center', () => {
  it('shows all three subjects as active links with their progress', () => {
    render(
      <MemoryRouter>
        <LearningCenter
          primaryTask={primaryTask}
          completedCount={6}
          mathTotalCount={47}
          chineseCompletedCount={1}
          englishCompletedCount={0}
          englishTotalCount={englishLessonIds.length}
          legacyProgressAvailable={false}
          legacyCompletedCount={0}
          onImportLegacy={vi.fn()}
          onDismissLegacy={vi.fn()}
          onLogout={authState.logout}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: '今天想学哪一科？' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '跳到主要内容' })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent))
      .toEqual(['会观察，也会用词', '数学', '语文', '英语']);
    expect(screen.getByRole('link', { name: '进入数学' })).toHaveAttribute('href', '/math');
    expect(screen.getByRole('link', { name: '进入语文' })).toHaveAttribute('href', '/chinese');
    expect(screen.getByRole('link', { name: '进入英语' })).toHaveAttribute('href', '/english');
    expect(screen.getByRole('link', { name: '继续学习：会观察，也会用词' })).toHaveAttribute('href', '/chinese/zh-campus-words');
    expect(screen.getByText('按顺序继续语文课程 · 约5分钟')).toBeVisible();
    expect(screen.getAllByRole('progressbar')).toHaveLength(3);
    expect(screen.getByRole('progressbar', { name: '数学学习进度' })).toHaveAttribute('aria-valuenow', '6');
    expect(screen.getByRole('progressbar', { name: '语文学习进度' })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByRole('progressbar', { name: '英语学习进度' })).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText(`已完成 1 / ${chineseLessonIds.length} 课`)).toBeInTheDocument();
    expect(screen.getByText(`已完成 0 / ${englishLessonIds.length} 课`)).toBeInTheDocument();
    expect(screen.getByText('词汇、句型与听读')).toBeInTheDocument();
  });

  it('labels and records an eligible extension primary task', async () => {
    progressState.progress = {
      passedKnowledgePoints: ['g3-add-sub-10000', 'g3-mult-1digit'],
      stars: {},
    };
    render(<App />);

    const taskLink = await screen.findByRole('link', { name: '开始学习：分类枚举' });
    expect(screen.getByText('数学 · 下一课 · 能力拓展')).toBeVisible();
    await waitFor(() => expect(mockEmitEvent).toHaveBeenCalledWith({
      clientEventId: 'lc:htv:math:next:g3-systematic-enumeration',
      eventName: 'home_task_viewed',
      courseId: 'g3-systematic-enumeration',
      properties: {
        surface: 'learning-center',
        track: 'extension',
        taskId: 'math:next:g3-systematic-enumeration',
      },
    }));

    fireEvent.click(taskLink);
    expect(mockEmitEvent).toHaveBeenCalledWith({
      clientEventId: 'lc:hto:math:next:g3-systematic-enumeration',
      eventName: 'home_task_opened',
      courseId: 'g3-systematic-enumeration',
      properties: {
        surface: 'learning-center',
        track: 'extension',
        taskId: 'math:next:g3-systematic-enumeration',
      },
    });
  });

  it('asks before importing unowned device progress', () => {
    const onImportLegacy = vi.fn();
    const onDismissLegacy = vi.fn();
    render(
      <MemoryRouter>
        <LearningCenter
          primaryTask={primaryTask}
          completedCount={0}
          mathTotalCount={47}
          chineseCompletedCount={0}
          englishCompletedCount={0}
          englishTotalCount={englishLessonIds.length}
          legacyProgressAvailable
          legacyCompletedCount={4}
          onImportLegacy={onImportLegacy}
          onDismissLegacy={onDismissLegacy}
          onLogout={authState.logout}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('其中完成了 4 个旧数学知识点。请确认属于当前账号后再导入。')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '确认是我的，导入' }));
    fireEvent.click(screen.getByRole('button', { name: '不是我的，不再提示' }));
    expect(onImportLegacy).toHaveBeenCalledTimes(1);
    expect(onDismissLegacy).toHaveBeenCalledTimes(1);
  });

  it('shows a completion state instead of inventing another task', () => {
    render(
      <MemoryRouter>
        <LearningCenter
          primaryTask={null}
          completedCount={47}
          mathTotalCount={47}
          chineseCompletedCount={3}
          englishCompletedCount={englishLessonIds.length}
          englishTotalCount={englishLessonIds.length}
          legacyProgressAvailable={false}
          legacyCompletedCount={0}
          onImportLegacy={vi.fn()}
          onDismissLegacy={vi.fn()}
          onLogout={authState.logout}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('当前可用课程已完成');
    expect(screen.queryByText('最近学习')).not.toBeInTheDocument();
  });

  it('opens the real Chinese subject route', async () => {
    window.history.replaceState({}, '', '/chinese');
    const view = render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: '语文自学课程' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /会观察，也会用词/ })).toHaveAttribute('href', '/chinese/zh-campus-words');
    expect(document.title).toBe('语文学习 · 语数英综合学习平台');
    view.unmount();
    expect(document.title).toBe('语数英综合学习平台');
  });

  it('opens the real English subject route', async () => {
    window.history.replaceState({}, '', '/english');
    const view = render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: '外研版英语课程' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /认识新朋友/ })).toHaveAttribute('href', '/english/en-g3a-u1-meet');
    expect(document.title).toBe('英语学习 · 语数英综合学习平台');
    view.unmount();
    expect(document.title).toBe('语数英综合学习平台');
  });

  it.each([
    ['/grade/3?track=extension#courses', '/math/grade/3?track=extension#courses', 'grade'],
    ['/kp/g3-fraction-intro?target=frac.notation#proof', '/math/kp/g3-fraction-intro?target=frac.notation#proof', 'knowledge-point'],
    ['/dashboard?from=legacy#stats', '/math/dashboard?from=legacy#stats', 'dashboard'],
    ['/map?target=frac.notation#path', '/math/map?target=frac.notation#path', 'map'],
    ['/repair/frac.notation?origin=map#diagnostic', '/math/repair/frac.notation?origin=map#diagnostic', 'repair'],
  ])('redirects legacy %s through the real App without losing URL state', async (legacy, canonical, page) => {
    window.history.replaceState({}, '', legacy);
    render(<App />);

    expect(await screen.findByTestId('math-page')).toHaveTextContent(page);
    await waitFor(() => expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe(canonical));
  });

  it('returns to the complete legacy-protected URL after login through the real App', async () => {
    authState.user = null;
    authState.login.mockImplementationOnce(async () => {
      authState.user = { id: 'student-1', user_metadata: { username: '小航' } };
      return { error: null };
    });
    window.history.replaceState({}, '', '/map?target=frac.notation#path');

    render(<App />);
    expect(await screen.findByRole('heading', { name: '登录' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('用户名或手机号'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    expect(await screen.findByTestId('math-page')).toHaveTextContent('map');
    await waitFor(() => expect(`${window.location.pathname}${window.location.search}${window.location.hash}`)
      .toBe('/math/map?target=frac.notation#path'));
  });
});
