/**
 * KnowledgeContextStrip
 *
 * 在分数课程页面顶部显示知识图谱上下文：
 * 以前学过 / 正在学 / 下一步 / 易混对比
 *
 * 仅对 graph 中有 courseMapping 的课程渲染（其他课程返回 null）。
 */
import { Link } from 'react-router-dom';
import { getCourseContext, getSkillById } from '@/lib/knowledgeGraph';
import { getKnowledgePointById } from '@/lib/content';
import { useProgress } from '@/context/ProgressContext';
import type { SkillDisplayStatus } from '@/lib/progress';

const statusConfig: Record<SkillDisplayStatus, { label: string; dot: string }> = {
  not_started:       { label: '未开始', dot: 'bg-slate-300' },
  in_progress:       { label: '学习中', dot: 'bg-blue-400' },
  provisional:       { label: '当堂会', dot: 'bg-sky-400' },
  review_due:        { label: '待复习', dot: 'bg-amber-400' },
  stable:            { label: '已稳固', dot: 'bg-emerald-400' },
  needs_remediation: { label: '需补修', dot: 'bg-red-400' },
};

function StatusDot({ status }: { status: SkillDisplayStatus }) {
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${statusConfig[status].dot}`} />;
}

interface SkillChipProps {
  skillId: string;
  label: string;
}

function SkillChip({ skillId, label }: SkillChipProps) {
  const { getSkillDisplayStatus } = useProgress();
  const status = getSkillDisplayStatus(skillId);
  const cfg = statusConfig[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-xs text-slate-600"
      aria-label={`${label} — ${cfg.label}`}
    >
      <StatusDot status={status} />
      {label}
      <span className="text-slate-400">({cfg.label})</span>
    </span>
  );
}

function getCourseTitle(courseId: string): string {
  return getKnowledgePointById(courseId)?.meta.title ?? courseId;
}

interface KnowledgeContextStripProps {
  courseId: string;
  targetSkillId?: string;
}

function getTargetQuery(targetSkillId?: string): string {
  if (!targetSkillId || getSkillById(targetSkillId)?.status !== 'published') return '';
  return `?target=${encodeURIComponent(targetSkillId)}`;
}

export default function KnowledgeContextStrip({ courseId, targetSkillId }: KnowledgeContextStripProps) {
  const ctx = getCourseContext(courseId);
  if (!ctx) return null;

  const { coreSkills, reviewSkills, nextCourseIds, contrastSkills } = ctx;
  const targetQuery = getTargetQuery(targetSkillId);

  // Sort next courses by grade ascending, then by title (stable)
  const sortedNextCourseIds = [...nextCourseIds].sort((a, b) => {
    const gradeA = getKnowledgePointById(a)?.meta.grade ?? 99;
    const gradeB = getKnowledgePointById(b)?.meta.grade ?? 99;
    if (gradeA !== gradeB) return gradeA - gradeB;
    return (getCourseTitle(a) ?? a).localeCompare(getCourseTitle(b) ?? b);
  });

  const hasPrev = reviewSkills.length > 0;
  const hasNext = sortedNextCourseIds.length > 0;
  const hasContrast = contrastSkills.length > 0;
  const hasCore = coreSkills.length > 0;

  if (!hasPrev && !hasNext && !hasContrast && !hasCore) return null;

  return (
    <aside
      className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 space-y-2 text-xs"
      aria-label="知识图谱上下文"
    >
      {/* 以前学过（review skills） */}
      {hasPrev && (
        <div className="flex items-start gap-2 flex-wrap">
          <span className="shrink-0 font-semibold text-slate-500 w-16">相关基础</span>
          <div className="flex flex-wrap gap-1.5">
            {reviewSkills.map((n) => (
              <SkillChip key={n.id} skillId={n.id} label={n.name} />
            ))}
          </div>
        </div>
      )}

      {/* 正在学（core skills） */}
      {hasCore && (
        <div className="flex items-start gap-2 flex-wrap">
          <span className="shrink-0 font-semibold text-indigo-600 w-16">正在学</span>
          <div className="flex flex-wrap gap-1.5">
            {coreSkills.map((n) => (
              <SkillChip key={n.id} skillId={n.id} label={n.name} />
            ))}
          </div>
        </div>
      )}

      {/* 下一步（next courses） */}
      {hasNext && (
        <div className="flex items-start gap-2 flex-wrap">
          <span className="shrink-0 font-semibold text-slate-500 w-16">下一步</span>
          <div className="flex flex-wrap gap-1.5">
            {sortedNextCourseIds.map((id) => (
              <Link
                key={id}
                to={`/kp/${id}${targetQuery}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                {getCourseTitle(id)}
                <span className="text-indigo-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 易混对比 */}
      {hasContrast && (
        <div className="flex items-start gap-2 flex-wrap">
          <span className="shrink-0 font-semibold text-amber-600 w-16">易混对比</span>
          <div className="flex flex-wrap gap-1.5">
            {contrastSkills.map((n) => (
              <SkillChip key={n.id} skillId={n.id} label={n.name} />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
