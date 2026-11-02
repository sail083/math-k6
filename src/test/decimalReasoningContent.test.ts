import { describe, expect, it } from 'vitest';
import { getKnowledgePointById, loadKnowledgePointDetail } from '@/lib/content';

describe('g5 decimal reasoning course', () => {
  it('loads as a base course with a complete prerequisite chain', async () => {
    const kp = getKnowledgePointById('g5-decimal-equation-reasoning');
    expect(kp?.meta.track ?? 'base').toBe('base');
    expect(kp?.meta.prerequisites).toEqual(['g5-decimal-mult', 'g5-decimal-div', 'g5-equation']);
    for (const id of kp!.meta.prerequisites) expect(getKnowledgePointById(id)).toBeDefined();
  });

  it('keeps its worked answers mathematically unique', async () => {
    const game = (await loadKnowledgePointDetail('g5-decimal-equation-reasoning'))!.game!;
    expect(game.questions).toHaveLength(6);
    const q2 = game.questions.find((q) => q.id === 'q2')!;
    expect(q2.correctAnswer).toBe('7.2');
    const q3 = game.questions.find((q) => q.id === 'q3')!;
    expect(q3.options!.filter((x) => Number(x) === 7.2 / 3)).toEqual(['2.4']);
    const q4 = game.questions.find((q) => q.id === 'q4')!;
    expect(q4.options!.filter((x) => x === q4.correctAnswer)).toHaveLength(1);
    expect(game.reviewSets?.d1?.questions ?? []).toHaveLength(2);
    expect(game.reviewSets?.d7?.questions ?? []).toHaveLength(2);
  });
});
