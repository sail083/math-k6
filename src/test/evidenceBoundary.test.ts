import { describe, expect, it } from 'vitest';
import { getAllKnowledgePoints, loadKnowledgePointDetail } from '@/lib/content';

describe('math evidence boundary', () => {
  it('does not advertise strict evidence for courses without verified A/B runtime coverage', async () => {
    const enabled: string[] = [];
    for (const kp of getAllKnowledgePoints()) {
      const game = (await loadKnowledgePointDetail(kp.meta.id))!.game!;
      if (game.evidenceVersion) enabled.push(kp.meta.id);
    }
    expect(enabled.sort()).toEqual(['g3-fraction-add-sub', 'g3-fraction-compare', 'g3-fraction-intro']);
  });
});
