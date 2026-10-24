import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ChoiceGame from '@/components/games/ChoiceGame';
import DragAssembleGame from '@/components/games/DragAssembleGame';
import DragMatchGame from '@/components/games/DragMatchGame';
import FillBlankGame from '@/components/games/FillBlankGame';
import TimelineGame from '@/components/games/TimelineGame';
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

const orderingQuestion: Question = {
  id: 'ordering-retry-feedback',
  type: 'drag-assemble',
  prompt: '按正确顺序排列。',
  correctAnswer: ['first', 'second'],
  explanation: '按步骤依次完成。',
  points: 10,
  dragItems: [
    { id: 'first', label: '第一步' },
    { id: 'second', label: '第二步' },
  ],
};

const matchingQuestion: Question = {
  id: 'matching-retry-focus',
  type: 'drag-match',
  prompt: '把数字配到对应分类。',
  options: ['奇数', '偶数'],
  correctAnswer: '1→奇数',
  explanation: '1 是奇数。',
  points: 10,
  dragItems: [{ id: 'one', label: '数字 1', target: '奇数' }],
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

    const input = screen.getByPlaceholderText('在此输入你的答案');
    const submit = screen.getByRole('button', { name: '确认' });
    fireEvent.change(input, { target: { value: '6' } });
    submit.focus();
    fireEvent.click(submit);

    expect(screen.getByRole('status')).toHaveTextContent('再想想');
    expect(input).toHaveFocus();
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

  it.each([
    ['drag-assemble', DragAssembleGame],
    ['timeline', TimelineGame],
  ])('moves focus to a sort control after a %s retry prompt', (_, Game) => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const onAnswer = vi.fn();
    render(<Game question={orderingQuestion} onAnswer={onAnswer} />);

    const submit = screen.getByRole('button', { name: '确认' });
    submit.focus();
    fireEvent.click(submit);

    expect(screen.getByRole('status')).toHaveTextContent('还差一点');
    expect(screen.getAllByRole('button', { name: '下移' })[0]).toHaveFocus();
    expect(onAnswer).not.toHaveBeenCalled();
    random.mockRestore();
  });

  it('returns focus to a match item after a wrong target', () => {
    const onAnswer = vi.fn();
    render(<DragMatchGame question={matchingQuestion} onAnswer={onAnswer} />);

    fireEvent.click(screen.getByRole('button', { name: '数字 1' }));
    const wrongTarget = screen.getByRole('button', { name: '偶数' });
    wrongTarget.focus();
    fireEvent.click(wrongTarget);

    expect(screen.getByRole('button', { name: '数字 1' })).toHaveFocus();
    expect(onAnswer).not.toHaveBeenCalled();
  });
});
