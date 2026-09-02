import { describe, expect, it } from 'vitest';
import { chineseLessonIds } from '@/content/chinese';
import { englishLessonIds, englishUnits } from '@/content/english';
import { getAllKnowledgePoints, getCourseTrack } from '@/lib/content';
import { getPrimaryLearningTask } from '@/lib/platformTasks';
import type { ProgressData, SkillReviewSchedule } from '@/lib/types';

const NOW = 1_700_000_000_000;
const baseCourses = getAllKnowledgePoints().filter((course) => getCourseTrack(course.meta) === 'base');
const firstMath = baseCourses[0];
const allBasePassed = baseCourses.map((course) => course.meta.id);
const empty = (): ProgressData => ({ passedKnowledgePoints: [], stars: {} });

function dueSkill(skillId = 'frac.whole'): SkillReviewSchedule {
  return {
    skillId,
    targetSkillId: 'frac.notation',
    stage: 'd1',
    status: 'due',
    dueAt: NOW - 1,
    updatedAt: NOW - 10,
    contentVersion: 'v0.3',
    firstExposure: true,
    formId: 'a',
    attemptNo: 1,
  };
}

describe('getPrimaryLearningTask', () => {
  it('puts a due review ahead of current work in all three subjects', () => {
    const progress: ProgressData = {
      ...empty(),
      currentLearning: firstMath.meta.id,
      skillReviews: { 'frac.whole': dueSkill() },
      languageLessons: {
        chinese: { completedLessonIds: [], currentLessonId: chineseLessonIds[0], updatedAt: NOW },
        english: { completedLessonIds: [], currentLessonId: englishLessonIds[0], updatedAt: NOW },
      },
    };

    expect(getPrimaryLearningTask(progress, NOW)).toMatchObject({
      subject: 'math',
      phase: 'review',
      cta: '开始复习',
      link: expect.stringMatching(/^\/math\/repair\//),
    });
  });

  it('keeps the existing skill-review-before-course-review order', () => {
    const courseId = firstMath.meta.id;
    const progress: ProgressData = {
      ...empty(),
      passedKnowledgePoints: [courseId],
      mastery: {
        [courseId]: {
          status: 'provisional',
          lastAttemptAt: NOW - 100,
          nextReviewAt: NOW - 1,
          delayedReviewCount: 0,
        },
      },
      skillReviews: { 'frac.whole': dueSkill() },
    };

    expect(getPrimaryLearningTask(progress, NOW)?.link).toMatch(/^\/math\/repair\//);
  });

  it('breaks equal-due skill-review ties independently of object insertion order', () => {
    const notation = dueSkill('frac.notation');
    const whole = dueSkill('frac.whole');
    const first = getPrimaryLearningTask({
      ...empty(),
      skillReviews: { 'frac.whole': whole, 'frac.notation': notation },
    }, NOW);
    const second = getPrimaryLearningTask({
      ...empty(),
      skillReviews: { 'frac.notation': notation, 'frac.whole': whole },
    }, NOW);

    expect(first?.id).toBe(second?.id);
    expect(first?.link).toBe(second?.link);
  });

  it('maps an active repair to a math resume task', () => {
    const progress: ProgressData = {
      ...empty(),
      repairSession: {
        skillId: 'frac.whole',
        targetSkillId: 'frac.notation',
        status: 'active',
        updatedAt: NOW,
      },
    };

    expect(getPrimaryLearningTask(progress, NOW)).toMatchObject({
      subject: 'math',
      phase: 'resume',
      title: '确定单位“1”',
      link: '/math/repair/frac.whole?target=frac.notation',
    });
  });

  it('resumes a valid unfinished math current course with a canonical link', () => {
    const progress = { ...empty(), currentLearning: firstMath.meta.id };

    expect(getPrimaryLearningTask(progress, NOW)).toMatchObject({
      subject: 'math',
      phase: 'resume',
      title: firstMath.meta.title,
      link: `/math/kp/${firstMath.meta.id}`,
    });
  });

  it.each([
    ['missing', 'not-a-course', []],
    ['already passed', firstMath.meta.id, [firstMath.meta.id]],
  ])('ignores a %s math current course', (_label, currentLearning, passedKnowledgePoints) => {
    const task = getPrimaryLearningTask({ stars: {}, currentLearning, passedKnowledgePoints }, NOW);

    expect(task?.phase).toBe('next');
    expect(task?.link).not.toBe(`/math/kp/${currentLearning}`);
  });

  it('resumes a valid current Chinese lesson when math has no remaining base course', () => {
    const progress: ProgressData = {
      passedKnowledgePoints: allBasePassed,
      stars: {},
      languageLessons: {
        chinese: { completedLessonIds: [], currentLessonId: chineseLessonIds[0], updatedAt: NOW },
      },
    };

    expect(getPrimaryLearningTask(progress, NOW)).toMatchObject({
      subject: 'chinese',
      phase: 'resume',
      link: `/chinese/${chineseLessonIds[0]}`,
    });
  });

  it('ignores a jumping language current and selects the first incomplete lesson', () => {
    const progress: ProgressData = {
      passedKnowledgePoints: allBasePassed,
      stars: {},
      languageLessons: {
        chinese: { completedLessonIds: [], currentLessonId: chineseLessonIds[2], updatedAt: NOW },
      },
    };

    expect(getPrimaryLearningTask(progress, NOW)).toMatchObject({
      subject: 'chinese',
      phase: 'next',
      link: `/chinese/${chineseLessonIds[0]}`,
    });
  });

  it('ignores a completed language current and advances to the first incomplete lesson', () => {
    const progress: ProgressData = {
      passedKnowledgePoints: allBasePassed,
      stars: {},
      languageLessons: {
        chinese: {
          completedLessonIds: [chineseLessonIds[0]],
          currentLessonId: chineseLessonIds[0],
          updatedAt: NOW,
        },
      },
    };

    expect(getPrimaryLearningTask(progress, NOW)).toMatchObject({
      subject: 'chinese',
      phase: 'next',
      link: `/chinese/${chineseLessonIds[1]}`,
    });
  });

  it('chooses Chinese when Chinese and English resume tasks tie', () => {
    const progress: ProgressData = {
      passedKnowledgePoints: allBasePassed,
      stars: {},
      languageLessons: {
        chinese: { completedLessonIds: [], currentLessonId: chineseLessonIds[0], updatedAt: NOW },
        english: { completedLessonIds: [], currentLessonId: englishLessonIds[0], updatedAt: NOW },
      },
    };

    expect(getPrimaryLearningTask(progress, NOW)?.subject).toBe('chinese');
  });

  it('resumes preserved animal-unit progress even while the new first unit is incomplete', () => {
    const legacyLessonId = englishUnits[1].lessonIds[0];
    const progress: ProgressData = {
      passedKnowledgePoints: allBasePassed,
      stars: {},
      languageLessons: {
        chinese: { completedLessonIds: chineseLessonIds, currentLessonId: null, updatedAt: NOW },
        english: { completedLessonIds: [], currentLessonId: legacyLessonId, updatedAt: NOW },
      },
    };

    expect(getPrimaryLearningTask(progress, NOW)).toMatchObject({
      subject: 'english',
      phase: 'resume',
      link: `/english/${legacyLessonId}`,
    });
  });

  it('gives a new user the first available math course when all subjects have next tasks', () => {
    const task = getPrimaryLearningTask(empty(), NOW);

    expect(task).toMatchObject({
      subject: 'math',
      phase: 'next',
      title: firstMath.meta.title,
      link: `/math/kp/${firstMath.meta.id}`,
    });
  });

  it('returns null only when all base math and language lessons are complete with nothing due', () => {
    const progress: ProgressData = {
      passedKnowledgePoints: allBasePassed,
      stars: {},
      languageLessons: {
        chinese: { completedLessonIds: chineseLessonIds, currentLessonId: null, updatedAt: NOW },
        english: { completedLessonIds: englishLessonIds, currentLessonId: null, updatedAt: NOW },
      },
    };

    expect(getPrimaryLearningTask(progress, NOW)).toBeNull();
  });

  it('does not throw on unknown skill and language current IDs', () => {
    const progress: ProgressData = {
      passedKnowledgePoints: allBasePassed,
      stars: {},
      learningGoal: { skillId: 'unknown-skill', source: 'home', startedAt: NOW, updatedAt: NOW },
      languageLessons: {
        chinese: { completedLessonIds: ['unknown-lesson'], currentLessonId: 'unknown-lesson', updatedAt: NOW },
      },
    };

    expect(() => getPrimaryLearningTask(progress, NOW)).not.toThrow();
    expect(getPrimaryLearningTask(progress, NOW)?.link).toBe(`/chinese/${chineseLessonIds[0]}`);
  });
});
