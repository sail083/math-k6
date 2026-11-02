import { describe, expect, it } from 'vitest';
import { getKnowledgePointById, loadKnowledgePointDetail } from '@/lib/content';
import { buildDiscoveryContent } from '@/lib/learningContent';

const courseId = 'g6-fraction-strategy';

function value(text: string): number {
  const [numerator, denominator = 1] = text.split('/').map(Number);
  return numerator / denominator;
}

describe('fraction strategy: changing the reference whole', () => {
  it('uses the multiplication model and only requires the arithmetic actually used', async () => {
    const course = (await loadKnowledgePointDetail(courseId))!;
    expect(course.meta.vizType).toBe('fraction-product');
    expect(course.meta.prerequisites).toEqual(['g6-fraction-mult', 'g6-fraction-div']);
    for (const id of course.meta.prerequisites) {
      expect(getKnowledgePointById(id), id).toBeDefined();
    }
    const discovery = buildDiscoveryContent(course.meta, course.explanation);
    expect(discovery.check?.correctAnswer).toBe('1/2，因为2/3×3/4。');
    expect(discovery.check?.prompt).toContain('剩余路程的1/4');
  });

  it('offers one answer per choice throughout fresh, retry, D1 and D7 assessments', async () => {
    const game = (await loadKnowledgePointDetail(courseId))!.game!;
    const sets = [
      game.questions, game.alternateQuestions!,
      game.reviewSets!.d1!.questions, game.reviewSets!.d1!.alternateQuestions!,
      game.reviewSets!.d7!.questions, game.reviewSets!.d7!.alternateQuestions!,
    ];
    expect(sets.map(set => set.length)).toEqual([6, 6, 2, 2, 2, 2]);
    const questions = sets.flat();
    expect(new Set(questions.map(q => q.id)).size).toBe(questions.length);
    for (const question of questions) {
      if (question.type !== 'choice') continue;
      expect(question.options?.filter(option => option === question.correctAnswer), question.id).toHaveLength(1);
      expect(new Set(question.options).size, question.id).toBe(question.options?.length);
    }
    for (let i = 0; i < sets.length; i += 2) {
      const prompts = new Set(sets[i].map(q => q.prompt));
      expect(sets[i + 1].some(q => prompts.has(q.prompt))).toBe(false);
    }
  });

  it('independently calculates the forward, inverse and delayed-transfer answers', async () => {
    const game = (await loadKnowledgePointDetail(courseId))!.game!;
    const questions = [
      ...game.questions, ...game.alternateQuestions!,
      ...game.reviewSets!.d1!.questions, ...game.reviewSets!.d1!.alternateQuestions!,
      ...game.reviewSets!.d7!.questions, ...game.reviewSets!.d7!.alternateQuestions!,
    ];
    const expected: Record<string, number> = {
      q2: 24 / ((1 - 2 / 5) * (1 - 1 / 3)),
      q3: (1 - 1 / 4) * (1 - 2 / 5),
      q5: 2 / 5 + (1 - 2 / 5) * (1 / 3),
      'b-q2': 18 / ((1 - 1 / 4) * (1 - 2 / 3)),
      'b-q3': (1 - 1 / 3) * (1 - 3 / 5),
      'b-q5': 1 / 4 + (1 - 1 / 4) * (2 / 3),
      d1q1: (1 - 1 / 3) * (1 - 1 / 4),
      d1q2: 45 / ((1 - 1 / 3) * (1 - 1 / 4)),
      'd1-b-q1': (1 - 1 / 5) * (1 - 3 / 8),
      'd1-b-q2': 28 / ((1 - 1 / 5) * (1 - 3 / 8)),
      d7q1: (90 * (1 - 1 / 3) - 36) / (90 * (1 - 1 / 3)),
      d7q2: 24 / ((1 - 1 / 4) * (1 - 1 / 3)),
      'd7-b-q1': (80 * (1 - 1 / 4) - 45) / (80 * (1 - 1 / 4)),
      'd7-b-q2': 30 / ((1 - 2 / 5) * (1 - 1 / 6)),
    };
    for (const [id, result] of Object.entries(expected)) {
      const question = questions.find(q => q.id === id)!;
      expect(question, id).toBeDefined();
      expect(value(String(question.correctAnswer)), id).toBeCloseTo(result, 10);
      if (question.options) {
        expect(question.options.filter(option => Math.abs(value(option) - result) < 1e-10), id).toHaveLength(1);
      }
    }
    // Same fraction, different whole: the remaining-amount plan leaves more.
    expect((1 - 2 / 5) * (1 - 1 / 3)).toBeGreaterThan(1 - 2 / 5 - 1 / 3);
    expect(game.questions.find(q => q.id === 'q6')?.correctAnswer).toBe('甲，因为甲第二次用量较少');
    expect((1 - 1 / 2) * (1 - 1 / 5)).toBeCloseTo(2 / 5);
    expect(1 - 1 / 2 - 1 / 5).toBeCloseTo(3 / 10);
    expect(game.alternateQuestions!.find(q => q.id === 'b-q6')?.correctAnswer).toBe('甲剩2/5，乙剩3/10，甲剩得多');
  });
});
