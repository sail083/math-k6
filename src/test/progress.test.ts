import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadProgress,
  saveProgress,
  markPassed,
  isPassed,
  isUnlocked,
  getStars,
  getOverallProgress,
} from '@/lib/progress';
import type { ProgressData } from '@/lib/types';

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

    it('returns false when prerequisites not met', () => {
      const progress: ProgressData = {
        passedKnowledgePoints: ['g3-rect-area'],
        stars: {},
      };
      expect(isUnlocked(progress, ['g3-rect-perimeter'])).toBe(false);
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
});
