import { Link } from 'react-router-dom';
import { useProgress } from '@/context/ProgressContext';
import { getAllKnowledgePoints, getKnowledgePointsByGrade, getGrades } from '@/lib/content';
import type { Grade } from '@/lib/types';

const gradeLabels: Record<number, string> = {
  3: '三年级',
  4: '四年级',
  5: '五年级',
  6: '六年级',
};

const gradeEmojis: Record<number, string> = {
  3: '📐',
  4: '✏️',
  5: '📏',
  6: '⭕',
};

/** 星级显示组件 */
function StarDisplay({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <span className="tracking-tight" aria-label={`${count} 星`}>
      <span className="text-amber-400">{'★'.repeat(count)}</span>
      <span className="text-slate-300">{'☆'.repeat(Math.max(0, max - count))}</span>
    </span>
  );
}

/** 渐变进度条 */
function GradientBar({ percent, className }: { percent: number; className: string }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${className}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

interface GradeStat {
  grade: Grade;
  passed: number;
  total: number;
  percent: number;
  starsEarned: number;
  maxStars: number;
}

interface RecentAchievement {
  id: string;
  title: string;
  grade: Grade;
  stars: number;
  hasFormula: boolean;
}

export default function ProgressDashboard() {
  const { progress, getStars, isPassed, getMasteryStatus, getDueReviewIds } = useProgress();
  const allKPs = getAllKnowledgePoints();
  const grades = getGrades();

  const totalPassed = progress.passedKnowledgePoints.length;
  const totalKPs = allKPs.length;
  const overallPercent = totalKPs > 0 ? Math.round((totalPassed / totalKPs) * 100) : 0;

  // Mastery counts
  const stableCount = allKPs.filter((kp) => getMasteryStatus(kp.meta.id) === 'stable').length;
  const dueCount = getDueReviewIds().length;
  const provisionalCount = allKPs.filter((kp) => getMasteryStatus(kp.meta.id) === 'provisional').length;
  const hasMastery = stableCount > 0 || dueCount > 0 || provisionalCount > 0;

  // 总星星
  const totalStarsEarned = allKPs.reduce((sum, kp) => sum + getStars(kp.meta.id), 0);
  const maxStarsTotal = totalKPs * 3;

  // 公式推导进度（hasFormula = true 的知识点）
  const derivationKPs = allKPs.filter((kp) => kp.meta.hasFormula);
  const derivationTotal = derivationKPs.length;
  const derivationPassed = derivationKPs.filter((kp) => isPassed(kp.meta.id)).length;
  const derivationPercent =
    derivationTotal > 0 ? Math.round((derivationPassed / derivationTotal) * 100) : 0;

  // 每年级统计
  const gradeStats: GradeStat[] = grades.map((g) => {
    const kps = getKnowledgePointsByGrade(g);
    const passed = kps.filter((kp) => isPassed(kp.meta.id)).length;
    const total = kps.length;
    const percent = total > 0 ? Math.round((passed / total) * 100) : 0;
    const starsEarned = kps.reduce((sum, kp) => sum + getStars(kp.meta.id), 0);
    const maxStars = total * 3;
    return { grade: g, passed, total, percent, starsEarned, maxStars };
  });

  // 最近成就（按通过顺序倒序，取最近 5 个）
  const recentAchievements: RecentAchievement[] = [...progress.passedKnowledgePoints]
    .reverse()
    .slice(0, 5)
    .map((id) => {
      const kp = allKPs.find((k) => k.meta.id === id);
      if (!kp) return null;
      return {
        id,
        title: kp.meta.title,
        grade: kp.meta.grade,
        stars: getStars(id),
        hasFormula: kp.meta.hasFormula,
      };
    })
    .filter((x): x is RecentAchievement => x !== null);

  const hasAnyProgress = totalPassed > 0;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">学习进度</h1>
        <Link
          to="/"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium min-h-[44px] flex items-center"
        >
          ← 返回首页
        </Link>
      </div>

      {/* 掌握概览 */}
      {hasMastery && (
        <section className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
            <div className="text-3xl font-bold text-emerald-600 tabular-nums">{stableCount}</div>
            <div className="text-xs font-medium text-emerald-700 mt-1">已稳固</div>
            {stableCount > 0 && <Link to="/" className="text-[10px] text-emerald-600 hover:underline mt-1 inline-block">查看全部</Link>}
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
            <div className="text-3xl font-bold text-amber-600 tabular-nums">{dueCount}</div>
            <div className="text-xs font-medium text-amber-700 mt-1">待复习</div>
            {dueCount > 0 && <Link to="/" className="text-[10px] text-amber-600 hover:underline mt-1 inline-block">去复习</Link>}
          </div>
          <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 text-center">
            <div className="text-3xl font-bold text-sky-600 tabular-nums">{provisionalCount}</div>
            <div className="text-xs font-medium text-sky-700 mt-1">当堂会</div>
            <span className="text-[10px] text-sky-400 mt-1 inline-block">等待复习</span>
          </div>
        </section>
      )}

      {/* 总体进度卡片 */}
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="text-lg font-semibold text-indigo-100 mb-1">总体学习进度</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums">{totalPassed}</span>
              <span className="text-2xl text-indigo-200">/ {totalKPs}</span>
              <span className="text-sm text-indigo-200 ml-2">知识点已通过</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm text-indigo-100">
              <span className="tabular-nums">{overallPercent}% 完成</span>
              <span className="text-amber-300">
                ★ {totalStarsEarned} / {maxStarsTotal} 星
              </span>
            </div>
          </div>
          {/* 圆环进度 */}
          <div className="relative h-28 w-28 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="white"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - overallPercent / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold tabular-nums">{overallPercent}%</span>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <GradientBar
            percent={overallPercent}
            className="bg-gradient-to-r from-amber-300 to-yellow-200"
          />
        </div>
      </section>

      {/* 每年级细分 */}
      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">各年级进度</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {gradeStats.map((stat) => {
            const isComplete = stat.percent === 100;
            return (
              <Link
                key={stat.grade}
                to={`/grade/${stat.grade}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-400 hover:shadow-md min-h-[44px]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{gradeEmojis[stat.grade]}</span>
                    <span className="text-base font-bold text-slate-800">
                      {gradeLabels[stat.grade]}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isComplete
                        ? 'bg-green-100 text-green-700'
                        : stat.percent > 0
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isComplete ? '已完成' : stat.percent > 0 ? '进行中' : '未开始'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm text-slate-600">
                    已通过{' '}
                    <span className="font-bold text-slate-800 tabular-nums">{stat.passed}</span> /{' '}
                    {stat.total}
                  </span>
                  <span className="text-sm font-medium text-slate-500 tabular-nums">
                    {stat.percent}%
                  </span>
                </div>
                <GradientBar
                  percent={stat.percent}
                  className={
                    isComplete
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                      : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                  }
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="text-amber-400">★</span>
                    {stat.starsEarned} 星
                  </span>
                  <span>满分 {stat.maxStars} 星</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 公式推导进度 */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🔬</span>
          <h2 className="text-lg font-semibold text-amber-900">公式/课程接触</h2>
          <span className="ml-auto rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            核心内容
          </span>
        </div>
        <p className="text-sm text-amber-700 mb-4">
          公式怎么来的 — 理解公式原理是本课程的核心价值。此指标仅反映课程接触情况，不代表稳固掌握。
        </p>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm text-amber-800">
            已接触{' '}
            <span className="font-bold text-amber-900 tabular-nums">{derivationPassed}</span> /{' '}
            {derivationTotal} 个公式
          </span>
          <span className="text-sm font-medium text-amber-700 tabular-nums">
            {derivationPercent}%
          </span>
        </div>
        <GradientBar
          percent={derivationPercent}
          className="bg-gradient-to-r from-amber-500 to-orange-500"
        />
      </section>

      {/* 最近成就 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">最近成就</h2>
        {hasAnyProgress && recentAchievements.length > 0 ? (
          <ul className="space-y-3">
            {recentAchievements.map((ach, idx) => (
              <li key={ach.id}>
                <Link
                  to={`/kp/${ach.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50 min-h-[44px]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                    {recentAchievements.length - idx}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-slate-800">{ach.title}</span>
                      {ach.hasFormula && (
                        <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          公式
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{gradeLabels[ach.grade]}</span>
                  </div>
                  <span className="shrink-0 text-sm">
                    <StarDisplay count={ach.stars} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-4xl mb-3">🌟</span>
            <p className="text-slate-500 font-medium">还没有通过的知识点</p>
            <p className="mt-1 text-sm text-slate-400">
              从三年级开始你的数学之旅吧！每通过一个知识点都会记录在这里。
            </p>
            <Link
              to="/grade/3"
              className="mt-4 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 min-h-[44px] flex items-center"
            >
              开始学习三年级 →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
