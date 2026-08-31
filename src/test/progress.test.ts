import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadProgress,
  saveProgress,
  markPassed,
  markInitialPass,
  markDelayedReviewPass,
  markDelayedReviewFail,
  isPassed,
  isUnlocked,
  getStars,
  getOverallProgress,
  getMasteryStatus,
  getDueReviewIds,
  getReviewMode,
  setCurrentLearning,
  getCurrentLearning,
  pickBetterMastery,
  parseProgress,
  getNextLanguageLessonId,
  startLanguageLesson,
  completeLanguageLesson,
  mergeLanguageLessonProgress,
  hasMeaningfulProgress,
} from '@/lib/progress';
import type { ProgressData, MasteryRecord } from '@/lib/types';

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

describe('progress management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadProgress', () => {
    it('returns default progress when localStorage is empty', () => {
      const progress = loadProgress();
      expect(progress.passedKnowledgePoints).toEqual([]);
      expect(progress.stars).toEqual({});
    });

    it('validates and clamps stars values (0-3)', () => {
      // Stars above 3 get clamped to 3
      localStorage.setItem(
        'math-k6-progress',
        JSON.stringify({
          passedKnowledgePoints: [],
          stars: { 'kp-1': 5, 'kp-2': 3, 'kp-3': -1, 'kp-4': 2 },
        }),
      );
      const progress = loadProgress();
      expect(progress.stars['kp-1']).toBe(3); // clamped from 5
      expect(progress.stars['kp-2']).toBe(3);
      expect(progress.stars['kp-3']).toBe(0); // clamped from -1
      expect(progress.stars['kp-4']).toBe(2);
    });

    it('validates passedKnowledgePoints is an array', () => {
      // Non-array value should result in empty array
      localStorage.setItem(
        'math-k6-progress',
        JSON.stringify({
          passedKnowledgePoints: 'not-an-array',
          stars: {},
        }),
      );
      const progress = loadProgress();
      expect(progress.passedKnowledgePoints).toEqual([]);

      // Array with mixed types should filter to strings only
      localStorage.setItem(
        'math-k6-progress',
        JSON.stringify({
          passedKnowledgePoints: ['kp-1', 123, null, 'kp-2', true],
          stars: {},
        }),
      );
      const progress2 = loadProgress();
      expect(progress2.passedKnowledgePoints).toEqual(['kp-1', 'kp-2']);
    });
  });

  describe('saveProgress', () => {
    it('writes to localStorage', () => {
      const progress: ProgressData = {
        passedKnowledgePoints: ['g3-rect-area'],
        stars: { 'g3-rect-area': 3 },
      };
      saveProgress(progress);
      const stored = localStorage.getItem('math-k6-progress');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.passedKnowledgePoints).toEqual(['g3-rect-area']);
      expect(parsed.stars).toEqual({ 'g3-rect-area': 3 });
    });
  });

  describe('markPassed', () => {
    it('adds KP to passed list and keeps best star rating', () => {
      const initial: ProgressData = {
        passedKnowledgePoints: [],
        stars: {},
      };
      const updated = markPassed(initial, 'g3-rect-area', 2);
      expect(updated.passedKnowledgePoints).toContain('g3-rect-area');
      expect(updated.stars['g3-rect-area']).toBe(2);
    });

    it("doesn't duplicate already-passed KPs", () => {
      const initial: ProgressData = {
        passedKnowledgePoints: ['g3-rect-area'],
        stars: { 'g3-rect-area': 2 },
      };
      const updated = markPassed(initial, 'g3-rect-area', 1);
      expect(updated.passedKnowledgePoints.filter((id) => id === 'g3-rect-area')).toHaveLength(1);
      // Best star rating (2) should be kept, not lowered to 1
      expect(updated.stars['g3-rect-area']).toBe(2);
    });
  });

  describe('isPassed', () => {
    it('returns correct boolean', () => {
      const progress: ProgressData = {
        passedKnowledgePoints: ['g3-rect-area'],
        stars: {},
      };
      expect(isPassed(progress, 'g3-rect-area')).toBe(true);
      expect(isPassed(progress, 'g4-triangle')).toBe(false);
    });
  });

  describe('isUnlocked', () => {
    it('returns true when no prerequisites', () => {
      const progress: ProgressData = {
        passedKnowledgePoints: [],
        stars: {},
      };
      expect(isUnlocked(progress, [])).toBe(true);
    });

    it('keeps courses accessible when recommended prerequisites are not met', () => {
      const progress: ProgressData = {
        passedKnowledgePoints: ['g3-rect-area'],
        stars: {},
      };
      expect(isUnlocked(progress, ['g3-rect-perimeter'])).toBe(true);
    });

    it('returns true when all prerequisites passed', () => {
      const progress: ProgressData = {
        passedKnowledgePoints: ['g3-rect-area', 'g3-rect-perimeter'],
        stars: {},
      };
      expect(isUnlocked(progress, ['g3-rect-area', 'g3-rect-perimeter'])).toBe(true);
    });
  });

  describe('getStars', () => {
    it('returns 0 for unknown KP', () => {
      const progress: ProgressData = {
        passedKnowledgePoints: [],
        stars: { 'g3-rect-area': 3 },
      };
      expect(getStars(progress, 'g3-rect-area')).toBe(3);
      expect(getStars(progress, 'unknown-kp')).toBe(0);
    });
  });

  describe('getOverallProgress', () => {
    it('calculates correct percentage', () => {
      const progress: ProgressData = {
        passedKnowledgePoints: ['kp-1', 'kp-2'],
        stars: {},
      };
      // 2 out of 47 = 2/47
      expect(getOverallProgress(progress, 47)).toBeCloseTo(2 / 47, 5);
    });

    it('returns 0 when totalKnowledgePoints is 0', () => {
      const progress: ProgressData = {
        passedKnowledgePoints: ['kp-1'],
        stars: {},
      };
      expect(getOverallProgress(progress, 0)).toBe(0);
    });
  });

  describe('mastery state — legacy migration', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('loads old progress data without mastery or currentLearning fields', () => {
      localStorage.setItem(
        'math-k6-progress',
        JSON.stringify({
          passedKnowledgePoints: ['g3-rect-area'],
          stars: { 'g3-rect-area': 3 },
        }),
      );
      const progress = loadProgress();
      expect(progress.passedKnowledgePoints).toEqual(['g3-rect-area']);
      expect(progress.stars['g3-rect-area']).toBe(3);
      expect(progress.mastery).toEqual({});
      expect(progress.currentLearning).toBeNull();
    });

    it('loads progress data with mastery records and currentLearning', () => {
      localStorage.setItem(
        'math-k6-progress',
        JSON.stringify({
          passedKnowledgePoints: ['g5-fraction-meaning'],
          stars: { 'g5-fraction-meaning': 2 },
          mastery: {
            'g5-fraction-meaning': {
              status: 'provisional',
              lastAttemptAt: NOW,
              nextReviewAt: NOW + DAY,
              delayedReviewCount: 0,
            },
          },
          currentLearning: 'g6-fraction-mult',
        }),
      );
      const progress = loadProgress();
      expect(progress.mastery?.['g5-fraction-meaning']).toEqual({
        status: 'provisional',
        lastAttemptAt: NOW,
        nextReviewAt: NOW + DAY,
        delayedReviewCount: 0,
      });
      expect(progress.currentLearning).toBe('g6-fraction-mult');
    });
  });

  describe('markInitialPass', () => {
    it('creates a provisional mastery record when hasReviewSets is true', () => {
      const initial: ProgressData = { passedKnowledgePoints: [], stars: {} };
      const updated = markInitialPass(initial, 'g5-fraction-meaning', 2, NOW, true);
      expect(updated.passedKnowledgePoints).toContain('g5-fraction-meaning');
      expect(updated.stars['g5-fraction-meaning']).toBe(2);
      expect(updated.mastery?.['g5-fraction-meaning']).toEqual({
        status: 'provisional',
        lastAttemptAt: NOW,
        nextReviewAt: NOW + DAY,
        delayedReviewCount: 0,
      });
    });

    it('does not create a mastery record when hasReviewSets is false', () => {
      const initial: ProgressData = { passedKnowledgePoints: [], stars: {} };
      const updated = markInitialPass(initial, 'g3-rect-area', 3, NOW, false);
      expect(updated.passedKnowledgePoints).toContain('g3-rect-area');
      expect(updated.stars['g3-rect-area']).toBe(3);
      expect(updated.mastery?.['g3-rect-area']).toBeUndefined();
    });

    it('clears currentLearning when the passed course was the current learning target', () => {
      const initial: ProgressData = {
        passedKnowledgePoints: [],
        stars: {},
        currentLearning: 'g5-fraction-meaning',
      };
      const updated = markInitialPass(initial, 'g5-fraction-meaning', 2, NOW, true);
      expect(updated.currentLearning).toBeNull();
    });
  });

  describe('D1/D7 state transitions', () => {
    it('D1 pass moves to provisional with delayedReviewCount=1 and nextReviewAt 6 days out', () => {
      let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
      p = markInitialPass(p, 'g5-fraction-meaning', 2, NOW, true);
      // Before D1 is due, status is provisional
      expect(getMasteryStatus(p, 'g5-fraction-meaning', NOW)).toBe('provisional');
      // After 1 day, status becomes review_due
      expect(getMasteryStatus(p, 'g5-fraction-meaning', NOW + DAY)).toBe('review_due');
      // Pass D1 review
      const afterD1 = markDelayedReviewPass(p, 'g5-fraction-meaning', NOW + DAY);
      expect(afterD1.mastery?.['g5-fraction-meaning']?.delayedReviewCount).toBe(1);
      expect(afterD1.mastery?.['g5-fraction-meaning']?.status).toBe('provisional');
      expect(afterD1.mastery?.['g5-fraction-meaning']?.nextReviewAt).toBe(NOW + DAY + 6 * DAY);
    });

    it('D7 pass moves to stable with delayedReviewCount=2', () => {
      let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
      p = markInitialPass(p, 'g5-fraction-meaning', 2, NOW, true);
      const afterD1 = markDelayedReviewPass(p, 'g5-fraction-meaning', NOW + DAY);
      // D7 is due 6 days after D1 pass
      const d7Time = NOW + DAY + 6 * DAY;
      expect(getMasteryStatus(afterD1, 'g5-fraction-meaning', d7Time)).toBe('review_due');
      const afterD7 = markDelayedReviewPass(afterD1, 'g5-fraction-meaning', d7Time);
      expect(afterD7.mastery?.['g5-fraction-meaning']?.status).toBe('stable');
      expect(afterD7.mastery?.['g5-fraction-meaning']?.delayedReviewCount).toBe(2);
      expect(getMasteryStatus(afterD7, 'g5-fraction-meaning', d7Time)).toBe('stable');
    });

    it('failed review stays review_due without incrementing count', () => {
      let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
      p = markInitialPass(p, 'g5-fraction-meaning', 2, NOW, true);
      const afterFail = markDelayedReviewFail(p, 'g5-fraction-meaning', NOW + DAY);
      expect(afterFail.mastery?.['g5-fraction-meaning']?.delayedReviewCount).toBe(0);
      expect(getMasteryStatus(afterFail, 'g5-fraction-meaning', NOW + DAY)).toBe('review_due');
      // Still due after more time passes
      expect(getMasteryStatus(afterFail, 'g5-fraction-meaning', NOW + 10 * DAY)).toBe('review_due');
    });
  });

  describe('getDueReviewIds', () => {
    it('lists only review_due courses', () => {
      let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
      p = markInitialPass(p, 'g5-fraction-meaning', 2, NOW, true);
      p = markInitialPass(p, 'g6-fraction-mult', 3, NOW, true);
      // Both provisional immediately — neither due
      expect(getDueReviewIds(p, NOW)).toEqual([]);
      // After 1 day, both are due
      expect(getDueReviewIds(p, NOW + DAY).sort()).toEqual(['g5-fraction-meaning', 'g6-fraction-mult']);
      // Pass D1 for first course — only second remains due
      p = markDelayedReviewPass(p, 'g5-fraction-meaning', NOW + DAY);
      expect(getDueReviewIds(p, NOW + DAY)).toEqual(['g6-fraction-mult']);
    });

    it('returns empty array when no mastery records exist', () => {
      const p: ProgressData = { passedKnowledgePoints: ['g3-rect-area'], stars: {} };
      expect(getDueReviewIds(p, NOW)).toEqual([]);
    });
  });

  describe('getReviewMode', () => {
    it('returns null when not review_due (still provisional)', () => {
      let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
      p = markInitialPass(p, 'g5-fraction-meaning', 2, NOW, true);
      expect(getReviewMode(p, 'g5-fraction-meaning', NOW)).toBeNull();
    });

    it('returns d1 for first review (delayedReviewCount=0)', () => {
      let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
      p = markInitialPass(p, 'g5-fraction-meaning', 2, NOW, true);
      expect(getReviewMode(p, 'g5-fraction-meaning', NOW + DAY)).toBe('d1');
    });

    it('returns d7 for second review (delayedReviewCount=1)', () => {
      let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
      p = markInitialPass(p, 'g5-fraction-meaning', 2, NOW, true);
      p = markDelayedReviewPass(p, 'g5-fraction-meaning', NOW + DAY);
      const d7Time = NOW + DAY + 6 * DAY;
      expect(getReviewMode(p, 'g5-fraction-meaning', d7Time)).toBe('d7');
    });

    it('returns null after stable', () => {
      let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
      p = markInitialPass(p, 'g5-fraction-meaning', 2, NOW, true);
      p = markDelayedReviewPass(p, 'g5-fraction-meaning', NOW + DAY);
      p = markDelayedReviewPass(p, 'g5-fraction-meaning', NOW + DAY + 6 * DAY);
      expect(getReviewMode(p, 'g5-fraction-meaning', NOW + 100 * DAY)).toBeNull();
    });

    it('returns null when no mastery record exists', () => {
      const p: ProgressData = { passedKnowledgePoints: [], stars: {} };
      expect(getReviewMode(p, 'unknown-kp', NOW)).toBeNull();
    });
  });

  describe('setCurrentLearning / getCurrentLearning', () => {
    it('sets and gets current learning', () => {
      const p: ProgressData = { passedKnowledgePoints: [], stars: {} };
      const updated = setCurrentLearning(p, 'g5-fraction-meaning');
      expect(getCurrentLearning(updated)).toBe('g5-fraction-meaning');
    });

    it('returns null when currentLearning is not set', () => {
      const p: ProgressData = { passedKnowledgePoints: [], stars: {} };
      expect(getCurrentLearning(p)).toBeNull();
    });
  });

  describe('markInitialPass preserves existing mastery (defect C)', () => {
    it('does not downgrade a provisional D1-completed record on replay', () => {
      let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
      // Initial pass creates provisional with count=0
      p = markInitialPass(p, 'g5-fraction-meaning', 2, NOW, true);
      // Pass D1 -> count=1, nextReviewAt 6 days out
      p = markDelayedReviewPass(p, 'g5-fraction-meaning', NOW + DAY);
      const beforeReplay = p.mastery?.['g5-fraction-meaning'];
      expect(beforeReplay?.delayedReviewCount).toBe(1);
      expect(beforeReplay?.status).toBe('provisional');

      // Replay ordinary challenge — must preserve existing mastery
      const afterReplay = markInitialPass(p, 'g5-fraction-meaning', 3, NOW + 2 * DAY, true);
      const after = afterReplay.mastery?.['g5-fraction-meaning'];
      expect(after?.delayedReviewCount).toBe(1);
      expect(after?.status).toBe('provisional');
      expect(after?.nextReviewAt).toBe(beforeReplay?.nextReviewAt);
      // Stars should still update
      expect(afterReplay.stars['g5-fraction-meaning']).toBe(3);
    });

    it('does not downgrade a stable record on replay', () => {
      let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
      p = markInitialPass(p, 'g5-fraction-meaning', 2, NOW, true);
      p = markDelayedReviewPass(p, 'g5-fraction-meaning', NOW + DAY);
      p = markDelayedReviewPass(p, 'g5-fraction-meaning', NOW + DAY + 6 * DAY);
      expect(p.mastery?.['g5-fraction-meaning']?.status).toBe('stable');
      expect(p.mastery?.['g5-fraction-meaning']?.delayedReviewCount).toBe(2);

      // Replay ordinary challenge — stable must be preserved
      const afterReplay = markInitialPass(p, 'g5-fraction-meaning', 1, NOW + 30 * DAY, true);
      expect(afterReplay.mastery?.['g5-fraction-meaning']?.status).toBe('stable');
      expect(afterReplay.mastery?.['g5-fraction-meaning']?.delayedReviewCount).toBe(2);
    });
  });

  describe('pickBetterMastery (defect D)', () => {
    const rec = (overrides: Partial<MasteryRecord>): MasteryRecord => ({
      status: 'provisional',
      lastAttemptAt: 0,
      nextReviewAt: 0,
      delayedReviewCount: 0,
      ...overrides,
    });

    it('stable wins over provisional', () => {
      const stable = rec({ status: 'stable', delayedReviewCount: 2 });
      const prov = rec({ status: 'provisional', delayedReviewCount: 2, lastAttemptAt: NOW + 100 });
      expect(pickBetterMastery(stable, prov)).toBe(stable);
      expect(pickBetterMastery(prov, stable)).toBe(stable);
    });

    it('higher delayedReviewCount wins when both non-stable', () => {
      const higher = rec({ delayedReviewCount: 1, lastAttemptAt: NOW });
      const lower = rec({ delayedReviewCount: 0, lastAttemptAt: NOW + 100 });
      expect(pickBetterMastery(higher, lower)).toBe(higher);
      expect(pickBetterMastery(lower, higher)).toBe(higher);
    });

    it('newer lastAttemptAt wins for equal stage and count', () => {
      const newer = rec({ delayedReviewCount: 1, lastAttemptAt: NOW + 100 });
      const older = rec({ delayedReviewCount: 1, lastAttemptAt: NOW });
      expect(pickBetterMastery(newer, older)).toBe(newer);
      expect(pickBetterMastery(older, newer)).toBe(newer);
    });

    it('stable wins even when remote has newer lastAttemptAt', () => {
      const stable = rec({ status: 'stable', delayedReviewCount: 2, lastAttemptAt: NOW });
      const newer = rec({ status: 'provisional', delayedReviewCount: 1, lastAttemptAt: NOW + 1000 });
      expect(pickBetterMastery(stable, newer)).toBe(stable);
    });
  });

  describe('learning state detection (defect E)', () => {
    it('an unpassed course with currentLearning set is detectable as learning', () => {
      const p = setCurrentLearning(
        { passedKnowledgePoints: [], stars: {} },
        'g5-fraction-meaning',
      );
      expect(getCurrentLearning(p)).toBe('g5-fraction-meaning');
      expect(isPassed(p, 'g5-fraction-meaning')).toBe(false);
      expect(getMasteryStatus(p, 'g5-fraction-meaning', NOW)).toBeNull();
    });

    it('a passed course with stale currentLearning is not treated as learning', () => {
      let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
      p = setCurrentLearning(p, 'g5-fraction-meaning');
      p = markInitialPass(p, 'g5-fraction-meaning', 2, NOW, true);
      // currentLearning should be cleared after passing
      expect(getCurrentLearning(p)).toBeNull();
      expect(isPassed(p, 'g5-fraction-meaning')).toBe(true);
    });
  });

  describe('language lesson progress', () => {
    const lessons = ['zh-campus-words', 'zh-campus-reading', 'zh-campus-speaking'];

    it('keeps legacy storage readable but lets only the first user claim it', () => {
      localStorage.setItem('math-k6-progress', JSON.stringify({
        passedKnowledgePoints: ['legacy-math'],
        stars: { 'legacy-math': 2 },
      }));

      expect(loadProgress('user-a').passedKnowledgePoints).toEqual(['legacy-math']);
      expect(loadProgress('user-b').passedKnowledgePoints).toEqual([]);

      saveProgress({
        passedKnowledgePoints: [],
        stars: {},
        languageLessons: {
          chinese: { completedLessonIds: [lessons[0]], currentLessonId: lessons[1], updatedAt: NOW },
        },
      }, 'user-b');
      expect(loadProgress('user-b').languageLessons?.chinese?.currentLessonId).toBe(lessons[1]);
      expect(loadProgress('user-a').passedKnowledgePoints).toEqual(['legacy-math']);
    });

    it('filters malformed untrusted language progress without breaking legacy math data', () => {
      const parsed = parseProgress({
        passedKnowledgePoints: ['math-1'],
        stars: { 'math-1': 9 },
        languageLessons: {
          chinese: {
            completedLessonIds: [lessons[0], 42, lessons[0], ''],
            currentLessonId: 7,
            updatedAt: -20,
          },
          english: 'bad',
          science: { completedLessonIds: ['not-supported'] },
        },
      });

      expect(parsed.passedKnowledgePoints).toEqual(['math-1']);
      expect(parsed.stars['math-1']).toBe(3);
      expect(parsed.languageLessons).toEqual({
        chinese: { completedLessonIds: [lessons[0]], currentLessonId: null, updatedAt: 0 },
      });
    });

    it('starts and completes only the next lesson, then clears current after lesson three', () => {
      const empty: ProgressData = { passedKnowledgePoints: [], stars: {} };
      expect(startLanguageLesson(empty, 'chinese', lessons[1], lessons, NOW)).toBe(empty);

      const started = startLanguageLesson(empty, 'chinese', lessons[0], lessons, NOW);
      expect(started.languageLessons?.chinese?.currentLessonId).toBe(lessons[0]);
      expect(startLanguageLesson(started, 'chinese', lessons[0], lessons, NOW + 1)).toBe(started);

      const firstDone = completeLanguageLesson(started, 'chinese', lessons[0], lessons, NOW + 2);
      expect(firstDone.languageLessons?.chinese).toEqual({
        completedLessonIds: [lessons[0]],
        currentLessonId: lessons[1],
        updatedAt: NOW + 2,
      });
      expect(completeLanguageLesson(firstDone, 'chinese', lessons[0], lessons, NOW + 3)).toBe(firstDone);
      expect(completeLanguageLesson(firstDone, 'chinese', lessons[2], lessons, NOW + 3)).toBe(firstDone);

      const secondDone = completeLanguageLesson(firstDone, 'chinese', lessons[1], lessons, NOW + 4);
      const allDone = completeLanguageLesson(secondDone, 'chinese', lessons[2], lessons, NOW + 5);
      expect(getNextLanguageLessonId(allDone, 'chinese', lessons)).toBeNull();
      expect(allDone.languageLessons?.chinese?.currentLessonId).toBeNull();
    });

    it('merges completed lessons and never revives a stale or completed current lesson', () => {
      const merged = mergeLanguageLessonProgress(
        { completedLessonIds: [lessons[0]], currentLessonId: lessons[1], updatedAt: NOW },
        { completedLessonIds: [lessons[1]], currentLessonId: lessons[0], updatedAt: NOW + 1 },
      );
      expect(merged).toEqual({
        completedLessonIds: [lessons[0], lessons[1]].sort(),
        currentLessonId: null,
        updatedAt: NOW + 1,
      });

      const tie = mergeLanguageLessonProgress(
        { completedLessonIds: [], currentLessonId: lessons[0], updatedAt: NOW },
        { completedLessonIds: [], currentLessonId: lessons[1], updatedAt: NOW },
      );
      expect(tie.currentLessonId).toBeNull();
    });

    it('treats language-only activity as meaningful progress', () => {
      expect(hasMeaningfulProgress({
        passedKnowledgePoints: [],
        stars: {},
        languageLessons: {
          chinese: { completedLessonIds: [], currentLessonId: lessons[0], updatedAt: NOW },
        },
      })).toBe(true);
    });
  });
});
