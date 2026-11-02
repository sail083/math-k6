import { describe, expect, it } from 'vitest';
import { getKnowledgePointById, loadKnowledgePointDetail } from '@/lib/content';
describe('g4 decimal data reasoning', () => {
  it('has valid prerequisites', () => {
    const kp = getKnowledgePointById('g4-decimal-data-reasoning')!;
    expect(kp.meta.prerequisites.every((id) => getKnowledgePointById(id))).toBe(true);
  });
  it('keeps numeric answers unique', async () => {
    const game = (await loadKnowledgePointDetail('g4-decimal-data-reasoning'))!.game!;
    expect(game.questions).toHaveLength(6);
    expect(game.questions[1].correctAnswer).toBe('4.7');
    expect(game.questions[2].options!.filter((x) => x === game.questions[2].correctAnswer)).toHaveLength(1);
  });
});
