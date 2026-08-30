import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoalContextBar from '@/components/GoalContextBar';
import { getGrades, getCurriculum, getChallengeCourses, getAllKnowledgePoints, getKnowledgePointById } from '@/lib/content';
import { getCourseMapping, getSkillById } from '@/lib/knowledgeGraph';
import { useProgress } from '@/context/ProgressContext';
import { useAuth } from '@/context/AuthContext';
import type { TextbookFilter } from '@/lib/types';
import type { HomeTask } from '@/lib/progress';

const gradeMeta: Record<number, { title: string; desc: string; emoji: string }> = {
  3: { title: '三年级', desc: '面积、分数初步认识', emoji: '📐' },
  4: { title: '四年级', desc: '运算律、三角形', emoji: '✏️' },
  5: { title: '五年级', desc: '多边形面积、分数运算', emoji: '📏' },
  6: { title: '六年级', desc: '圆、圆柱与圆锥', emoji: '⭕' },
};

const versionOptions: TextbookFilter[] = ['全部', '人教版', '北师大版', '苏教版'];

const versionColors: Record<TextbookFilter, string> = {
  全部: 'bg-indigo-600 text-white',
  人教版: 'bg-rose-600 text-white',
  北师大版: 'bg-sky-600 text-white',
  苏教版: 'bg-emerald-600 text-white',
};

/** Resolve a display title for a HomeTask using knowledge graph / content lookups */
function resolveTaskTitle(task: HomeTask): string {
  if (task.type === 'skill_review' && task.skillId) {
    const node = getSkillById(task.skillId);
    if (node) return node.name;
  }
  if (task.type === 'course_review' && task.courseId) {
    const kp = getKnowledgePointById(task.courseId);
    if (kp) return kp.meta.title;
  }
  if (task.type === 'active_repair' && task.skillId) {
    const node = getSkillById(task.skillId);
    if (node) return node.name;
  }
  if (task.type === 'course_intervention' && task.courseId) {
    const kp = getKnowledgePointById(task.courseId);
    if (kp) return kp.meta.title;
  }
  if (task.type === 'learning_goal' && task.skillId) {
    const node = getSkillById(task.skillId);
    if (node) return node.name;
  }
  if (task.type === 'current_learning' && task.courseId) {
    const kp = getKnowledgePointById(task.courseId);
    if (kp) return kp.meta.title;
  }
  return task.title;
}

export default function HomePage() {
  const grades = getGrades();
  const { progress, isPassed, getDueReviewIds, getMasteryStatus, getHomeTasks, getDueSkillReviews, setGoal, emitEvent } = useProgress();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [version, setVersion] = useState<TextbookFilter>('全部');

  const learningGoal = progress.learningGoal;
  const goalSkill = learningGoal ? getSkillById(learningGoal.skillId) : null;
  const validGoal = learningGoal && goalSkill?.status === 'published' ? learningGoal : null;
  const activeGoalRepair = validGoal
    && progress.repairSession?.status === 'active'
    && progress.repairSession.targetSkillId === validGoal.skillId
    ? progress.repairSession
    : null;

  const goalEntryViewedRef = useRef(false);
  useEffect(() => {
    if (!validGoal && user && !goalEntryViewedRef.current) {
      goalEntryViewedRef.current = true;
      emitEvent({
        clientEventId: 'gev:home:v0.4',
        eventName: 'goal_entry_viewed',
        properties: { surface: 'home' },
      });
    }
  }, [validGoal, user, emitEvent]);

  const handleGoalSelect = (skillId: string) => {
    setGoal(skillId, 'home');
    navigate(`/map?target=${encodeURIComponent(skillId)}`);
  };

  // Compute task list (priority-based)
  const allKPs = getAllKnowledgePoints();
  const challengeCourses = getChallengeCourses();
  const dueReviews = getDueReviewIds();
  const dueSkillReviewCount = getDueSkillReviews().length;
  const tasks = getHomeTasks().filter(
    (task) => task.type !== 'learning_goal' || validGoal !== null,
  );

  // Primary task = first item; upcoming = next 2
  const primaryTask = tasks[0] ?? null;
  const upcomingTasks = tasks.slice(1, 3);

  // F3: home_task_viewed — idempotent per task identity/due cycle
  const viewedRef = useRef<string | null>(null);
  useEffect(() => {
    if (primaryTask && user) {
      const cycleId = primaryTask.eventCycleId;
      if (viewedRef.current !== cycleId) {
        viewedRef.current = cycleId;
        emitEvent({
          clientEventId: `htv:${cycleId}`,
          eventName: 'home_task_viewed',
          skillId: primaryTask.skillId,
          courseId: primaryTask.courseId,
        });
      }
    }
  }, [primaryTask, user, emitEvent]);

  // F3: home_task_opened on CTA click
  const handleTaskClick = (task: HomeTask) => {
    if (user) {
      emitEvent({
        clientEventId: `hto:${task.eventCycleId}`,
        eventName: 'home_task_opened',
        skillId: task.skillId,
        courseId: task.courseId,
      });
    }
  };

  // Fallback: next new course when no tasks exist
  let fallbackTask: { link: string; title: string; description: string } | null = null;
  if (!primaryTask) {
    const firstRecommended = allKPs.find(
      (kp) => kp.meta.track !== 'challenge'
        && !isPassed(kp.meta.id)
        && kp.meta.prerequisites.every((p) => isPassed(p)),
    );
    const target = firstRecommended ?? allKPs.find((kp) => kp.meta.track !== 'challenge' && !isPassed(kp.meta.id));
    if (target) {
      const hasUnmetPrereqs = target.meta.prerequisites.some((p) => !isPassed(p));
      fallbackTask = {
        link: `/kp/${target.meta.id}`,
        title: target.meta.title,
        description: hasUnmetPrereqs
          ? `${target.meta.grade}年级 · 可自由学习，建议先复习前置知识。`
          : `${target.meta.grade}年级 · 还没有学过的知识点，从这里开始吧。`,
      };
    }
  }

  // 计算推荐课程的路径语境
  const primaryKpId = primaryTask?.courseId ?? (primaryTask?.link?.startsWith('/kp/') ? primaryTask.link.replace('/kp/', '') : null);
  const primaryMapping = primaryKpId ? getCourseMapping(primaryKpId) : null;
  const primaryPath = primaryMapping && primaryMapping.coreSkills.length > 0
    ? `数字与运算 › 分数 › ${getSkillById(primaryMapping.coreSkills[0])?.name ?? ''}`
    : null;

  // Compute stable/provisional/due counts (F6: include skill reviews in due count)
  const stableCount = allKPs.filter((kp) => getMasteryStatus(kp.meta.id) === 'stable').length;
  const dueCount = dueReviews.length + dueSkillReviewCount;
  const provisionalCount = allKPs.filter((kp) => getMasteryStatus(kp.meta.id) === 'provisional').length;

  // 计算每个版本覆盖的知识点总数
  const versionCoverage: Record<string, number> = {
    人教版: 0,
    北师大版: 0,
    苏教版: 0,
  };
  for (const g of grades) {
    for (const kp of getCurriculum(g)) {
      for (const ref of kp.meta.textbookRefs) {
        versionCoverage[ref.version] = (versionCoverage[ref.version] ?? 0) + 1;
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* 欢迎横幅 */}
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-8 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">一次讲透小学数学</h1>
        <p className="text-indigo-100 text-sm sm:text-base">
          可视化讲解 · 公式原理推导 · 闯关巩固练习，让每个知识点都真正理解。
        </p>
      </section>

      {validGoal ? (
        <GoalContextBar
          targetSkillId={validGoal.skillId}
          goalUpdatedAt={validGoal.updatedAt}
          surface="home"
          mode={activeGoalRepair ? 'repair' : 'learning'}
          currentSkillId={activeGoalRepair?.skillId ?? validGoal.skillId}
        />
      ) : (
        <section className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-5">
          <h2 className="text-lg font-bold text-slate-800">你想先学会什么？</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ['frac.notation', '认识并读懂分数'],
              ['frac.multiply_fraction', '学会分数乘法'],
              ['frac.divide_transform', '学会分数除法'],
            ].map(([skillId, label]) => (
              <button
                key={skillId}
                type="button"
                onClick={() => handleGoalSelect(skillId)}
                className="min-h-11 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition-all hover:border-indigo-400 hover:shadow-sm"
              >
                {label}
              </button>
            ))}
          </div>
          <Link to="/map" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            看看更多目标
          </Link>
        </section>
      )}

      {/* 今日任务 */}
      {(primaryTask || fallbackTask) && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 mb-2">今日任务</h2>

          {/* Primary task card */}
          {primaryTask ? (
            <Link
              to={primaryTask.link}
              onClick={() => handleTaskClick(primaryTask)}
              className={`block rounded-xl border-2 p-5 transition-all hover:shadow-md min-h-[88px] ${
                primaryTask.urgent
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-indigo-200 bg-indigo-50/60'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className={`text-xs font-bold ${primaryTask.urgent ? 'text-amber-600' : 'text-indigo-500'}`}>
                    {primaryTask.reason}
                  </span>
                  <h2 className="text-lg font-bold text-slate-800 mt-1 truncate">
                    {resolveTaskTitle(primaryTask)}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {primaryTask.title}
                    {primaryTask.duration && ` · ${primaryTask.duration}`}
                  </p>
                  {primaryPath && (
                    <p className="text-xs text-indigo-500 mt-1">📍 {primaryPath}</p>
                  )}
                </div>
                <span className={`shrink-0 text-2xl ${primaryTask.urgent ? 'text-amber-400' : 'text-indigo-400'}`}>→</span>
              </div>
            </Link>
          ) : fallbackTask ? (
            <Link
              to={fallbackTask.link}
              className="block rounded-xl border-2 border-indigo-200 bg-indigo-50/60 p-5 transition-all hover:shadow-md min-h-[88px]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-indigo-500">开始学习</span>
                  <h2 className="text-lg font-bold text-slate-800 mt-1 truncate">{fallbackTask.title}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{fallbackTask.description}</p>
                </div>
                <span className="shrink-0 text-2xl text-indigo-400">→</span>
              </div>
            </Link>
          ) : null}

          {/* Upcoming task previews (max 2) */}
          {upcomingTasks.length > 0 && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {upcomingTasks.map((task) => (
                <Link
                  key={`${task.type}-${task.skillId ?? task.courseId ?? ''}`}
                  to={task.link}
                  onClick={() => handleTaskClick(task)}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-all hover:border-indigo-300 hover:shadow-sm min-h-[44px]"
                >
                  <div className="min-w-0 flex-1">
                    <span className={`text-xs font-medium ${task.urgent ? 'text-amber-600' : 'text-slate-500'}`}>
                      {task.reason}
                    </span>
                    <p className="text-sm font-semibold text-slate-700 truncate">
                      {resolveTaskTitle(task)}
                    </p>
                    {task.duration && (
                      <p className="text-xs text-slate-400">{task.duration}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-slate-300">→</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 掌握概览 */}
      {(stableCount > 0 || dueCount > 0 || provisionalCount > 0) && (
        <section className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600 tabular-nums">{stableCount}</div>
            <div className="text-xs text-emerald-700 mt-0.5">已稳固</div>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
            <div className="text-2xl font-bold text-amber-600 tabular-nums">{dueCount}</div>
            <div className="text-xs text-amber-700 mt-0.5">待复习</div>
          </div>
          <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 text-center">
            <div className="text-2xl font-bold text-sky-600 tabular-nums">{provisionalCount}</div>
            <div className="text-xs text-sky-700 mt-0.5">当堂会</div>
          </div>
        </section>
      )}

      {/* 思维挑战入口 */}
      <section>
        <Link
          to="/grade/3?track=challenge"
          className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 transition-all hover:border-amber-400 hover:shadow-md"
        >
          <div>
            <p className="text-xs font-semibold text-amber-600">数学思维挑战</p>
            <p className="mt-0.5 text-base font-bold text-slate-800">把课内知识用到新问题里</p>
            <p className="mt-0.5 text-xs text-slate-500">周期、枚举、和差倍、鸡兔同笼 · {challengeCourses.length} 课连续路径</p>
          </div>
          <span className="shrink-0 text-xl text-amber-500">→</span>
        </Link>
      </section>

      {/* 知识地图入口 */}
      <section>
        <Link
          to="/map"
          className="flex items-center justify-between gap-4 rounded-xl border border-violet-200 bg-violet-50/60 p-4 transition-all hover:shadow-md hover:border-violet-400"
        >
          <div>
            <p className="text-xs font-semibold text-violet-500">分数知识图谱</p>
            <p className="text-base font-bold text-slate-800 mt-0.5">查看我的知识地图</p>
            <p className="text-xs text-slate-500 mt-0.5">G3-G6 分数领域 · 34 个微技能 · 可视化掌握进度</p>
          </div>
          <span className="shrink-0 text-violet-400 text-xl">🗺</span>
        </Link>
      </section>

      {/* 教材版本过滤 */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-slate-600">📚 已收录教材</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {versionOptions.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVersion(v)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all min-h-[44px] ${
                version === v
                  ? versionColors[v] + ' shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        {version !== '全部' && (
          <p className="mt-3 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{version}</span>
            覆盖{' '}
            <span className="font-bold text-indigo-600 tabular-nums">
              {versionCoverage[version]}
            </span>{' '}
            个知识点
          </p>
        )}
      </section>

      {/* 年级卡片 */}
      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">选择年级开始学习</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {grades.map((g) => {
            const kps = getCurriculum(g, version);
            const passed = kps.filter((kp) =>
              progress.passedKnowledgePoints.includes(kp.meta.id),
            ).length;
            const meta = gradeMeta[g];
            return (
              <Link
                key={g}
                to={`/grade/${g}?version=${encodeURIComponent(version)}`}
                className="group block rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-400 hover:shadow-md min-h-[44px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{meta.emoji}</span>
                    <div>
                      <div className="text-lg font-bold text-slate-800">{meta.title}</div>
                      <div className="text-sm text-slate-500">{meta.desc}</div>
                    </div>
                  </div>
                  <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <span>
                    {version !== '全部' && (
                      <span className="text-indigo-500 font-medium">{version} · </span>
                    )}
                    {kps.length} 个知识点
                  </span>
                  {kps.length > 0 && (
                    <>
                      <span>·</span>
                      <span>已通过 {passed}</span>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
