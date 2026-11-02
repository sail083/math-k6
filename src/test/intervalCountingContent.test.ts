import { describe, expect, it } from 'vitest';
import { getKnowledgePointById, loadKnowledgePointDetail } from '@/lib/content';
describe('g5 interval counting', () => {
  it('has complete prerequisites', () => { const kp=getKnowledgePointById('g5-interval-counting')!; expect(kp.meta.prerequisites.every((id)=>getKnowledgePointById(id))).toBe(true); });
  it('keeps interval and cycle answers unique', async () => { const g=(await loadKnowledgePointDetail('g5-interval-counting'))!.game!; expect(g.questions).toHaveLength(6); expect(g.questions[3].correctAnswer).toBe('绿'); expect(g.questions[0].options!.filter((x)=>x===g.questions[0].correctAnswer)).toHaveLength(1); });
});
