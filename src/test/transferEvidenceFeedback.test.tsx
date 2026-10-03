import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  knowledgePointId: 'transfer-feedback',
  passThreshold: 0.8,
  questions: [{
    id: 'transfer',
    type: 'fill-blank',
    prompt: '请独立计算 6 + 6。',
    correctAnswer: '12',
    explanation: '6 加 6 等于 12。',
    points: 10,
  }],
};

describe('transfer evidence feedback', () => {
  beforeEach(() => vi.clearAllMocks());

  it('explains why a corrected retry does not pass the first-try transfer gate', () => {
    render(<GameRunner game={game} knowledgePointId={game.knowledgePointId} />);

    const input = screen.getByPlaceholderText('在此输入你的答案');
    fireEvent.change(input, { target: { value: '11' } });
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    fireEvent.change(input, { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    fireEvent.click(screen.getByRole('button', { name: '查看结果' }));

    expect(screen.getByText('迁移验证题需要首次独立答对；回看讲解后再试一次。')).toBeInTheDocument();
    expect(screen.getByText('重试后答对 · 本次不计迁移验证')).toBeInTheDocument();
  });
});
