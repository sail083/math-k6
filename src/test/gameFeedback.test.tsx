import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ChoiceGame from '@/components/games/ChoiceGame';
import FillBlankGame from '@/components/games/FillBlankGame';

describe('错误反馈与重试', () => {
  it('选择题第一次答错先显示本题解析，重试成功不标记为首次作答', () => {
    const onAttempt = vi.fn();
    const onAnswer = vi.fn();
    render(<ChoiceGame question={{ id: 'choice-feedback', type: 'choice', prompt: '哪一个？', options: ['错', '对'], correctAnswer: '对', explanation: '先看题目中的单位。', points: 10 }} onAttempt={onAttempt} onAnswer={onAnswer} />);

    fireEvent.click(screen.getByRole('button', { name: /A\s*错/ }));
    expect(screen.getByText('解析：先看题目中的单位。')).toBeVisible();
    expect(onAttempt).toHaveBeenCalledTimes(1);
    expect(onAnswer).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /B\s*对/ }));
    expect(onAnswer).toHaveBeenCalledWith('对', true, false);
  });

  it('填空题第一次答错先显示解析，第二次提交可接受答案时展示或连接', () => {
    const onAnswer = vi.fn();
    render(<FillBlankGame question={{ id: 'fill-feedback', type: 'fill-blank', prompt: '填空', correctAnswer: ['1/2', '0.5'], explanation: '两种写法表示同一个量。', points: 10 }} onAnswer={onAnswer} />);

    fireEvent.change(screen.getByPlaceholderText('在此输入你的答案'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    expect(screen.getByText('解析：两种写法表示同一个量。')).toBeVisible();
    expect(onAnswer).not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText('在此输入你的答案'), { target: { value: '0.5' } });
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    expect(onAnswer).toHaveBeenCalledWith('0.5', true, false);
  });
});
