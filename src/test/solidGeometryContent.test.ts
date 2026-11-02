import { describe, expect, it } from 'vitest';
import { getKnowledgePointById, loadKnowledgePointDetail } from '@/lib/content';
describe('g6 solid geometry reasoning', () => {
  it('has complete prerequisites', () => { const kp=getKnowledgePointById('g6-solid-geometry-reasoning')!; expect(kp.meta.prerequisites.every((id)=>getKnowledgePointById(id))).toBe(true); });
  it('keeps answers unique', async () => { const g=(await loadKnowledgePointDetail('g6-solid-geometry-reasoning'))!.game!; expect(g.questions).toHaveLength(6); expect(g.questions[3].options!.filter((x)=>x===g.questions[3].correctAnswer)).toHaveLength(1); expect(g.questions[1].correctAnswer).toBe('10'); });
});
