import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ChoiceGame from '@/components/games/ChoiceGame';
import FillBlankGame from '@/components/games/FillBlankGame';
import TrueFalseGame from '@/components/games/TrueFalseGame';
import type { Question } from '@/lib/types';

const choiceQuestion: Question = {
  id: 'choice-retry-feedback',
  type: 'choice',
  prompt: '2 + 2 等于多少？',
  options: ['4', '5'],
  correctAnswer: '4',
  explanation: '2 加 2 等于 4。',
  points: 10,
};

const fillBlankQuestion: Question = {
  id: 'fill-retry-feedback',
  type: 'fill-blank',
  prompt: '3 + 4 = ___',
  correctAnswer: '7',
  explanation: '3 加 4 等于 7。',
  points: 10,
};

const trueFalseQuestion: Question = {
  id: 'true-false-retry-feedback',
  type: 'true-false',
  prompt: '1 + 1 = 2。',
  correctAnswer: '对',
  explanation: '1 加 1 等于 2。',
  points: 10,
};

describe('first-error retry feedback', () => {
  it('announces choice retry guidance without submitting an answer', () => {
    const onAnswer = vi.fn();
    render(<ChoiceGame question={choiceQuestion} onAnswer={onAnswer} />);

    const wrongChoice = screen.getByRole('button', { name: 'B5' });
    wrongChoice.focus();
    fireEvent.click(wrongChoice);

    expect(screen.getByRole('status')).toHaveTextContent('再想想');
    expect(screen.getByRole('button', { name: 'A4' })).toHaveFocus();
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('announces fill-blank retry guidance without submitting an answer', () => {
    const onAnswer = vi.fn();
    render(<FillBlankGame question={fillBlankQuestion} onAnswer={onAnswer} />);

    fireEvent.change(screen.getByPlaceholderText('在此输入你的答案'), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: '确认' }));

    expect(screen.getByRole('status')).toHaveTextContent('再想想');
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('announces true-false retry guidance without submitting an answer', () => {
    const onAnswer = vi.fn();
    render(<TrueFalseGame question={trueFalseQuestion} onAnswer={onAnswer} />);

    const wrongJudgement = screen.getByRole('button', { name: /错/ });
    wrongJudgement.focus();
    fireEvent.click(wrongJudgement);

    expect(screen.getByRole('status')).toHaveTextContent('再想想');
    expect(screen.getByRole('button', { name: /对/ })).toHaveFocus();
    expect(onAnswer).not.toHaveBeenCalled();
  });
});
