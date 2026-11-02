import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ChoiceGame from '@/components/games/ChoiceGame';

describe('choice keyboard shortcuts', () => {
  it('does not submit or consume an attempt when keyboard focus belongs to another review control', () => {
    const onAnswer = vi.fn(), onAttempt = vi.fn();
    render(<><button>复习下一张</button><ChoiceGame question={{ id: 'focused', type: 'choice', prompt: '有意作答',
      options: ['甲', '乙'], correctAnswer: '甲', explanation: '', points: 10,
    }} onAnswer={onAnswer} onAttempt={onAttempt} /></>);
    const outside = screen.getByRole('button', { name: '复习下一张' });
    outside.focus();
    fireEvent.keyDown(outside, { key: 'a' });
    fireEvent.keyDown(window, { key: '1' });
    expect(onAnswer).not.toHaveBeenCalled();
    expect(onAttempt).not.toHaveBeenCalled();
    screen.getByRole('button', { name: /A\s*甲/ }).focus();
    fireEvent.keyDown(window, { key: 'a' });
    expect(onAnswer).toHaveBeenCalledWith('甲', true, true);
    expect(onAttempt).toHaveBeenCalledTimes(1);
  });
  it('keeps writing and input-method keys out of answers while allowing deliberate shortcuts', () => {
    const onAnswer = vi.fn();
    render(<><textarea aria-label="作品" /><input aria-label="答案草稿" /><div contentEditable suppressContentEditableWarning><span>编辑区</span></div><ChoiceGame question={{
      id: 'keyboard', type: 'choice', prompt: '选择 greeting',
      options: ['Hello', 'Goodbye'], correctAnswer: 'Hello', explanation: 'Hello 是问候。', points: 10,
    }} onAnswer={onAnswer} /></>);
    fireEvent.keyDown(screen.getByLabelText('作品'), { key: 'a' });
    fireEvent.keyDown(screen.getByLabelText('答案草稿'), { key: '1' });
    fireEvent.keyDown(screen.getByText('编辑区'), { key: 'a' });
    fireEvent.keyDown(window, { key: 'a', isComposing: true });
    fireEvent.keyDown(window, { key: 'a', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'a', metaKey: true });
    expect(onAnswer).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'a' });
    expect(onAnswer).toHaveBeenCalledWith('Hello', true, true);
  });
});
