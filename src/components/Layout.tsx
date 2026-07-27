import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useProgress } from '@/context/ProgressContext';
import { getAllKnowledgePoints, getGrades } from '@/lib/content';
import { getOverallProgress } from '@/lib/progress';

const gradeLabels: Record<number, string> = {
  3: '三年级',
  4: '四年级',
  5: '五年级',
  6: '六年级',
};

export default function Layout({ children }: { children: ReactNode }) {
  const { progress } = useProgress();
  const allKPs = getAllKnowledgePoints();
  const total = allKPs.length;
  const overall = getOverallProgress(progress, total);
  const percent = Math.round(overall * 100);
  const grades = getGrades();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4">
          {/* 标题行 */}
          <div className="flex items-center justify-between gap-3 py-3">
            <NavLink to="/" className="flex items-center gap-2 shrink-0">
              <span className="text-xl sm:text-2xl font-bold text-indigo-600 tracking-tight">
                小学数学3-6年级
              </span>
            </NavLink>

            {/* 桌面端：年级导航 + 进度 */}
            <div className="hidden md:flex items-center gap-4">
              <nav className="flex items-center gap-1">
                {grades.map((g) => (
                  <NavLink
                    key={g}
                    to={`/grade/${g}`}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                  >
                    {gradeLabels[g]}
                  </NavLink>
                ))}
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  📊 进度
                </NavLink>
              </nav>
              <div className="flex items-center gap-2 min-w-[120px]">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500 tabular-nums">
                  {percent}%
                </span>
              </div>
            </div>
          </div>

          {/* 移动端：进度条 */}
          <div className="md:hidden pb-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500 tabular-nums">
                {percent}%
              </span>
            </div>
          </div>

          {/* 移动端：年级横向滚动标签栏 */}
          <nav className="md:hidden flex gap-1 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
            {grades.map((g) => (
              <NavLink
                key={g}
                to={`/grade/${g}`}
                className={({ isActive }) =>
                  `shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 bg-slate-100'
                  }`
                }
              >
                {gradeLabels[g]}
              </NavLink>
            ))}
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 bg-slate-100'
                }`
              }
            >
              📊 进度
            </NavLink>
          </nav>
        </div>
      </header>

      {/* 内容区 */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">{children}</main>

      {/* 底部 */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-slate-400">
          小学数学3-6年级 一次讲透 · 交互式教学平台
        </div>
      </footer>
    </div>
  );
}
