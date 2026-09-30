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

vi.mock('@/context/ProgressContext', () => ({ useProgress: () => progressMocks }));

const game: GameConfig = {
  knowledgePointId: 'timed-keyboard',
  passThreshold: 0.8,
  questions: [{
    id: 'timed-question',
    type: 'timed-challenge',
    prompt: '23 × 4 = ?',
    options: ['82', '92', '86', '96'],
    correctAnswer: '92',
    explanation: '23 × 4 = 92。',
    points: 10,
    timeLimit: 15,
    primarySkillId: 'mult.one-digit',
    evidenceType: 'transfer',
  }],
};

describe('TimedChallengeGame keyboard answers', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(['b', '2'])('submits %s once and preserves first-try evidence', (key) => {
    render(<GameRunner game={game} knowledgePointId={game.knowledgePointId} />);

    fireEvent.keyDown(window, { key });
    fireEvent.keyDown(window, { key: '2' });

    expect(screen.getByText('回答正确！')).toBeInTheDocument();
    expect(progressMocks.recordSkillEvidence).toHaveBeenCalledTimes(1);
    expect(progressMocks.recordSkillEvidence).toHaveBeenCalledWith(
      'mult.one-digit', true, true, 'transfer', 'initial',
    );
  });
});
