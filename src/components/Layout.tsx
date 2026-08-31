import { useEffect, useMemo, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useProgress } from '@/context/ProgressContext';
import { useAuth } from '@/context/AuthContext';
import { getAllKnowledgePoints, getGrades, getKnowledgePointById } from '@/lib/content';
import { getOverallProgress } from '@/lib/progress';
import UiIcon from '@/components/UiIcon';

const gradeLabels: Record<number, string> = {
  3: '三年级',
  4: '四年级',
  5: '五年级',
  6: '六年级',
};

export default function Layout({ children }: { children: ReactNode }) {
  const { progress } = useProgress();
  const { user, logout } = useAuth();
  const allKPs = useMemo(() => getAllKnowledgePoints(), []);
  const total = allKPs.length;
  const overall = getOverallProgress(progress, total);
  const percent = Math.round(overall * 100);
  const grades = useMemo(() => getGrades(), []);
  const { pathname } = useLocation();
  const routeParts = pathname.split('/').filter(Boolean);
  const currentGrade = routeParts[1] === 'grade'
    ? Number(routeParts[2])
    : routeParts[1] === 'kp'
      ? getKnowledgePointById(routeParts[2])?.meta.grade
      : undefined;

  // Prefer a first-class username; otherwise mask the phone number.
  const displayUsername = user?.user_metadata?.username as string | undefined;
  const displayPhone = user?.user_metadata?.phone as string | undefined;
  const displayLabel = displayUsername || (displayPhone
    ? `${displayPhone.slice(0, 3)}****${displayPhone.slice(7)}`
    : user?.email?.split('@')[0] ?? '');

  useEffect(() => {
    document.title = 'Math Lab · 小学数学 3-6 年级';
    return () => { document.title = '语数英综合学习平台'; };
  }, []);

  return (
    <div className="app-frame min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-indigo-700 focus:shadow-lg"
      >
        跳到主要内容
      </a>
      {/* 顶部栏 */}
      <header className="app-header sticky top-0 z-30">
        <div className="app-container">
          {/* 标题行 */}
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-2">
              <NavLink
                to="/math"
                className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
              >
                <span className="brand-mark">M</span>
                <span className="brand-copy"><strong>Math Lab</strong><small>小学数学 3-6 年级</small></span>
              </NavLink>
              <NavLink
                to="/"
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
                aria-label="返回学习中心"
              >
                <span aria-hidden="true">←</span>
                <span className="ml-1 hidden sm:inline">学习中心</span>
                <span className="ml-1 sm:hidden">学科</span>
              </NavLink>
            </div>

            {/* 桌面端：年级导航 + 进度 + 用户 */}
            <div className="hidden md:flex items-center gap-5">
              <nav className="grade-nav" aria-label="年级导航">
                {grades.map((g) => (
                  <NavLink
                    key={g}
                    to={`/math/grade/${g}`}
                    className={({ isActive }) =>
                      `grade-nav__item ${
                        isActive || currentGrade === g
                          ? 'is-active'
                          : ''
                      }`
                    }
                  >
                    {gradeLabels[g]}
                  </NavLink>
                ))}
              </nav>
              <NavLink to="/math/dashboard" className="header-progress" aria-label={`查看学习进度，已完成 ${percent}%`}>
                <UiIcon name="progress" size={18}/>
                <div className="header-progress__copy"><span>全部课程</span><strong>{percent}%</strong></div>
                <div className="header-progress__track">
                  <div
                    className="header-progress__fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </NavLink>
              <NavLink
                to="/math/map"
                className={({ isActive }) =>
                  `grade-nav__item ${isActive ? 'is-active' : ''}`
                }
              >
                🗺 知识地图
              </NavLink>

              {/* 用户状态 */}
              {user ? (
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center h-9 px-3 rounded-lg text-xs font-semibold"
                    style={{ background: '#eef1ff', color: 'var(--color-primary)' }}
                    title={user.email ?? ''}
                  >
                    {displayLabel}
                  </span>
                  <button
                    onClick={logout}
                    className="inline-flex items-center h-9 px-3 rounded-lg text-xs font-semibold transition-colors hover:bg-slate-100"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    退出
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <NavLink
                    to="/login"
                    className="inline-flex items-center h-9 px-4 rounded-lg text-xs font-semibold text-white transition-colors"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    登录
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="inline-flex items-center h-9 px-4 rounded-lg text-xs font-semibold transition-colors hover:bg-slate-100"
                    style={{ color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}
                  >
                    注册
                  </NavLink>
                </div>
              )}
            </div>
          </div>

          {/* 移动端：进度条 */}
          <div className="md:hidden mobile-progress">
            <div className="flex items-center justify-between">
              <NavLink to="/math/dashboard" className="mobile-progress__label"><UiIcon name="progress" size={16}/><span>学习进度</span><strong>{percent}%</strong></NavLink>
              {user ? (
                <button
                  onClick={logout}
                  className="text-xs font-semibold px-2 py-1"
                  style={{ color: 'var(--color-muted)' }}
                >
                  退出
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <NavLink
                    to="/login"
                    className="text-xs font-semibold px-2 py-1"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    登录
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="text-xs font-semibold px-2 py-1"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    注册
                  </NavLink>
                </div>
              )}
            </div>
            <div className="header-progress__track">
                <div
                  className="header-progress__fill"
                  style={{ width: `${percent}%` }}
                />
            </div>
          </div>

          {/* 移动端：六个主入口始终完整可见 */}
          <nav className="md:hidden grid grid-cols-6 gap-1 pb-2 text-center text-xs" aria-label="主导航">
            {grades.map((g) => (
              <NavLink
                key={g}
                to={`/math/grade/${g}`}
                className={({ isActive }) =>
                  `mobile-grade-link ${isActive || currentGrade === g ? 'is-active' : ''}`
                }
              >
                {g === 3 ? '📐 ' : g === 4 ? '✏️ ' : g === 5 ? '📏 ' : '⭕ '}{gradeLabels[g]}
              </NavLink>
            ))}
            <NavLink to="/math/dashboard" className={({ isActive }) => `mobile-grade-link ${isActive ? 'is-active' : ''}`}>📊 进度</NavLink>
            <NavLink to="/math/map" className={({ isActive }) => `mobile-grade-link ${isActive ? 'is-active' : ''}`}>🗺 地图</NavLink>
          </nav>
        </div>
      </header>

      {/* 内容区 */}
      <main id="main-content" tabIndex={-1} className="app-main">{children}</main>

      {/* 底部 */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="app-container py-4 text-center text-xs text-slate-500">
          小学数学3-6年级 一次讲透 · 交互式教学平台
        </div>
      </footer>
    </div>
  );
}
