import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '@/context/ProgressContext';
import { getSkillById } from '@/lib/knowledgeGraph';

export interface GoalContextBarProps {
  targetSkillId: string;
  goalUpdatedAt: number;
  surface: 'home' | 'map' | 'repair' | 'review' | 'course';
  mode: 'repair' | 'learning';
  currentSkillId?: string;
}

export default function GoalContextBar({
  targetSkillId,
  goalUpdatedAt,
  surface,
  mode,
  currentSkillId,
}: GoalContextBarProps) {
  const { emitEvent } = useProgress();
  const shownEventIdsRef = useRef(new Set<string>());
  const targetNode = getSkillById(targetSkillId);
  const targetSkill = targetNode?.status === 'published' ? targetNode : null;
  const currentNode = currentSkillId ? getSkillById(currentSkillId) : targetSkill;
  const currentSkill = currentNode?.status === 'published' ? currentNode : targetSkill;
  const eventSuffix = `${surface}:${targetSkillId}:${goalUpdatedAt}`;

  useEffect(() => {
    if (!targetSkill) return;

    const clientEventId = `trs:${eventSuffix}`;
    if (shownEventIdsRef.current.has(clientEventId)) return;

    shownEventIdsRef.current.add(clientEventId);
    emitEvent?.({
      clientEventId,
      eventName: 'target_resume_shown',
      skillId: targetSkillId,
      properties: { surface },
    });
  }, [emitEvent, eventSuffix, surface, targetSkill, targetSkillId]);

  if (!targetSkill) return null;

  const handleOpen = () => {
    emitEvent?.({
      clientEventId: `tro:${eventSuffix}`,
      eventName: 'target_resume_opened',
      skillId: targetSkillId,
      properties: { surface },
    });
  };

  return (
    <aside
      aria-label="学习目标"
      className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div>
          <span className="font-semibold text-indigo-700">我的目标</span>
          <span className="ml-2 text-slate-700">{targetSkill.name}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-500">
            {mode === 'repair' ? '当前在补' : '当前学习'}
          </span>
          <span className="ml-2 text-slate-700">{currentSkill?.name ?? targetSkill.name}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-500">完成后继续</span>
          <span className="ml-2 text-slate-700">{targetSkill.name}</span>
        </div>
        <Link
          to={`/map?target=${encodeURIComponent(targetSkillId)}`}
          onClick={handleOpen}
          className="inline-flex min-h-11 items-center rounded-lg bg-indigo-600 px-4 font-semibold text-white hover:bg-indigo-700"
        >
          继续我的目标
        </Link>
      </div>
      <p className="mt-2 text-xs text-slate-500">今天会 · 隔天还会 · 一周后还会</p>
    </aside>
  );
}
