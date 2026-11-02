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
  knowledgePointId: 'drag-match-evidence',
  passThreshold: 0.8,
  questions: [{
    id: 'match',
    type: 'drag-match',
    prompt: '把数字配到对应的奇偶分类。',
    options: ['奇数', '偶数'],
    correctAnswer: '甲→奇数，乙→偶数',
    explanation: '1 是奇数，2 是偶数。',
    points: 10,
    primarySkillId: 'number.parity',
    evidenceType: 'transfer',
    dragItems: [
      { id: 'one', label: '甲', target: '奇数' },
      { id: 'two', label: '乙', target: '偶数' },
    ],
  }],
};

function match(item: string, target: string) {
  fireEvent.click(screen.getByRole('button', { name: item }));
  fireEvent.click(screen.getByRole('button', { name: target }));
}

describe('DragMatchGame evidence', () => {
  beforeEach(() => vi.clearAllMocks());

  it('awards the final correct answer without treating a corrected match as first-try evidence', () => {
    render(<GameRunner game={game} knowledgePointId={game.knowledgePointId} />);

    match('甲', '偶数');
    match('甲', '奇数');
    match('乙', '偶数');

    expect(screen.getByText('匹配完成（过程有错误尝试）')).toBeInTheDocument();
    expect(progressMocks.recordSkillEvidence).toHaveBeenCalledWith(
      'number.parity', true, false, 'transfer', 'initial',
    );

    fireEvent.click(screen.getByRole('button', { name: '查看结果' }));
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('/ 10')).toBeInTheDocument();
    expect(screen.getByText('最后再练一下')).toBeInTheDocument();
  });

  it('keeps a clean first attempt eligible for the normal pass flow', () => {
    render(<GameRunner game={game} knowledgePointId={game.knowledgePointId} />);

    match('甲', '奇数');
    match('乙', '偶数');

    expect(progressMocks.recordSkillEvidence).toHaveBeenCalledWith(
      'number.parity', true, true, 'transfer', 'initial',
    );
    fireEvent.click(screen.getByRole('button', { name: '查看结果' }));
    expect(screen.getByText('本次通过')).toBeInTheDocument();
    expect(progressMocks.markInitialPass).toHaveBeenCalledWith('drag-match-evidence', 3, false);
  });
});
