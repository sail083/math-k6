import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/context/ProgressContext';

interface LearningCenterProps {
  completedCount: number;
  chineseCompletedCount: number;
  englishCompletedCount: number;
  legacyProgressAvailable: boolean;
  legacyCompletedCount: number;
  onImportLegacy: () => void;
  onDismissLegacy: () => void;
  onLogout: () => void | Promise<void>;
}

export function LearningCenter({
  completedCount,
  chineseCompletedCount,
  englishCompletedCount,
  legacyProgressAvailable,
  legacyCompletedCount,
  onImportLegacy,
  onDismissLegacy,
  onLogout,
}: LearningCenterProps) {
  return (
    <div className="app-frame min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-indigo-700 focus:shadow-lg"
      >
        跳到主要内容
      </a>
      <header className="app-header">
        <div className="app-container flex min-h-[68px] items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <span className="brand-mark" aria-hidden="true">学</span>
            <div className="brand-copy">
              <strong>学习中心</strong>
              <small>语文 · 数学 · 英语</small>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="min-h-11 rounded-lg px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
          >
            退出登录
          </button>
        </div>
      </header>

      <main id="main-content" className="app-main">
        <section aria-labelledby="learning-center-title" className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-8 text-white shadow-lg sm:px-8 sm:py-10">
          <p className="text-sm font-semibold text-indigo-100">我的学习空间</p>
          <h1 id="learning-center-title" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            今天想学哪一科？
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
            语文、数学和英语都已经可以学习。
          </p>
        </section>

        {legacyProgressAvailable ? (
          <section aria-labelledby="legacy-progress-title" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <h2 id="legacy-progress-title" className="font-bold">发现这台设备上的旧学习进度</h2>
            <p className="mt-2 text-sm leading-6">
              其中完成了 {legacyCompletedCount} 个旧数学知识点。请确认属于当前账号后再导入。
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={onImportLegacy} className="min-h-11 rounded-lg bg-amber-700 px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200">
                确认是我的，导入
              </button>
              <button type="button" onClick={onDismissLegacy} className="min-h-11 rounded-lg border border-amber-300 bg-white px-4 text-sm font-bold text-amber-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200">
                不是我的，不再提示
              </button>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="subjects-title" className="mt-8">
          <h2 id="subjects-title" className="text-lg font-bold text-slate-800">我的学科</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              to="/math"
              aria-label="进入数学"
              className="group flex min-h-[220px] flex-col justify-between rounded-2xl border-2 border-indigo-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-12 place-items-center rounded-xl bg-indigo-100 text-2xl" aria-hidden="true">∑</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">可学习</span>
                </div>
                <h3 id="subject-math-title" className="mt-5 text-2xl font-bold text-slate-900">数学</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {completedCount > 0 ? `已完成 ${completedCount} 个知识点` : '从第一课开始学习'}
                </p>
              </div>
              <span className="mt-6 flex min-h-11 items-center justify-between text-sm font-bold text-indigo-600">
                进入数学
                <span className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true">→</span>
              </span>
            </Link>

            <Link
              to="/chinese"
              aria-label="进入语文"
              className="group flex min-h-[220px] flex-col justify-between rounded-2xl border-2 border-rose-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-12 place-items-center rounded-xl bg-rose-100 text-2xl" aria-hidden="true">文</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">可学习</span>
                </div>
                <h3 id="subject-chinese-title" className="mt-5 text-2xl font-bold text-slate-900">语文</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {chineseCompletedCount > 0 ? `已完成 ${chineseCompletedCount} / 3 课` : '从第一课开始学习'}
                </p>
              </div>
              <span className="mt-6 flex min-h-11 items-center justify-between text-sm font-bold text-rose-600">
                进入语文
                <span className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true">→</span>
              </span>
            </Link>

            <Link
              to="/english"
              aria-label="进入英语"
              className="group flex min-h-[220px] flex-col justify-between rounded-2xl border-2 border-sky-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-12 place-items-center rounded-xl bg-sky-100 text-xl font-bold" aria-hidden="true">Aa</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">可学习</span>
                </div>
                <h3 id="subject-english-title" className="mt-5 text-2xl font-bold text-slate-900">英语</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">词汇、句型与听读</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">已完成 {englishCompletedCount} / 3 课</p>
              </div>
              <span className="mt-6 flex min-h-11 items-center justify-between text-sm font-bold text-sky-700">
                进入英语
                <span className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true">→</span>
              </span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="app-container py-4 text-center text-xs text-slate-500">
          语文 · 数学 · 英语综合学习平台
        </div>
      </footer>
    </div>
  );
}

export default function LearningCenterPage() {
  const { logout } = useAuth();
  const {
    progress,
    legacyProgressAvailable,
    legacyCompletedKnowledgePointCount,
    importLegacyProgress,
    dismissLegacyProgress,
  } = useProgress();

  return (
    <LearningCenter
      completedCount={progress.passedKnowledgePoints.length}
      chineseCompletedCount={progress.languageLessons?.chinese?.completedLessonIds.length ?? 0}
      englishCompletedCount={progress.languageLessons?.english?.completedLessonIds.length ?? 0}
      legacyProgressAvailable={legacyProgressAvailable}
      legacyCompletedCount={legacyCompletedKnowledgePointCount}
      onImportLegacy={importLegacyProgress}
      onDismissLegacy={dismissLegacyProgress}
      onLogout={logout}
    />
  );
}
