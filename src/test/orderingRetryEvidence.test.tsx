import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { GameConfig, Question } from '@/lib/types';
import GameRunner from '@/components/GameRunner';

vi.mock('@/components/games/shared', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/components/games/shared')>(),
  shuffleArray: <T,>(items: T[]) => [...items],
}));

const progressMocks = {
  markInitialPass: vi.fn(),
  markDelayedReviewPass: vi.fn(),
  markDelayedReviewFail: vi.fn(),
  recordSkillEvidence: vi.fn(),
};

vi.mock('@/context/ProgressContext', () => ({
  useProgress: () => progressMocks,
}));

function game(type: Question['type']): GameConfig {
  return {
    knowledgePointId: `ordering-${type}`,
    passThreshold: 0.8,
    questions: [{
      id: 'ordering',
      type,
      prompt: '按正确顺序排列。',
      correctAnswer: ['first', 'second'],
      explanation: '先完成第一步，再完成第二步。',
      points: 10,
      primarySkillId: 'ordering.skill',
      evidenceType: 'transfer',
      dragItems: [
        { id: 'second', label: '第二步' },
        { id: 'first', label: '第一步' },
      ],
    }],
  };
}

describe.each(['drag-assemble', 'timeline'] as const)('%s retry evidence', (type) => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps the first wrong order editable and records a corrected order as non-first-try', () => {
    const config = game(type);
    render(<GameRunner game={config} knowledgePointId={config.knowledgePointId} />);

    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    expect(screen.getByText('还差一点，再调整后确认一次。')).toBeInTheDocument();
    expect(progressMocks.recordSkillEvidence).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button', { name: '下移' })[0]);
    fireEvent.click(screen.getByRole('button', { name: '确认' }));

    expect(progressMocks.recordSkillEvidence).toHaveBeenCalledWith(
      'ordering.skill', true, false, 'transfer', 'initial',
    );
  });

  it('records a second wrong order as the final failed attempt', () => {
    const config = game(type);
    render(<GameRunner game={config} knowledgePointId={config.knowledgePointId} />);

    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    fireEvent.click(screen.getByRole('button', { name: '确认' }));

    expect(screen.getByText('正确顺序：第一步 → 第二步')).toBeInTheDocument();
    expect(progressMocks.recordSkillEvidence).toHaveBeenCalledWith(
      'ordering.skill', false, false, 'transfer', 'initial',
    );
  });
});
