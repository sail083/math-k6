import { describe, expect, it } from 'vitest';
import { getKnowledgePointById, loadKnowledgePointDetail } from '@/lib/content';
describe('g6 data probability reasoning', () => {
  it('has complete prerequisites', () => { const kp=getKnowledgePointById('g6-data-probability-reasoning')!; expect(kp.meta.prerequisites.every((id)=>getKnowledgePointById(id))).toBe(true); });
  it('keeps unique answers', async () => { const g=(await loadKnowledgePointDetail('g6-data-probability-reasoning'))!.game!; expect(g.questions).toHaveLength(6); expect(g.questions[0].options!.filter((x)=>x===g.questions[0].correctAnswer)).toHaveLength(1); expect(g.questions[1].correctAnswer).toBe('40%'); });
});
