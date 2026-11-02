import { describe, expect, it } from 'vitest';
import { getAllKnowledgePoints, loadKnowledgePointDetail } from '@/lib/content';

describe('math self-study scaffold guard', () => {
  it('keeps every course explanation and feedback scaffold usable', async () => {
    for (const kp of getAllKnowledgePoints()) {
      const detail = await loadKnowledgePointDetail(kp.meta.id);
      expect(detail?.explanation.trim().length, kp.meta.id).toBeGreaterThan(40);
      const questions = detail?.game?.questions ?? [];
      expect(questions.every((q) => String(q.explanation ?? '').trim().length >= 8), kp.meta.id).toBe(true);
      expect(detail?.game?.reviewSets?.d1?.questions.length, kp.meta.id).toBeGreaterThan(0);
      expect(detail?.game?.reviewSets?.d7?.questions.length, kp.meta.id).toBeGreaterThan(0);
    }
  });
});
