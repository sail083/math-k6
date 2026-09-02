import { chineseLessons } from '@/content/chinese';
import { englishLessons, englishUnits } from '@/content/english';
import {
  getAllKnowledgePoints,
  getCourseTrack,
  getKnowledgePointById,
} from '@/lib/content';
import { getSkillById } from '@/lib/knowledgeGraph';
import {
  getDueReviewIds,
  getHomeTasks,
  getNextLanguageLessonId,
  type HomeTask,
} from '@/lib/progress';
import type { LanguageLesson, LanguageSubject, ProgressData } from '@/lib/types';

export interface PrimaryTask {
  id: string;
  subject: 'math' | LanguageSubject;
  phase: 'review' | 'resume' | 'next';
  title: string;
  reason: string;
  duration: string;
  cta: '开始复习' | '继续学习' | '开始学习';
  link: string;
}

interface RankedTask extends PrimaryTask {
  order: number;
  time: number;
}

const phaseRank: Record<PrimaryTask['phase'], number> = { review: 0, resume: 1, next: 2 };
const subjectRank: Record<PrimaryTask['subject'], number> = { math: 0, chinese: 1, english: 2 };

function canonicalMathLink(link: string): string {
  if (link === '/math' || link.startsWith('/math/')) return link;
  return `/math${link.startsWith('/') ? link : `/${link}`}`;
}

function publishedSkillName(skillId: string | undefined): string | null {
  if (!skillId) return null;
  const skill = getSkillById(skillId);
  return skill?.status === 'published' ? skill.name : null;
}

function normalizeMathTask(
  task: HomeTask,
  progress: ProgressData,
): RankedTask | null {
  const review = task.type === 'skill_review' || task.type === 'course_review';
  const resume = task.type === 'active_repair'
    || task.type === 'course_intervention'
    || task.type === 'learning_goal'
    || task.type === 'current_learning';
  if (!review && !resume) return null;

  const course = task.courseId ? getKnowledgePointById(task.courseId) : undefined;
  const skillName = publishedSkillName(task.skillId);
  if (task.courseId && !course) return null;
  if (task.skillId && !skillName) return null;
  if (task.type === 'active_repair' && !publishedSkillName(progress.repairSession?.targetSkillId)) return null;
  if (
    task.type === 'course_intervention'
    && !publishedSkillName(progress.courseIntervention?.targetSkillId)
  ) return null;
  if (task.type === 'skill_review') {
    const targetSkillId = task.skillId ? progress.skillReviews?.[task.skillId]?.targetSkillId : undefined;
    if (!publishedSkillName(targetSkillId)) return null;
  }
  if (
    task.type === 'current_learning'
    && (!task.courseId || progress.passedKnowledgePoints.includes(task.courseId))
  ) return null;

  const orderByType: Record<HomeTask['type'], number> = {
    skill_review: 0,
    course_review: 1,
    active_repair: 0,
    course_intervention: 1,
    learning_goal: 2,
    current_learning: 3,
    next_course: 4,
  };
  const time = task.type === 'skill_review' && task.skillId
    ? progress.skillReviews?.[task.skillId]?.dueAt ?? 0
    : task.type === 'course_review' && task.courseId
      ? progress.mastery?.[task.courseId]?.nextReviewAt ?? 0
      : 0;

  return {
    id: `math:${task.eventCycleId}`,
    subject: 'math',
    phase: review ? 'review' : 'resume',
    title: course?.meta.title ?? skillName ?? task.title,
    reason: task.reason || (review ? '复习时间到了' : '继续上次的数学学习'),
    duration: task.duration ?? '约5分钟',
    cta: review ? '开始复习' : '继续学习',
    link: canonicalMathLink(task.link),
    order: orderByType[task.type],
    time,
  };
}

function normalizeLanguageTask(
  subject: LanguageSubject,
  lessons: LanguageLesson[],
  progress: ProgressData,
): RankedTask | null {
  const lessonIds = lessons.map((lesson) => lesson.id);
  const currentLessonId = progress.languageLessons?.[subject]?.currentLessonId;
  const currentUnit = subject === 'english' && currentLessonId
    ? englishUnits.find((unit) => unit.lessonIds.includes(currentLessonId))
    : undefined;
  const resumableLessonId = currentUnit
    && getNextLanguageLessonId(progress, subject, currentUnit.lessonIds) === currentLessonId
    ? currentLessonId
    : null;
  const targetLessonId = resumableLessonId ?? getNextLanguageLessonId(progress, subject, lessonIds);
  if (!targetLessonId) return null;
  const lessonIndex = lessonIds.indexOf(targetLessonId);
  const lesson = lessons[lessonIndex];
  if (!lesson) return null;

  const isResume = currentLessonId === targetLessonId;
  const label = subject === 'chinese' ? '语文' : '英语';
  return {
    id: `${subject}:${isResume ? 'resume' : 'next'}:${lesson.id}`,
    subject,
    phase: isResume ? 'resume' : 'next',
    title: lesson.title,
    reason: isResume ? `按顺序继续${label}课程` : `这是当前可以学习的第 ${lessonIndex + 1} 课`,
    duration: '约5分钟',
    cta: isResume ? '继续学习' : '开始学习',
    link: `/${subject}/${lesson.id}`,
    order: lessonIndex,
    time: 0,
  };
}

function normalizeNextMathCourse(progress: ProgressData): RankedTask | null {
  const passed = new Set(progress.passedKnowledgePoints);
  const unpassed = getAllKnowledgePoints().filter(
    (course) => getCourseTrack(course.meta) === 'base' && !passed.has(course.meta.id),
  ).sort((a, b) =>
    a.meta.grade - b.meta.grade
      || a.meta.unit - b.meta.unit
      || a.meta.id.localeCompare(b.meta.id));
  const course = unpassed.find(
    (candidate) => candidate.meta.prerequisites.every((id) => passed.has(id)),
  ) ?? unpassed[0];
  if (!course) return null;

  return {
    id: `math:next:${course.meta.id}`,
    subject: 'math',
    phase: 'next',
    title: course.meta.title,
    reason: course.meta.prerequisites.every((id) => passed.has(id))
      ? '前置知识已完成，可以开始'
      : '可以自由学习，建议先复习前置知识',
    duration: '约5分钟',
    cta: '开始学习',
    link: `/math/kp/${course.meta.id}`,
    order: 0,
    time: 0,
  };
}

/** 返回综合学习中心唯一主任务；无副作用，相同进度与时间得到相同结果。 */
export function getPrimaryLearningTask(progress: ProgressData, now: number): PrimaryTask | null {
  const dueCourseIds = getDueReviewIds(progress, now).sort((a, b) =>
    (progress.mastery?.[a]?.nextReviewAt ?? 0) - (progress.mastery?.[b]?.nextReviewAt ?? 0)
      || a.localeCompare(b));
  const candidates: RankedTask[] = getHomeTasks(progress, dueCourseIds, now)
    .map((task) => normalizeMathTask(task, progress))
    .filter((task): task is RankedTask => task !== null);

  const languageTasks = [
    normalizeLanguageTask('chinese', chineseLessons, progress),
    normalizeLanguageTask('english', englishLessons, progress),
  ].filter((task): task is RankedTask => task !== null);
  candidates.push(...languageTasks);

  const nextMath = normalizeNextMathCourse(progress);
  if (nextMath) candidates.push(nextMath);

  const selected = candidates.sort((a, b) =>
    phaseRank[a.phase] - phaseRank[b.phase]
      || subjectRank[a.subject] - subjectRank[b.subject]
      || a.order - b.order
      || a.time - b.time
      || a.id.localeCompare(b.id))[0];
  if (!selected) return null;
  return {
    id: selected.id,
    subject: selected.subject,
    phase: selected.phase,
    title: selected.title,
    reason: selected.reason,
    duration: selected.duration,
    cta: selected.cta,
    link: selected.link,
  };
}
