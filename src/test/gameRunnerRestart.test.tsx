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

function orderingGame(type: 'drag-assemble' | 'timeline', itemCount = 2): GameConfig {
  const dragItems = itemCount === 1
    ? [{ id: 'only', label: '唯一步骤' }]
    : [
        { id: 'first', label: '第一步' },
        { id: 'second', label: '第二步' },
      ];

  return {
    knowledgePointId: `${type}-focus`,
    passThreshold: 0.8,
    questions: [
      { id: 'judge', type: 'true-false', prompt: '1 + 1 = 2', correctAnswer: '对', explanation: '1 加 1 等于 2。', points: 10 },
      {
        id: 'ordering',
        type,
        prompt: '按正确顺序排列。',
        correctAnswer: dragItems.map((item) => item.id),
        explanation: '按步骤依次完成。',
        points: 10,
        dragItems,
      },
    ],
  };
}

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

  it.each(['drag-assemble', 'timeline'] as const)('focuses the first available sort control after advancing to a %s question', (type) => {
    const config = orderingGame(type);
    render(<GameRunner game={config} knowledgePointId={config.knowledgePointId} />);

    fireEvent.click(screen.getByRole('button', { name: /对/ }));
    const next = screen.getByRole('button', { name: '下一题' });
    next.focus();
    fireEvent.click(next);

    expect(screen.getAllByRole('button', { name: '下移' })[0]).toHaveFocus();
  });

  it.each(['drag-assemble', 'timeline'] as const)('focuses confirmation when a %s question has nothing to reorder', (type) => {
    const config = orderingGame(type, 1);
    render(<GameRunner game={config} knowledgePointId={config.knowledgePointId} />);

    fireEvent.click(screen.getByRole('button', { name: /对/ }));
    fireEvent.click(screen.getByRole('button', { name: '下一题' }));

    expect(screen.getByRole('button', { name: '确认' })).toHaveFocus();
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
