import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { GameConfig } from '@/lib/types';
import GameRunner from '@/components/GameRunner';

vi.mock('@/context/ProgressContext', () => ({
  useProgress: () => ({
    markInitialPass: vi.fn(),
    markDelayedReviewPass: vi.fn(),
    markDelayedReviewFail: vi.fn(),
    recordSkillEvidence: vi.fn(),
  }),
}));

const game: GameConfig = {
  knowledgePointId: 'restart-check',
  passThreshold: 0.8,
  questions: [
    { id: 'judge', type: 'true-false', prompt: '1 + 1 = 2', correctAnswer: '对', explanation: '1 加 1 等于 2。', points: 10 },
    { id: 'transfer', type: 'fill-blank', prompt: '3 + 4 = ___', correctAnswer: '7', explanation: '3 加 4 等于 7。', points: 10 },
  ],
};

describe('GameRunner restart', () => {
  it('resets a true-false question so a learner can complete the next attempt', () => {
    render(<GameRunner game={game} knowledgePointId={game.knowledgePointId} />);

    fireEvent.click(screen.getByRole('button', { name: /错/ }));
    fireEvent.click(screen.getByRole('button', { name: '下一题' }));
    fireEvent.change(screen.getByPlaceholderText('在此输入你的答案'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    fireEvent.click(screen.getByRole('button', { name: '查看结果' }));

    fireEvent.click(screen.getByRole('button', { name: '再试一次' }));
    const trueButton = screen.getByRole('button', { name: /对/ });
    expect(trueButton).toBeEnabled();
    fireEvent.click(trueButton);
    fireEvent.click(screen.getByRole('button', { name: '下一题' }));
    fireEvent.change(screen.getByPlaceholderText('在此输入你的答案'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    fireEvent.click(screen.getByRole('button', { name: '查看结果' }));

    expect(screen.getByText('本次通过')).toBeInTheDocument();
  });
});
