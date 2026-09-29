import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { GameConfig } from '@/lib/types';
import GameRunner from '@/components/GameRunner';

const progressMocks = {
  markInitialPass: vi.fn(),
  markDelayedReviewPass: vi.fn(),
  markDelayedReviewFail: vi.fn(),
  recordSkillEvidence: vi.fn(),
};

vi.mock('@/context/ProgressContext', () => ({
  useProgress: () => progressMocks,
}));

const game: GameConfig = {
  knowledgePointId: 'true-false-retry',
  passThreshold: 0.8,
  questions: [{
    id: 'judge',
    type: 'true-false',
    prompt: '1 + 1 = 2。',
    correctAnswer: '对',
    explanation: '1 加 1 等于 2。',
    points: 10,
    primarySkillId: 'number.addition',
    evidenceType: 'transfer',
  }],
};

describe('TrueFalseGame retry evidence', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps the first wrong judgment unsubmitted and records a correction as non-first-try', () => {
    render(<GameRunner game={game} knowledgePointId={game.knowledgePointId} />);

    fireEvent.click(screen.getByRole('button', { name: /错/ }));
    expect(screen.getByText('再想想')).toBeInTheDocument();
    expect(progressMocks.recordSkillEvidence).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /对/ }));
    expect(progressMocks.recordSkillEvidence).toHaveBeenCalledWith(
      'number.addition', true, false, 'transfer', 'initial',
    );
  });
});
