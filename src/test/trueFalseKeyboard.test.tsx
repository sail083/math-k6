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
  knowledgePointId: 'true-false-keyboard',
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

describe('TrueFalseGame keyboard answers', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(['1', 'a'])('submits %s as a first-try true answer once', (key) => {
    render(<GameRunner game={game} knowledgePointId={game.knowledgePointId} />);

    fireEvent.keyDown(window, { key });
    fireEvent.keyDown(window, { key: '1' });

    expect(screen.getByText('回答正确！')).toBeInTheDocument();
    expect(progressMocks.recordSkillEvidence).toHaveBeenCalledTimes(1);
    expect(progressMocks.recordSkillEvidence).toHaveBeenCalledWith(
      'number.addition', true, true, 'transfer', 'initial',
    );
  });

  it.each(['2', 'b'])('keeps %s wrong answer editable and records a keyboard correction once', (key) => {
    render(<GameRunner game={game} knowledgePointId={game.knowledgePointId} />);

    fireEvent.keyDown(window, { key });
    expect(screen.getByText('再想想')).toBeInTheDocument();
    expect(progressMocks.recordSkillEvidence).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'a' });
    expect(progressMocks.recordSkillEvidence).toHaveBeenCalledTimes(1);
    expect(progressMocks.recordSkillEvidence).toHaveBeenCalledWith(
      'number.addition', true, false, 'transfer', 'initial',
    );
  });
});
