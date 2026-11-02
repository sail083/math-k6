import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Question } from '@/lib/types';
import TimedChallengeGame from '@/components/games/TimedChallengeGame';

const question: Question = {
  id: 'timing-review',
  type: 'timed-challenge',
  prompt: '23 × 4 = ?',
  options: ['82', '92'],
  correctAnswer: '92',
  explanation: '23 × 4 = 92。',
  points: 10,
  timeLimit: 1,
};

describe('TimedChallengeGame timing admission', () => {
  it('keeps a pending time limit untimed and answerable', () => {
    vi.useFakeTimers();
    const onAnswer = vi.fn();
    render(<TimedChallengeGame question={{ ...question, timing: { reviewStatus: 'pending' } }} onAnswer={onAnswer} />);

    expect(screen.getByText('不限时练习')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '开始 1 秒练习' })).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(onAnswer).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'B92' }));
    expect(onAnswer).toHaveBeenCalledWith('92', true);
    vi.useRealTimers();
  });

  it('requires an explicit student choice before an approved time limit starts', () => {
    render(<TimedChallengeGame question={{ ...question, timing: { reviewStatus: 'approved' } }} onAnswer={vi.fn()} />);

    expect(screen.getByRole('button', { name: '开始 1 秒练习' })).toHaveFocus();
    expect(screen.queryByText(question.prompt)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '不限时练习' }));
    expect(screen.getByText(question.prompt)).toBeInTheDocument();
  });
});
