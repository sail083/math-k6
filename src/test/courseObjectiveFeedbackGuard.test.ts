import { describe, expect, it } from 'vitest';
import { getAllKnowledgePoints, loadKnowledgePointDetail } from '@/lib/content';

describe('math objective and feedback guard', () => {
  it('requires explicit objectives and actionable feedback for every course', async () => {
    for (const kp of getAllKnowledgePoints()) {
      expect(kp.meta.objectives.length, kp.meta.id).toBeGreaterThanOrEqual(2);
      expect(kp.meta.objectives.every((x) => x.trim().length >= 6), kp.meta.id).toBe(true);
      const game = (await loadKnowledgePointDetail(kp.meta.id))!.game!;
      expect(game.questions.every((q) => q.explanation.trim().length >= 8), kp.meta.id).toBe(true);
      expect(game.reviewSets?.d1?.questions.every((q) => q.explanation.trim().length >= 6), `${kp.meta.id}:d1`).toBe(true);
      expect(game.reviewSets?.d7?.questions.every((q) => q.explanation.trim().length >= 6), `${kp.meta.id}:d7`).toBe(true);
    }
  });
});
