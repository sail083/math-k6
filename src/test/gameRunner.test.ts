import { describe, it, expect } from 'vitest';
import { calculateStars, hasTransferEvidence, masteryThreshold } from '@/components/GameRunner';
import type { GameConfig } from '@/lib/types';

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

  it('rejects a high score without an independently correct transfer answer', () => {
    expect(hasTransferEvidence(game, { choice: { correct: true }, transfer: { correct: false } })).toBe(false);
  });

  it('accepts evidence when the non-choice transfer answer is correct', () => {
    expect(hasTransferEvidence(game, { choice: { correct: true }, transfer: { correct: true } })).toBe(true);
  });
});
