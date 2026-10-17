import { describe, expect, it } from 'vitest';
import { canUseTimedPractice, isValidTimeLimit, validateTimedQuestion } from '@/lib/timedChallengeQuality';
import { getAllKnowledgePoints, loadKnowledgePointDetail } from '@/lib/content';
import type { Question } from '@/lib/types';
import { approvedTimedQuestion as question } from './fixtures/timedQuestion';

const modules = import.meta.glob('/src/content/**/*.json', { eager: true, import: 'default' });
interface InventoryEntry { file: string; location: string; question: Question; grade: number | undefined }
function inventory(): InventoryEntry[] {
  const entries: InventoryEntry[] = [];
  for (const [file, value] of Object.entries(modules)) {
    const courseDirectory = file.match(/^(.*\/knowledge-points\/[^/]+)\//)?.[1];
    const meta = courseDirectory ? modules[`${courseDirectory}/meta.json`] as { grade?: number } | undefined : undefined;
    const walk = (node: unknown, location: string) => {
      if (!node || typeof node !== 'object') return;
      if (!Array.isArray(node) && (node as { type?: string }).type === 'timed-challenge') {
        entries.push({ file, location, question: node as Question, grade: meta?.grade });
      }
      for (const [key, child] of Object.entries(node)) walk(child, `${location}/${key}`);
    };
    walk(value, '');
  }
  return entries.sort((a, b) => `${a.file}${a.location}`.localeCompare(`${b.file}${b.location}`));
}
function legacyContent(q: Question) {
  const { prompt, options, correctAnswer, explanation, timeLimit, points } = q;
  return { prompt, options, correctAnswer, explanation, timeLimit, points };
}

describe('timed question admission gate', () => {
  it('validates every timed object, including reviews and nested alternate forms, in the complete JSON content tree', () => {
    for (const entry of inventory()) {
      expect(validateTimedQuestion(entry.question, entry.grade), `${entry.file}#${entry.location}`).toEqual([]);
    }
  });

  it('quarantines the exact existing pending item; new or changed unreviewed timed content fails admission', () => {
    const pending = inventory().filter((entry) => entry.question.timing?.reviewStatus !== 'approved');
    expect(pending.map((entry) => ({
      file: entry.file, location: entry.location, id: entry.question.id, content: legacyContent(entry.question),
    }))).toEqual([{
      file: '/src/content/knowledge-points/g3-mult-1digit/game.json', location: '/questions/5',
      id: 'q-timed-challenge-1', content: {
        prompt: '23 × 4 = ?', options: ['82', '92', '86', '96'], correctAnswer: '92',
        explanation: '23 × 4：个位 3 × 4 = 12，写 2 进 1；十位 2 × 4 = 8，加进位 1 = 9。所以 23 × 4 = 92。',
        timeLimit: 15, points: 10,
      },
    }]);
    for (const entry of pending) expect(canUseTimedPractice(entry.question)).toBe(false);
  });

  it('retains independent untimed constructed-response mastery evidence in every course that contains timed items', async () => {
    for (const kp of getAllKnowledgePoints()) {
      const game = (await loadKnowledgePointDetail(kp.meta.id))?.game;
      for (const questions of [game?.questions, game?.reviewSets?.d1?.questions, game?.reviewSets?.d7?.questions]) {
        if (!questions?.some((q) => q.type === 'timed-challenge')) continue;
        expect(questions.some((q) => !['timed-challenge', 'choice', 'true-false'].includes(q.type)), kp.meta.id).toBe(true);
      }
    }
  });

  it('checks the current item arithmetic and carry explanation independently of the answer key', () => {
    const q = inventory().find((entry) => entry.question.id === 'q-timed-challenge-1')!.question;
    expect(Number(q.correctAnswer)).toBe(23 * 4);
    expect(q.explanation).toContain('3 × 4 = 12');
    expect(q.explanation).toContain('进 1');
    expect(q.explanation).toContain('8，加进位 1 = 9');
    expect(q.timeLimit).toBe(15); // Preserve the historic candidate, not an approved teaching threshold.
    expect(q.timing?.reviewStatus).toBe('pending');
  });

  it.each([undefined, null, 0, -1, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER, '15'])('rejects unsafe or implicit timeLimit=%s', (value) => {
    const q = { ...question, timeLimit: value as number };
    expect(isValidTimeLimit(value)).toBe(false);
    expect(validateTimedQuestion(q, 3).some((message) => message.startsWith('timeLimit:'))).toBe(true);
    expect(canUseTimedPractice(q)).toBe(false);
  });

  it.each([1, 15, 30, 60])('accepts structurally valid %i seconds without claiming it suits a pupil', (timeLimit) => {
    const q = { ...question, timeLimit };
    expect(validateTimedQuestion(q, 3)).toEqual([]);
    expect(canUseTimedPractice(q)).toBe(true);
  });

  it.each([
    ['options absent', { options: undefined }],
    ['only one option', { options: ['92'] }],
    ['too many options', { options: ['82', '92', '86', '96', '98'] }],
    ['duplicate options', { options: ['92', '92'] }],
    ['whitespace duplicate', { options: ['92', ' 92 '] }],
    ['blank option', { options: ['92', ' '] }],
    ['missing answer', { correctAnswer: '' }],
    ['answer not offered', { correctAnswer: '99' }],
    ['ambiguous answer array', { correctAnswer: ['92', '96'] }],
  ] as [string, Partial<Question>][])('blocks %s and never starts an unsafe timer', (_, overrides) => {
    const q = { ...question, ...overrides };
    expect(validateTimedQuestion(q, 3).length).toBeGreaterThan(0);
    expect(canUseTimedPractice(q)).toBe(false);
  });

  it.each([
    ['id', { id: '' }], ['prompt', { prompt: ' ' }], ['explanation', { explanation: '' }],
    ['negative points', { points: -1 }], ['NaN points', { points: NaN }],
    ['unmapped timing', { timing: undefined }],
    ['empty rationale', { timing: { ...question.timing!, rationale: '' } }],
    ['review absent', { timing: { ...question.timing!, review: undefined } }],
    ['reviewer absent', { timing: { ...question.timing!, review: { ...question.timing!.review!, reviewer: '' } } }],
    ['invalid date', { timing: { ...question.timing!, review: { ...question.timing!.review!, reviewedAt: '2026-02-30' } } }],
    ['evidence absent', { timing: { ...question.timing!, review: { ...question.timing!.review!, evidence: '' } } }],
  ] as [string, Partial<Question>][])('rejects incomplete admission metadata: %s', (_, overrides) => {
    expect(validateTimedQuestion({ ...question, ...overrides }, 3).length).toBeGreaterThan(0);
  });

  it.each([undefined, 0, 7, 3.5])('requires a real grade context: %s', (grade) => {
    expect(validateTimedQuestion(question, grade).some((message) => message.startsWith('grade:'))).toBe(true);
  });

  it('blocks an approved hard timer for reasoning and requires an untimed route', () => {
    const q: Question = { ...question, timing: { ...question.timing!, goal: 'reasoning' } };
    expect(validateTimedQuestion(q, 5)).toContain('timing: reasoning must remain untimed');
    expect(canUseTimedPractice(q)).toBe(false);
  });

  it.each(['conceptual', 'transfer', 'retention'] as const)('does not certify %s with a timed single choice', (evidenceType) => {
    const q = { ...question, evidenceType };
    expect(validateTimedQuestion(q, 3).some((message) => message.startsWith('evidenceType:'))).toBe(true);
    expect(canUseTimedPractice(q)).toBe(false);
  });
});
