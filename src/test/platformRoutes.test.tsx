import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { LearningCenter } from '@/pages/LearningCenterPage';

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
    progress: { passedKnowledgePoints: [], stars: {} },
    startLanguageLesson: vi.fn(),
    completeLanguageLesson: vi.fn(),
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
  window.history.replaceState({}, '', '/');
});

describe('integrated learning center', () => {
  it('shows all three subjects as active links with their progress', () => {
    render(
      <MemoryRouter>
        <LearningCenter completedCount={6} chineseCompletedCount={1} englishCompletedCount={0} onLogout={authState.logout} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: '今天想学哪一科？' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '跳到主要内容' })).toHaveAttribute('href', '#main-content');
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent))
      .toEqual(['数学', '语文', '英语']);
    expect(screen.getByRole('link', { name: '进入数学' })).toHaveAttribute('href', '/math');
    expect(screen.getByRole('link', { name: '进入语文' })).toHaveAttribute('href', '/chinese');
    expect(screen.getByRole('link', { name: '进入英语' })).toHaveAttribute('href', '/english');
    expect(screen.getByText('已完成 1 / 3 课')).toBeInTheDocument();
    expect(screen.getByText('已完成 0 / 3 课')).toBeInTheDocument();
    expect(screen.getByText('词汇、句型与听读')).toBeInTheDocument();
  });

  it('opens the real Chinese subject route', async () => {
    window.history.replaceState({}, '', '/chinese');
    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: '校园里的小发现' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /会观察，也会用词/ })).toHaveAttribute('href', '/chinese/zh-campus-words');
  });

  it('opens the real English subject route', async () => {
    window.history.replaceState({}, '', '/english');
    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: '公园里的动物' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /认识公园里的动物/ })).toHaveAttribute('href', '/english/en-park-animals');
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
