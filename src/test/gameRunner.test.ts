import { describe, it, expect } from 'vitest';
import { calculateStars, hasTransferEvidence, masteryThreshold, type AnswerRecord } from '@/components/GameRunner';
import type { GameConfig, Question } from '@/lib/types';

describe('calculateStars', () => {
  it('returns 3 for perfect score (1.0, 0.6)', () => {
    expect(calculateStars(1.0, 0.6)).toBe(3);
  });

  it('returns 2 for 0.9 with 0.6 threshold', () => {
    expect(calculateStars(0.9, 0.6)).toBe(2);
  });

  it('returns 1 for passed but not great (0.8, 0.6)', () => {
    expect(calculateStars(0.8, 0.6)).toBe(1);
  });

  it('returns 0 for failed below threshold (0.5, 0.6)', () => {
    expect(calculateStars(0.5, 0.6)).toBe(0);
  });

  it('returns 0 when failed with high threshold (0.91, 0.95)', () => {
    expect(calculateStars(0.91, 0.95)).toBe(0);
  });

  it('returns 2 when barely passed (0.95, 0.95) — 0.95 >= 0.9 threshold', () => {
    expect(calculateStars(0.95, 0.95)).toBe(2);
  });
});

describe('masteryThreshold', () => {
  it('does not accept a configured threshold below 80%', () => {
    expect(masteryThreshold(0.6)).toBe(0.8);
  });

  it('preserves a stricter configured threshold', () => {
    expect(masteryThreshold(0.9)).toBe(0.9);
  });
});

describe('hasTransferEvidence', () => {
  const game: GameConfig = {
    knowledgePointId: 'test',
    passThreshold: 0.8,
    questions: [
      { id: 'choice', type: 'choice', prompt: '规则？', options: ['A', 'B'], correctAnswer: 'A', explanation: '', points: 10 },
      { id: 'transfer', type: 'fill-blank', prompt: '独立计算', correctAnswer: '12', explanation: '', points: 10 },
    ],
  };

  const rec = (correct: boolean, firstTry = true): AnswerRecord => ({ selected: '', correct, firstTry });

  it('rejects a high score without an independently correct transfer answer', () => {
    expect(hasTransferEvidence(game, { choice: rec(true), transfer: rec(false) })).toBe(false);
  });

  it('accepts evidence when the non-choice transfer answer is correct and first-try', () => {
    expect(hasTransferEvidence(game, { choice: rec(true), transfer: rec(true) })).toBe(true);
  });

  it('rejects a transfer answer that was correct only on retry (not first-try)', () => {
    expect(hasTransferEvidence(game, { choice: rec(true), transfer: rec(true, false) })).toBe(false);
  });
});

describe('hasTransferEvidence with review question set', () => {
  const game: GameConfig = {
    knowledgePointId: 'test',
    passThreshold: 0.8,
    questions: [
      { id: 'original-choice', type: 'choice', prompt: '规则？', options: ['A', 'B'], correctAnswer: 'A', explanation: '', points: 10 },
      { id: 'original-fill', type: 'fill-blank', prompt: '独立计算', correctAnswer: '42', explanation: '', points: 10 },
    ],
  };

  const reviewQuestions: Question[] = [
    { id: 'd1-choice', type: 'choice', prompt: '规则？', options: ['A', 'B'], correctAnswer: 'A', explanation: '', points: 10 },
    { id: 'd1-fill', type: 'fill-blank', prompt: '独立计算', correctAnswer: '12', explanation: '', points: 10 },
  ];

  const rec = (correct: boolean, firstTry = true): AnswerRecord => ({ selected: '', correct, firstTry });

  it('passes when every non-choice review question is correct on first try', () => {
    expect(hasTransferEvidence(game, {
      'd1-choice': rec(true),
      'd1-fill': rec(true, true),
    }, reviewQuestions)).toBe(true);
  });

  it('fails when a non-choice review question was correct only on retry', () => {
    expect(hasTransferEvidence(game, {
      'd1-choice': rec(true),
      'd1-fill': rec(true, false),
    }, reviewQuestions)).toBe(false);
  });

  it('fails when a non-choice review question was answered incorrectly', () => {
    expect(hasTransferEvidence(game, {
      'd1-choice': rec(true),
      'd1-fill': rec(false, false),
    }, reviewQuestions)).toBe(false);
  });

  it('ignores choice questions in the transfer check', () => {
    // Choice question wrong but fill-blank correct on first try → passes
    expect(hasTransferEvidence(game, {
      'd1-choice': rec(false, false),
      'd1-fill': rec(true, true),
    }, reviewQuestions)).toBe(true);
  });
});

describe('frozen review mode (defect A regression)', () => {
  // This is a pure-logic regression test. The frozen review mode is a
  // render-time concern (useRef), but we can verify the pure helper
  // getReviewMode returns null once mastery changes — proving that
  // without freezing, the review identity would be lost.
  it('getReviewMode returns null after mastery is updated to provisional (post-D1-pass)', async () => {
    const { getReviewMode, markInitialPass, markDelayedReviewPass } = await import('@/lib/progress');
    const NOW = 1_700_000_000_000;
    const DAY = 86_400_000;
    let p = markInitialPass({ passedKnowledgePoints: [], stars: {} }, 'kp1', 2, NOW, true);
    // Before D1: review_due at NOW+DAY
    expect(getReviewMode(p, 'kp1', NOW + DAY)).toBe('d1');
    // Simulate D1 pass — mastery becomes provisional with count=1
    p = markDelayedReviewPass(p, 'kp1', NOW + DAY);
    // Now getReviewMode returns null (no longer review_due)
    expect(getReviewMode(p, 'kp1', NOW + DAY)).toBeNull();
    // This proves why the frozen ref is necessary: without it, the
    // GameRunner would see reviewMode=null mid-result and swap questions.
  });
});
