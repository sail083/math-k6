import { describe, expect, it } from 'vitest';
import { loadKnowledgePointDetail } from '@/lib/content';

describe('fraction evidence coverage readiness', () => {
  it('keeps the add-sub A/B and delayed review sets structurally ready', async () => {
    const game = (await loadKnowledgePointDetail('g3-fraction-add-sub'))!.game!;
    expect(game.evidenceVersion).toBe('fraction-add-sub-2026-09-11-v1');
    expect(game.questions).toHaveLength(6);
    expect(game.alternateQuestions).toHaveLength(6);
    expect(game.reviewSets?.d1?.questions ?? []).toHaveLength(2);
    expect(game.reviewSets?.d1?.alternateQuestions ?? []).toHaveLength(2);
    expect(game.reviewSets?.d7?.questions ?? []).toHaveLength(2);
    expect(game.reviewSets?.d7?.alternateQuestions ?? []).toHaveLength(2);
    const ids = new Set(game.questions.map((q) => q.id));
    expect(game.alternateQuestions!.every((q) => !ids.has(q.id))).toBe(true);
  });
});
