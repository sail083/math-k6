import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getCourseRelations, getCourseTrack, getCurriculum, getTextbookRef, getTrackCourses, loadKnowledgePointDetail } from '@/lib/content';
import type { CourseTrack, KnowledgePoint as KnowledgePointType, TextbookFilter } from '@/lib/types';
import KnowledgePoint from '@/components/KnowledgePoint';
import GoalContextBar from '@/components/GoalContextBar';
import UiIcon from '@/components/UiIcon';
import { useProgress } from '@/context/ProgressContext';
import { getCourseMapping, getSkillById } from '@/lib/knowledgeGraph';

function isValidPublishedTarget(skillId: string | null | undefined): skillId is string {
  if (!skillId) return false;
  return getSkillById(skillId)?.status === 'published';
}

const trackLabels: Record<CourseTrack, string> = {
  base: '课内基础',
  extension: '能力拓展',
  challenge: '浅奥挑战',
};

export default function KnowledgePointPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { progress, setGoal, emitEvent } = useProgress();
  const [kp, setKp] = useState<KnowledgePointType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const startedEventIdsRef = useRef(new Set<string>());

  const urlTarget = searchParams.get('target');
  const storedGoalSkillId = progress.learningGoal?.skillId;
  const acceptsLearningGoal = kp !== null && getCourseTrack(kp.meta) === 'base';
  const validUrlTarget = acceptsLearningGoal && isValidPublishedTarget(urlTarget) ? urlTarget : null;
  const validStoredTarget = acceptsLearningGoal && isValidPublishedTarget(storedGoalSkillId) ? storedGoalSkillId : null;
  const targetSkillId = validUrlTarget ?? validStoredTarget ?? undefined;
  const goalUpdatedAt = progress.learningGoal?.updatedAt;
  const activeGoal = !!targetSkillId
    && validStoredTarget === targetSkillId
    && typeof goalUpdatedAt === 'number';
  const courseId = kp?.meta.id ?? null;
  const mappedCurrentSkillId = courseId
    ? getCourseMapping(courseId)?.coreSkills.find(isValidPublishedTarget)
    : undefined;
  const currentSkillId = mappedCurrentSkillId ?? targetSkillId;

  useEffect(() => {
    if (!validUrlTarget || validUrlTarget === validStoredTarget) return;
    setGoal(validUrlTarget, 'course');
  }, [setGoal, validStoredTarget, validUrlTarget]);

  useEffect(() => {
    if (!id) {
      setKp(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    loadKnowledgePointDetail(id).then((detail) => {
      if (cancelled) return;
      setKp(detail ?? null);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setError(true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!activeGoal || !courseId || !targetSkillId || goalUpdatedAt === undefined) return;
    const clientEventId = `tls:${courseId}:${targetSkillId}:${goalUpdatedAt}`;
    if (startedEventIdsRef.current.has(clientEventId)) return;
    startedEventIdsRef.current.add(clientEventId);
    emitEvent?.({
      clientEventId,
      eventName: 'target_learning_started',
      skillId: targetSkillId,
      courseId,
      properties: { surface: 'course' },
    });
  }, [activeGoal, courseId, emitEvent, goalUpdatedAt, targetSkillId]);

  if (loading) {
    return (
      <div className="knowledge-page">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-block" />
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-lg mb-4">加载失败，请检查网络后重试。</p>
        <Link to="/math" className="text-indigo-600 hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  if (!kp) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-lg">知识点不存在</p>
        <Link to="/math" className="text-indigo-600 hover:underline mt-4 inline-block">
          返回首页
        </Link>
      </div>
    );
  }

  const { meta } = kp;
  const rawVersion = searchParams.get('version');
  const version: TextbookFilter = rawVersion === '人教版' || rawVersion === '北师大版' || rawVersion === '苏教版'
    ? rawVersion
    : '全部';
  const displayGrade = getTextbookRef(meta, version)?.grade ?? meta.grade;
  const track = getCourseTrack(meta);
  const isBase = track === 'base';
  const curriculum = isBase ? getCurriculum(displayGrade, version) : getTrackCourses(track);
  const currentIndex = curriculum.findIndex((item) => item.meta.id === meta.id);
  const previous = currentIndex > 0 ? curriculum[currentIndex - 1] : undefined;
  const next = currentIndex >= 0 && currentIndex < curriculum.length - 1 ? curriculum[currentIndex + 1] : undefined;
  const queryString = `?${isBase ? `version=${encodeURIComponent(version)}` : `track=${track}`}${targetSkillId ? `&target=${encodeURIComponent(targetSkillId)}` : ''}`;
  const relations = getCourseRelations(meta.id);
  const passedIds = new Set(progress.passedKnowledgePoints);
  const nextTier = track === 'base' ? relations.extensionNext : track === 'extension' ? relations.challengeNext : [];
  const recommendedNext = nextTier.find((course) =>
    course.meta.prerequisites.every((id) => id === meta.id || passedIds.has(id)),
  );
  const resultNext = recommendedNext ?? next;
  const resultNextTrack = resultNext ? getCourseTrack(resultNext.meta) : track;
  const resultNextQuery = resultNext
    ? `?${resultNextTrack === 'base' ? `version=${encodeURIComponent(version)}` : `track=${resultNextTrack}`}`
    : '';
  const handleCoursePassed = activeGoal && targetSkillId && goalUpdatedAt !== undefined
    ? () => emitEvent?.({
      clientEventId: `tlc:${meta.id}:${targetSkillId}:${goalUpdatedAt}`,
      eventName: 'target_learning_completed',
      skillId: targetSkillId,
      courseId: meta.id,
      properties: { surface: 'course' },
    })
    : undefined;

  return (
    <div className="knowledge-page">
      {/* 面包屑导航 */}
      <div className="lesson-breadcrumb">
        <Link to={`/grade/${displayGrade}${queryString}`}>
          <UiIcon name="arrow-left" size={17}/> {isBase ? `${displayGrade}年级课程` : trackLabels[track]}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 font-medium">{meta.title}</span>
      </div>

      {activeGoal && targetSkillId && goalUpdatedAt !== undefined ? (
        <GoalContextBar
          targetSkillId={targetSkillId}
          goalUpdatedAt={goalUpdatedAt}
          surface="course"
          mode="learning"
          currentSkillId={currentSkillId}
        />
      ) : null}

      {(!isBase || relations.extensionNext.length > 0 || relations.challengeNext.length > 0) ? (
        <aside className="rounded-xl border border-slate-200 bg-white p-4" aria-label="能力阶梯">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold text-slate-400">相关基础</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(isBase ? [kp] : relations.baseCourses).map((course) => (
                  <Link key={course.meta.id} to={`/kp/${course.meta.id}?version=${encodeURIComponent(version)}`} className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                    {passedIds.has(course.meta.id) ? '✓ ' : ''}{course.meta.title}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">当前层级</p>
              <p className="mt-2 text-sm font-bold text-slate-800" aria-current="step">{trackLabels[track]}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">下一步</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...relations.extensionNext, ...relations.challengeNext].map((course) => (
                  <Link key={course.meta.id} to={`/kp/${course.meta.id}?track=${getCourseTrack(course.meta)}`} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    {trackLabels[getCourseTrack(course.meta)]} · {course.meta.title}
                  </Link>
                ))}
                {relations.extensionNext.length + relations.challengeNext.length === 0 ? <span className="text-xs text-slate-400">继续完成当前层级</span> : null}
              </div>
            </div>
          </div>
        </aside>
      ) : null}

      {/* 知识点内容（3-tab：讲解 / 原理 / 闯关） */}
      <KnowledgePoint
        key={kp.meta.id}
        knowledgePoint={kp}
        targetSkillId={targetSkillId}
        nextCourseTitle={activeGoal ? undefined : resultNext?.meta.title}
        nextActionLabel={activeGoal ? '继续我的目标' : recommendedNext ? `进入${trackLabels[resultNextTrack]}：${recommendedNext.meta.title}` : undefined}
        onNextCourse={activeGoal && targetSkillId
          ? () => navigate(`/map?target=${encodeURIComponent(targetSkillId)}`)
          : resultNext ? () => navigate(`/kp/${resultNext.meta.id}${resultNextQuery}`) : undefined}
        onCoursePassed={handleCoursePassed}
      />

      <nav className="course-navigation" aria-label="连续学习">
        {previous ? (
          <Link to={`/kp/${previous.meta.id}${queryString}`} className="previous-course-link">
            <UiIcon name="arrow-left"/><span><small>上一课</small><strong>{previous.meta.title}</strong></span>
          </Link>
        ) : <span className="previous-course-link is-empty" />}
        {next ? (
          <Link to={`/kp/${next.meta.id}${queryString}`} className="next-course-card">
            <div className="next-course-card__label"><UiIcon name="spark" size={18}/><span>下一课</span></div>
            <div className="next-course-card__content"><div><h2>{next.meta.title}</h2><p>预计 8 分钟 · 待学习</p></div><span className="next-course-card__arrow"><UiIcon name="arrow-right"/></span></div>
          </Link>
        ) : <div className="next-course-card is-complete"><div className="next-course-card__label"><UiIcon name="check" size={18}/><span>{isBase ? '本册课程已完成' : `本条${trackLabels[track]}路径已完成`}</span></div><div className="next-course-card__content"><div><h2>继续复习已经学过的知识</h2><p>回到课程列表查看学习记录</p></div></div></div>}
      </nav>
    </div>
  );
}
