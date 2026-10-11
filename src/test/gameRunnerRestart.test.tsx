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

const dragMatchGame: GameConfig = {
  knowledgePointId: 'drag-match-focus',
  passThreshold: 0.8,
  questions: [
    { id: 'judge', type: 'true-false', prompt: '1 + 1 = 2', correctAnswer: '对', explanation: '1 加 1 等于 2。', points: 10 },
    {
      id: 'match',
      type: 'drag-match',
      prompt: '把数字配到对应分类。',
      correctAnswer: '1→奇数',
      explanation: '1 是奇数。',
      points: 10,
      dragItems: [{ id: 'one', label: '数字 1', target: '奇数' }],
    },
  ],
};

describe('GameRunner restart', () => {
  it('focuses the blank input after advancing from a resolved question', () => {
    render(<GameRunner game={game} knowledgePointId={game.knowledgePointId} />);

    fireEvent.click(screen.getByRole('button', { name: /对/ }));
    const next = screen.getByRole('button', { name: '下一题' });
    next.focus();
    fireEvent.click(next);

    expect(screen.getByPlaceholderText('在此输入你的答案')).toHaveFocus();
  });

  it('focuses the first match item after advancing to a matching question', () => {
    render(<GameRunner game={dragMatchGame} knowledgePointId={dragMatchGame.knowledgePointId} />);

    fireEvent.click(screen.getByRole('button', { name: /对/ }));
    const next = screen.getByRole('button', { name: '下一题' });
    next.focus();
    fireEvent.click(next);

    expect(screen.getByRole('button', { name: '数字 1' })).toHaveFocus();
  });

  it('resets a true-false question after a failed group attempt', () => {
    render(<GameRunner game={game} knowledgePointId={game.knowledgePointId} />);

    fireEvent.click(screen.getByRole('button', { name: /错/ }));
    fireEvent.click(screen.getByRole('button', { name: /对/ }));
    fireEvent.click(screen.getByRole('button', { name: '下一题' }));
    fireEvent.change(screen.getByPlaceholderText('在此输入你的答案'), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    fireEvent.change(screen.getByPlaceholderText('在此输入你的答案'), { target: { value: '6' } });
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
