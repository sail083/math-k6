import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { Question } from '@/lib/types';
import ChoiceGame from '@/components/games/ChoiceGame';
import FillBlankGame from '@/components/games/FillBlankGame';
import TrueFalseGame from '@/components/games/TrueFalseGame';
import DragMatchGame from '@/components/games/DragMatchGame';
import DragAssembleGame from '@/components/games/DragAssembleGame';
import TimelineGame from '@/components/games/TimelineGame';
import TimedChallengeGame from '@/components/games/TimedChallengeGame';

const choice: Question = { id: 'choice-result', type: 'choice', prompt: '选择', options: ['对', '错'], correctAnswer: '对', explanation: '解析', points: 10 };
const fillBlank: Question = { id: 'fill-result', type: 'fill-blank', prompt: '填空', correctAnswer: '7', explanation: '解析', points: 10 };
const trueFalse: Question = { id: 'true-false-result', type: 'true-false', prompt: '判断', correctAnswer: '对', explanation: '解析', points: 10 };
const ordered: Question = { id: 'ordered-result', type: 'drag-assemble', prompt: '排序', correctAnswer: ['only'], explanation: '解析', points: 10, dragItems: [{ id: 'only', label: '唯一一步' }] };
const timeline: Question = { ...ordered, id: 'timeline-result', type: 'timeline' };
const match: Question = { id: 'match-result', type: 'drag-match', prompt: '配对', options: ['目标'], correctAnswer: '项目→目标', explanation: '解析', points: 10, dragItems: [{ id: 'item', label: '项目', target: '目标' }] };
const timed: Question = { id: 'timed-result', type: 'timed-challenge', prompt: '限时', options: ['对', '错'], correctAnswer: '对', explanation: '解析', points: 10 };
const timedOut: Question = { ...timed, id: 'timed-out-result', timeLimit: 1, timing: { reviewStatus: 'approved' } };

describe('game result announcements', () => {
  it('announces final results for every game type', () => {
    const onAnswer = vi.fn();
    const scenarios = [
      { view: <ChoiceGame question={choice} onAnswer={onAnswer} />, answer: () => fireEvent.click(screen.getByRole('button', { name: 'A对' })), text: '回答正确！' },
      { view: <FillBlankGame question={fillBlank} onAnswer={onAnswer} />, answer: () => { fireEvent.change(screen.getByPlaceholderText('在此输入你的答案'), { target: { value: '7' } }); fireEvent.click(screen.getByRole('button', { name: '确认' })); }, text: '回答正确！' },
      { view: <TrueFalseGame question={trueFalse} onAnswer={onAnswer} />, answer: () => fireEvent.click(screen.getByRole('button', { name: /对/ })), text: '回答正确！' },
      { view: <DragMatchGame question={match} onAnswer={onAnswer} />, answer: () => { fireEvent.click(screen.getByRole('button', { name: '项目' })); fireEvent.click(screen.getByRole('button', { name: '目标' })); }, text: '全部匹配正确！' },
      { view: <DragAssembleGame question={ordered} onAnswer={onAnswer} />, answer: () => fireEvent.click(screen.getByRole('button', { name: '确认' })), text: '排列正确！' },
      { view: <TimelineGame question={timeline} onAnswer={onAnswer} />, answer: () => fireEvent.click(screen.getByRole('button', { name: '确认' })), text: '排序正确！' },
      { view: <TimedChallengeGame question={timed} onAnswer={onAnswer} />, answer: () => fireEvent.click(screen.getByRole('button', { name: 'A对' })), text: '回答正确！' },
    ];

    for (const scenario of scenarios) {
      const { unmount } = render(scenario.view);
      scenario.answer();
      expect(screen.getByRole('status')).toHaveTextContent(scenario.text);
      unmount();
    }
  });

  it('announces a timed-out result', () => {
    vi.useFakeTimers();
    render(<TimedChallengeGame question={timedOut} onAnswer={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '开始 1 秒练习' }));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('status')).toHaveTextContent('时间到！');
    vi.useRealTimers();
  });
});
