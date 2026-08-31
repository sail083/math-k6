import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProgress } from '@/context/ProgressContext';
import { getAllKnowledgePoints, getCourseTrack } from '@/lib/content';
import { getPrimaryLearningTask, type PrimaryTask } from '@/lib/platformTasks';

const mathCourses = getAllKnowledgePoints().filter((course) => getCourseTrack(course.meta) === 'base');
const subjectLabels: Record<PrimaryTask['subject'], string> = { math: '数学', chinese: '语文', english: '英语' };
const phaseLabels: Record<PrimaryTask['phase'], string> = { review: '待复习', resume: '继续学习', next: '下一课' };

interface LearningCenterProps {
  primaryTask: PrimaryTask | null;
  completedCount: number;
  mathTotalCount: number;
  chineseCompletedCount: number;
  englishCompletedCount: number;
  legacyProgressAvailable: boolean;
  legacyCompletedCount: number;
  onImportLegacy: () => void;
  onDismissLegacy: () => void;
  onLogout: () => void | Promise<void>;
}

export function LearningCenter({
  primaryTask,
  completedCount,
  mathTotalCount,
  chineseCompletedCount,
  englishCompletedCount,
  legacyProgressAvailable,
  legacyCompletedCount,
  onImportLegacy,
  onDismissLegacy,
  onLogout,
}: LearningCenterProps) {
  const mathDone = Math.max(0, Math.min(completedCount, mathTotalCount));
  const chineseDone = Math.max(0, Math.min(chineseCompletedCount, 3));
  const englishDone = Math.max(0, Math.min(englishCompletedCount, 3));
  const mathProgress = mathTotalCount > 0 ? Math.round(mathDone / mathTotalCount * 100) : 0;
  const chineseProgress = Math.round(chineseDone / 3 * 100);
  const englishProgress = Math.round(englishDone / 3 * 100);
  const subjectLabel = primaryTask ? subjectLabels[primaryTask.subject] : '';
  const phaseLabel = primaryTask ? phaseLabels[primaryTask.phase] : '';

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

      <main id="main-content" tabIndex={-1} className="app-main">
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

        <section aria-labelledby="next-step-title" className="mt-8">
          <h2 id="next-step-title" className="text-lg font-bold text-slate-800">今天下一步</h2>
          {primaryTask ? (
            <Link
              to={primaryTask.link}
              aria-label={`${primaryTask.cta}：${primaryTask.title}`}
              className={`group mt-4 block rounded-2xl border-2 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 motion-reduce:transform-none motion-reduce:transition-none sm:p-6 ${
                primaryTask.phase === 'review'
                  ? 'border-amber-300 focus-visible:ring-amber-200'
                  : primaryTask.phase === 'resume'
                    ? 'border-indigo-200 focus-visible:ring-indigo-200'
                    : 'border-emerald-200 focus-visible:ring-emerald-200'
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className={`text-xs font-bold ${
                    primaryTask.phase === 'review'
                      ? 'text-amber-700'
                      : primaryTask.phase === 'resume'
                        ? 'text-indigo-700'
                        : 'text-emerald-700'
                  }`}>
                    {subjectLabel} · {phaseLabel}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{primaryTask.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {primaryTask.reason} · {primaryTask.duration}
                  </p>
                </div>
                <span className="inline-flex min-h-11 shrink-0 items-center font-bold text-indigo-700">
                  {primaryTask.cta}
                  <span className="ml-2 transition-transform group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ) : (
            <div role="status" className="mt-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5 sm:p-6">
              <p className="text-xs font-bold text-emerald-700">已完成</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">本阶段学习已完成</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">语文、数学、英语当前课程都已完成，没有待复习任务。</p>
            </div>
          )}
        </section>

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
                  已完成 {mathDone} / {mathTotalCount} 课
                </p>
                <div
                  role="progressbar"
                  aria-label="数学学习进度"
                  aria-valuemin={0}
                  aria-valuemax={Math.max(mathTotalCount, 1)}
                  aria-valuenow={mathDone}
                  aria-valuetext={`已完成 ${mathDone} / ${mathTotalCount} 课`}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-indigo-100"
                >
                  <span className="block h-full rounded-full bg-indigo-600" style={{ width: `${mathProgress}%` }} />
                </div>
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
                  已完成 {chineseDone} / 3 课
                </p>
                <div
                  role="progressbar"
                  aria-label="语文学习进度"
                  aria-valuemin={0}
                  aria-valuemax={3}
                  aria-valuenow={chineseDone}
                  aria-valuetext={`已完成 ${chineseDone} / 3 课`}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-rose-100"
                >
                  <span className="block h-full rounded-full bg-rose-600" style={{ width: `${chineseProgress}%` }} />
                </div>
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
                <p className="mt-1 text-sm leading-6 text-slate-500">已完成 {englishDone} / 3 课</p>
                <div
                  role="progressbar"
                  aria-label="英语学习进度"
                  aria-valuemin={0}
                  aria-valuemax={3}
                  aria-valuenow={englishDone}
                  aria-valuetext={`已完成 ${englishDone} / 3 课`}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-sky-100"
                >
                  <span className="block h-full rounded-full bg-sky-700" style={{ width: `${englishProgress}%` }} />
                </div>
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
  const passed = new Set(progress.passedKnowledgePoints);

  return (
    <LearningCenter
      primaryTask={getPrimaryLearningTask(progress, Date.now())}
      completedCount={mathCourses.filter((course) => passed.has(course.meta.id)).length}
      mathTotalCount={mathCourses.length}
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
