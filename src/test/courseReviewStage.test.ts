import { describe, expect, it } from 'vitest';
import { DAY_MS, markInitialPass, markDelayedReviewPass, markDelayedReviewFail } from '@/lib/progress';
import type { ProgressData } from '@/lib/types';

const now = 1_700_000_000_000;
const started = () => markInitialPass({ passedKnowledgePoints: [], stars: {} }, 'course', 3, now, true);

describe('course review settlement', () => {
  it('rejects early reviews and duplicate or stale D1 settlements even when D7 becomes due', () => {
    const original = started();
    expect(markDelayedReviewPass(original, 'course', now, 'd1')).toBe(original);
    const d1 = markDelayedReviewPass(original, 'course', now + DAY_MS, 'd1');
    expect(d1.mastery?.course.delayedReviewCount).toBe(1);
    expect(markDelayedReviewPass(d1, 'course', now + DAY_MS, 'd1')).toBe(d1);
    expect(markDelayedReviewPass(d1, 'course', now + DAY_MS, 'd7')).toBe(d1);
    expect(markDelayedReviewPass(d1, 'course', now + 7 * DAY_MS, 'd1')).toBe(d1);
    expect(markDelayedReviewFail(d1, 'course', now + 7 * DAY_MS, 'd1')).toBe(d1);
    const d7 = markDelayedReviewPass(d1, 'course', now + 7 * DAY_MS, 'd7');
    expect(d7.mastery?.course.status).toBe('stable');
    expect(markDelayedReviewPass(d7, 'course', now + 8 * DAY_MS, 'd7')).toBe(d7);
    expect(markDelayedReviewFail(d7, 'course', now + 8 * DAY_MS, 'd7')).toBe(d7);
    expect(d7.stars).toEqual(original.stars);
    expect(d7.passedKnowledgePoints).toEqual(original.passedKnowledgePoints);
  });

  it('does not let an explicit due label bypass its date or malformed legacy schedule', () => {
    for (const due of [0, NaN, Infinity, now + DAY_MS]) {
      const p: ProgressData = { ...started(), mastery: { course: { status: 'review_due', delayedReviewCount: 0, lastAttemptAt: now, nextReviewAt: due } } };
      expect(markDelayedReviewPass(p, 'course', now, 'd1')).toBe(p);
      expect(markDelayedReviewFail(p, 'course', now, 'd1')).toBe(p);
    }
    const p = started();
    expect(markDelayedReviewPass(p, 'course', NaN, 'd1')).toBe(p);
  });
});
