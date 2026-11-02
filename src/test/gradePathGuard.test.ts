import { describe, expect, it } from 'vitest';
import { getAllKnowledgePoints } from '@/lib/content';

describe('math self-study grade path', () => {
  it('never requires a higher-grade prerequisite', () => {
    const byId = new Map(getAllKnowledgePoints().map((kp) => [kp.meta.id, kp.meta]));
    for (const meta of byId.values()) {
      for (const id of meta.prerequisites) {
        const prerequisite = byId.get(id);
        expect(prerequisite, `${meta.id} -> missing ${id}`).toBeDefined();
        expect(prerequisite!.grade, `${meta.id} -> ${id}`).toBeLessThanOrEqual(meta.grade);
      }
    }
  });
});
