import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  graph,
  getSkillById,
  getSkillContext,
  getHardPrerequisitePath,
  getRemediationSuggestion,
  getNextActionableSkill,
  type SkillNode,
} from '@/lib/knowledgeGraph';
import { getKnowledgePointById } from '@/lib/content';
import { useProgress } from '@/context/ProgressContext';
import type { SkillDisplayStatus } from '@/lib/progress';
import { repairUnits } from '@/lib/repairContent';

const repairUnitMap = new Map(repairUnits.map((u) => [u.skillId, u]));


// ===== 状态颜色与标签 =====

const statusConfig: Record<SkillDisplayStatus, { label: string; bg: string; border: string; text: string; dot: string }> = {
  not_started:       { label: '未开始',   bg: 'bg-slate-50',    border: 'border-slate-200', text: 'text-slate-400', dot: 'bg-slate-300' },
  in_progress:       { label: '学习中',   bg: 'bg-blue-50',     border: 'border-blue-200',  text: 'text-blue-600',  dot: 'bg-blue-400' },
  provisional:       { label: '当堂会',   bg: 'bg-sky-50',      border: 'border-sky-300',   text: 'text-sky-700',   dot: 'bg-sky-400' },
  review_due:        { label: '待复习',   bg: 'bg-amber-50',    border: 'border-amber-300', text: 'text-amber-700', dot: 'bg-amber-400' },
  stable:            { label: '已稳固',   bg: 'bg-emerald-50',  border: 'border-emerald-300',text: 'text-emerald-700',dot: 'bg-emerald-400' },
  needs_remediation: { label: '需补修',   bg: 'bg-red-50',      border: 'border-red-300',   text: 'text-red-700',   dot: 'bg-red-400' },
};

// ===== 辅助函数 =====

function getCourseTitle(courseId: string): string | undefined {
  return getKnowledgePointById(courseId)?.meta.title;
}

/** Check if a skill ID corresponds to a published node in the graph */
function isValidPublishedTarget(id: string): boolean {
  const node = getSkillById(id);
  return !!node && node.status === 'published';
}

function getStepReason(skillId: string, laterIds: string[]): string {
  // Target step: no later IDs means this IS the goal
  if (laterIds.length === 0) {
    const node = getSkillById(skillId);
    return `这是你的学习目标：${node?.name ?? skillId}`;
  }
  for (const laterId of laterIds) {
    const edge = graph.edges.find(
      (e) => e.from === skillId && e.to === laterId && e.type === 'REQUIRES_HARD' && e.status === 'published',
    );
    if (edge) return edge.reason;
  }
  const fromNode = getSkillById(skillId);
  const toNode = getSkillById(laterIds[0]);
  return `先掌握"${fromNode?.name ?? skillId}"，才能学习"${toNode?.name ?? laterIds[0]}"`;
}

// ===== 辅助组件 =====

function StatusDot({ status }: { status: SkillDisplayStatus }) {
  const { dot } = statusConfig[status];
  return <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />;
}

function SkillCard({
  node,
  status,
  selected,
  onClick,
}: {
  node: SkillNode;
  status: SkillDisplayStatus;
  selected: boolean;
  onClick: () => void;
}) {
  const cfg = statusConfig[status];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${node.name} — ${cfg.label}`}
      className={`w-full text-left rounded-lg border p-3 transition-all hover:shadow-sm min-h-[44px] ${cfg.bg} ${cfg.border} ${
        selected ? 'ring-2 ring-indigo-500 ring-offset-1 shadow-md' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <StatusDot status={status} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold leading-tight ${cfg.text}`}>{node.name}</p>
          <p className={`text-xs mt-0.5 truncate ${cfg.text}`}>{cfg.label}</p>
        </div>
      </div>
    </button>
  );
}

/** Inline status chip with readable status text and aria-label */
function StatusChip({ skillId, label }: { skillId: string; label: string }) {
  const { getSkillDisplayStatus } = useProgress();
  const status = getSkillDisplayStatus(skillId);
  const cfg = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${cfg.bg} ${cfg.border} ${cfg.text}`}
      aria-label={`${label} — ${cfg.label}`}
    >
      <StatusDot status={status} />
      {label}
      <span className="opacity-70">({cfg.label})</span>
    </span>
  );
}

/** Course link with Chinese title instead of raw courseId */
function CourseLink({ courseId, role }: { courseId: string; role: 'core' | 'review' | 'transfer' }) {
  const title = getCourseTitle(courseId);
  return (
    <Link
      to={`/kp/${courseId}`}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
    >
      <span>{title ?? courseId}</span>
      <span className="text-indigo-400">
        {role === 'core' ? '（核心）' : role === 'review' ? '（复习）' : '（迁移）'}
      </span>
    </Link>
  );
}

// ===== 节点详情面板 =====

function NodeDetailPanel({
  node,
  status,
  onClose,
}: {
  node: SkillNode;
  status: SkillDisplayStatus;
  onClose: () => void;
}) {
  const { getSkillDisplayStatus, hasDirectSkillEvidence } = useProgress();
  const ctx = getSkillContext(node.id);
  const cfg = statusConfig[status];

  // 生成学习路径（完整，不截断）
  const stableIds = new Set<string>();
  for (const n of graph.nodes) {
    if (getSkillDisplayStatus(n.id) === 'stable') stableIds.add(n.id);
  }
  const fullPath = getHardPrerequisitePath(node.id, stableIds);

  // 补修建议：仅在 needs_remediation 时生成
  const remediation = status === 'needs_remediation'
    ? getRemediationSuggestion(node.id, (id) => hasDirectSkillEvidence(id))
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg p-5 space-y-4">
      {/* 标题行 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} ${cfg.border} border`}>
            <StatusDot status={status} />
            {cfg.label}
          </div>
          <h2 className="text-lg font-bold text-slate-800 mt-1">{node.name}</h2>
          <p className="text-xs text-slate-400">G{node.gradeRange[0]}-G{node.gradeRange[1]}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-slate-400 hover:text-slate-600 text-xl leading-none p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="关闭"
        >
          ×
        </button>
      </div>

      {/* 定义与边界 */}
      <div>
        <p className="text-sm text-slate-600">{node.definition}</p>
        <p className="text-xs text-slate-400 mt-1">验证边界：{node.boundary}</p>
      </div>

      {/* 常见误区 */}
      {node.misconceptions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-600 mb-1">⚠ 常见误区</p>
          <ul className="space-y-0.5">
            {node.misconceptions.map((m, i) => (
              <li key={i} className="text-xs text-slate-500">• {m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 补修建议 */}
      {remediation && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1.5">
          <p className="text-xs font-semibold text-red-600">🔧 建议补修</p>
          <p className="text-sm text-slate-700">
            建议诊断/补这一小步：<strong>{remediation.skillName}</strong>
          </p>
          <p className="text-xs text-slate-500">{remediation.reason}</p>
          {remediation.courseId && (
            <Link
              to={`/kp/${remediation.courseId}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors"
            >
              前往：{getCourseTitle(remediation.courseId) ?? remediation.courseId} →
            </Link>
          )}
          {!remediation.courseId && (
            <p className="text-xs text-slate-400">该技能暂无关联课程</p>
          )}
        </div>
      )}

      {/* 学习路径（前置，完整不截断） */}
      {fullPath.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-indigo-600 mb-1.5">📍 学习路径（需先掌握）</p>
          <div className="flex flex-wrap gap-1.5">
            {fullPath.map((id) => (
              <StatusChip key={id} skillId={id} label={getSkillById(id)?.name ?? id} />
            ))}
          </div>
        </div>
      )}

      {/* 下游技能 */}
      {ctx.nextSkills.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-1.5">➡ 下一步</p>
          <div className="flex flex-wrap gap-1.5">
            {ctx.nextSkills.map((n) => (
              <StatusChip key={n.id} skillId={n.id} label={n.name} />
            ))}
          </div>
        </div>
      )}

      {/* 易混对比 */}
      {ctx.contrastSkills.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-600 mb-1.5">↔ 易混对比</p>
          <div className="flex flex-wrap gap-1.5">
            {ctx.contrastSkills.map((n) => (
              <StatusChip key={n.id} skillId={n.id} label={n.name} />
            ))}
          </div>
        </div>
      )}

      {/* 关联课程 */}
      {ctx.mappedCourses.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-1.5">📚 关联课程</p>
          <div className="flex flex-wrap gap-2">
            {ctx.mappedCourses.map(({ courseId, role }) => (
              <CourseLink key={courseId} courseId={courseId} role={role} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 目标路径区 =====

interface PathStep {
  skillId: string;
  node: SkillNode | null;
  status: SkillDisplayStatus;
  reason: string;
  courseId?: string;
  courseTitle?: string;
  index: number;
}

function TargetPathSection({
  targetSkillId,
  onSelectTarget,
}: {
  targetSkillId: string;
  onSelectTarget: (id: string) => void;
}) {
  const { getSkillDisplayStatus, isSkillReadyForPath } = useProgress();

  const isReady = useCallback(
    (id: string) => isSkillReadyForPath(id),
    [isSkillReadyForPath],
  );

  const targetPath = useMemo<PathStep[]>(() => {
    const stableIds = new Set<string>();
    for (const n of graph.nodes) {
      if (getSkillDisplayStatus(n.id) === 'stable') stableIds.add(n.id);
    }
    const prereqs = getHardPrerequisitePath(targetSkillId, stableIds);
    const fullIds = [...prereqs, targetSkillId];

    return fullIds.map((skillId, index) => {
      const node = getSkillById(skillId);
      const status = getSkillDisplayStatus(skillId);
      const laterIds = fullIds.slice(index + 1);
      const reason = getStepReason(skillId, laterIds);
      const cm = graph.courseMappings.find((c) => c.coreSkills.includes(skillId));
      const courseId = cm?.courseId;
      const courseTitle = courseId ? getCourseTitle(courseId) : undefined;
      return { skillId, node, status, reason, courseId, courseTitle, index: index + 1 };
    });
  }, [targetSkillId, getSkillDisplayStatus]);

  // 使用 isSkillReadyForPath 找下一步（替代仅看 stable 的旧逻辑）
  const nextActionableSkillId = useMemo(
    () => getNextActionableSkill(targetSkillId, isReady),
    [targetSkillId, isReady],
  );

  const nextStep = nextActionableSkillId
    ? targetPath.find((s) => s.skillId === nextActionableSkillId) ?? null
    : null;

  const targetNode = getSkillById(targetSkillId);

  const nextRepairUnit = nextStep ? repairUnitMap.get(nextStep.skillId) : null;

  return (
    <section className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-4" aria-label="目标路径">
      {/* 目标选择 */}
      <div className="flex items-center gap-3 flex-wrap">
        <label htmlFor="target-select" className="text-sm font-semibold text-indigo-700">我的目标</label>
        <select
          id="target-select"
          value={targetSkillId}
          onChange={(e) => onSelectTarget(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white min-h-[44px]"
        >
          {graph.nodes.filter((n) => n.status === 'published').map((n) => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </select>
      </div>

      {/* 纵向路径列表 */}
      <div>
        <p className="text-xs font-semibold text-indigo-600 mb-2">📍 目标路径（完整纵向）</p>
        <ol className="space-y-2">
          {targetPath.map((step) => {
            const cfg = statusConfig[step.status];
            const isTarget = step.skillId === targetSkillId;
            return (
              <li key={step.skillId} className="flex items-start gap-3">
                <span
                  className={`shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${
                    isTarget ? 'bg-violet-600' : 'bg-indigo-400'
                  }`}
                  aria-label={`步骤 ${step.index}`}
                >
                  {step.index}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-700">
                      {step.node?.name ?? step.skillId}
                    </span>
                    <span className={`text-xs ${cfg.text}`}>({cfg.label})</span>
                    {isTarget && (
                      <span className="text-xs font-semibold text-violet-600">— 目标</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{step.reason}</p>
                  {step.courseId && step.courseTitle && (
                    <Link
                      to={`/kp/${step.courseId}`}
                      className="text-xs text-indigo-600 hover:underline mt-0.5 inline-block"
                    >
                      📚 {step.courseTitle} →
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* 下一小步 */}
      {nextStep ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-700">下一小步</p>
          <div className="mt-2 space-y-2">
            <div>
              <p className="text-sm text-slate-700 font-medium">
                {nextStep.node?.name ?? nextStep.skillId}
              </p>
              <p className="text-xs text-slate-500">状态：{statusConfig[nextStep.status].label}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {nextRepairUnit ? (
                <>
                  <Link
                    to={`/repair/${nextStep.skillId}?target=${targetSkillId}`}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-700 transition-colors min-h-[44px] font-medium"
                  >
                    ⚡ 2分钟诊断
                  </Link>
                  {nextStep.courseId && nextStep.courseTitle && (
                    <Link
                      to={`/kp/${nextStep.courseId}`}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs border border-amber-300 text-amber-700 bg-white hover:bg-amber-50 transition-colors min-h-[44px]"
                    >
                      📚 完整课程
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs border border-slate-200 text-slate-400 bg-slate-50 min-h-[44px]">
                    微补修准备中
                  </span>
                  {nextStep.courseId && nextStep.courseTitle && (
                    <Link
                      to={`/kp/${nextStep.courseId}`}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs bg-amber-600 text-white hover:bg-amber-700 transition-colors min-h-[44px]"
                    >
                      前往课程：{nextStep.courseTitle} →
                    </Link>
                  )}
                  {!nextStep.courseId && (
                    <span className="text-xs text-slate-400">该技能暂无关联课程</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-semibold text-emerald-700">
            🎉 目标路径上所有前置技能均已稳固！
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">
            {targetNode?.name ?? targetSkillId} 的所有前置已掌握，可以开始学习目标了。
          </p>
        </div>
      )}
    </section>
  );
}

// ===== 图谱分组 =====

const groupDefs = [
  {
    id: 'g3',
    label: '三年级：分数初步',
    ids: [
      'frac.whole', 'frac.equal_partition', 'frac.need', 'frac.notation',
      'frac.unit_fraction', 'frac.multiple_units', 'frac.representations',
      'frac.same_whole', 'frac.compare_same_denominator', 'frac.compare_same_numerator',
      'frac.add_sub_same_denominator', 'frac.one_boundary',
    ],
  },
  {
    id: 'g5',
    label: '五年级：分数运算',
    ids: [
      'frac.as_quotient', 'frac.equivalence', 'frac.basic_property',
      'frac.common_factor', 'frac.reduction', 'frac.simplest_form',
      'frac.common_multiple', 'frac.common_denominator',
      'frac.add_sub_unlike_denominator', 'frac.number_types',
    ],
  },
  {
    id: 'g6',
    label: '六年级：分数乘除',
    ids: [
      'frac.of_quantity', 'frac.multiply_integer', 'frac.multiply_fraction',
      'frac.reduce_before_multiply', 'frac.reciprocal',
      'frac.division_grouping', 'frac.division_sharing', 'frac.divide_transform',
    ],
  },
  {
    id: 'bridge',
    label: '桥接：跨域应用',
    ids: [
      'bridge.fraction_decimal',
      'bridge.fraction_percent',
      'bridge.fraction_ratio',
      'bridge.ratio_proportion',
    ],
  },
];

// ===== 主页面 =====

export default function KnowledgeMapPage() {
  const { getSkillDisplayStatus, setGoal, progress } = useProgress();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [filterStatus, setFilterStatus] = useState<SkillDisplayStatus | 'all'>('all');
  const [repairedSkillId, setRepairedSkillId] = useState<string | null>(null);

  // R2: Derive validated target from URL param, learningGoal, or default
  const rawUrlTarget = searchParams.get('target');
  const validUrlTarget = rawUrlTarget && isValidPublishedTarget(rawUrlTarget) ? rawUrlTarget : null;
  const validGoalTarget = progress.learningGoal?.skillId && isValidPublishedTarget(progress.learningGoal.skillId)
    ? progress.learningGoal.skillId
    : null;
  const DEFAULT_TARGET = 'frac.divide_transform';
  const targetSkillId = useMemo(
    () => validUrlTarget ?? validGoalTarget ?? DEFAULT_TARGET,
    [validUrlTarget, validGoalTarget],
  );

  // R2: Clean invalid URL target via replace (no technical IDs in URL)
  useEffect(() => {
    if (rawUrlTarget && !isValidPublishedTarget(rawUrlTarget)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('target');
      setSearchParams(newParams, { replace: true });
    }
  }, [rawUrlTarget, searchParams, setSearchParams]);

  // R2: Persist valid URL target as learningGoal (only when actually different)
  useEffect(() => {
    if (validUrlTarget && validUrlTarget !== progress.learningGoal?.skillId) {
      setGoal(validUrlTarget);
    }
  }, [validUrlTarget, progress.learningGoal?.skillId, setGoal]);

  // Handle ?repaired=<skillId> one-time toast (no auto-dismiss, user must close)
  useEffect(() => {
    const repaired = searchParams.get('repaired');
    if (repaired) {
      // Validate repaired param is a known graph node
      const repairNode = getSkillById(repaired);
      setRepairedSkillId(repairNode ? repaired : null);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('repaired');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSelectTarget = (id: string) => {
    setGoal(id);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('target', id);
    setSearchParams(newParams, { replace: true });
  };

  // 统计
  const statusCounts = useMemo(() => {
    const counts: Record<SkillDisplayStatus, number> = {
      not_started: 0,
      in_progress: 0,
      provisional: 0,
      review_due: 0,
      stable: 0,
      needs_remediation: 0,
    };
    for (const node of graph.nodes) {
      counts[getSkillDisplayStatus(node.id)]++;
    }
    return counts;
  }, [getSkillDisplayStatus]);

  const selectedStatus: SkillDisplayStatus = selectedNode
    ? getSkillDisplayStatus(selectedNode.id)
    : 'not_started';

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-7 text-white shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">知识地图</h1>
        <p className="text-indigo-100 text-sm">当前覆盖小学 G3-G6 分数领域，共 {graph.nodes.length} 个微技能节点。</p>
      </section>

      {/* 补修成功提示 */}
      {repairedSkillId && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 flex items-center justify-between gap-3" role="status">
          <p className="text-sm text-emerald-700 font-medium">
            ✅ 已完成 <strong>{getSkillById(repairedSkillId)?.name ?? repairedSkillId}</strong> 的微补修！继续向目标推进。
          </p>
          <button
            type="button"
            onClick={() => setRepairedSkillId(null)}
            className="text-emerald-500 hover:text-emerald-700 text-lg leading-none min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="关闭提示"
          >
            ×
          </button>
        </div>
      )}

      {/* 目标路径区 */}
      <TargetPathSection
        targetSkillId={targetSkillId}
        onSelectTarget={handleSelectTarget}
      />

      {/* 状态图例 + 过滤 */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold text-slate-500 mb-3">状态图例（点击过滤）</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[44px] ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            全部 ({graph.nodes.length})
          </button>
          {(Object.entries(statusConfig) as [SkillDisplayStatus, typeof statusConfig[SkillDisplayStatus]][]).map(
            ([s, cfg]) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s === filterStatus ? 'all' : s)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors min-h-[44px] ${
                  filterStatus === s
                    ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                <StatusDot status={s} />
                {cfg.label} ({statusCounts[s]})
              </button>
            ),
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 节点网格 */}
        <div className="lg:col-span-2 space-y-5">
          {groupDefs.map((group) => {
            const nodes = group.ids
              .map((id) => graph.nodes.find((n) => n.id === id))
              .filter(Boolean) as SkillNode[];

            const filtered = filterStatus === 'all'
              ? nodes
              : nodes.filter((n) => getSkillDisplayStatus(n.id) === filterStatus);

            if (filtered.length === 0) return null;

            return (
              <section key={group.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-slate-600 mb-3">{group.label}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filtered.map((node) => (
                    <SkillCard
                      key={node.id}
                      node={node}
                      status={getSkillDisplayStatus(node.id)}
                      selected={selectedNode?.id === node.id}
                      onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* 详情面板 */}
        <div className="lg:col-span-1">
          {selectedNode ? (
            <div className="sticky top-24">
              <NodeDetailPanel
                node={selectedNode}
                status={selectedStatus}
                onClose={() => setSelectedNode(null)}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-400">点击左侧任意节点<br />查看详细信息和学习路径</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
