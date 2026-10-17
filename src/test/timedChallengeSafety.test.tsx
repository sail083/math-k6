import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TimedChallengeGame from '@/components/games/TimedChallengeGame';
import type { Question } from '@/lib/types';
import { approvedTimedQuestion as question } from './fixtures/timedQuestion';

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

function mount(overrides: Partial<Question> = {}) {
  const onAnswer = vi.fn();
  const view = render(<TimedChallengeGame question={{ ...question, ...overrides }} onAnswer={onAnswer} />);
  return { onAnswer, ...view };
}
function start() { fireEvent.click(screen.getByRole('button', { name: /开始 .* 秒练习/ })); }
function answerCorrect() { fireEvent.click(screen.getByRole('button', { name: 'B92' })); }

describe('timed practice safety', () => {
  it.each([undefined, null, 0, -1, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER, '15'])('does not invent a default or timeout on invalid timeLimit=%s', (value) => {
    const { onAnswer } = mount({ timeLimit: value as number });
    act(() => vi.advanceTimersByTime(60_000));
    expect(onAnswer).not.toHaveBeenCalled();
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(screen.queryByText(/正确答案/)).not.toBeInTheDocument();
    answerCorrect();
    expect(onAnswer).toHaveBeenCalledWith('92', true, true, { outcome: 'answered', timing: 'untimed' });
  });

  it.each([
    undefined,
    { goal: 'fluency', reviewStatus: 'pending', rationale: 'Not calibrated.' },
    { ...question.timing!, goal: 'reasoning' },
    { ...question.timing!, review: undefined },
  ])('keeps unreviewed or reasoning content untimed', (timing) => {
    const { onAnswer } = mount({ timing: timing as Question['timing'] });
    act(() => vi.advanceTimersByTime(60_000));
    expect(onAnswer).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /开始/ })).not.toBeInTheDocument();
    answerCorrect();
    expect(onAnswer).toHaveBeenCalledOnce();
  });

  it('waits for an explicit start and offers an untimed alternative', () => {
    const { onAnswer } = mount();
    act(() => vi.advanceTimersByTime(60_000));
    fireEvent.keyDown(window, { key: '2' });
    expect(onAnswer).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'B92' })).not.toBeInTheDocument();
    expect(screen.queryByText(question.prompt)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '不限时练习' })).toBeEnabled();
    start();
    expect(screen.getByRole('timer')).toHaveTextContent('15s');
    expect(screen.getByRole('button', { name: 'A82' })).toHaveFocus();
    expect(screen.getByRole('group', { name: question.prompt })).toBeInTheDocument();
  });

  it.each(['before', 'during'])('supports choosing untimed practice %s timing starts without penalty', (when) => {
    const { onAnswer } = mount();
    if (when === 'during') { start(); act(() => vi.advanceTimersByTime(14_000)); }
    fireEvent.click(screen.getByRole('button', { name: '不限时练习' }));
    act(() => vi.advanceTimersByTime(60_000));
    expect(onAnswer).not.toHaveBeenCalled();
    answerCorrect();
    expect(onAnswer).toHaveBeenCalledWith('92', true, true, { outcome: 'answered', timing: 'untimed' });
  });

  it('accepts at most one submission in the same render batch under StrictMode', () => {
    const onAnswer = vi.fn();
    render(<StrictMode><TimedChallengeGame question={question} onAnswer={onAnswer} /></StrictMode>);
    start();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
      vi.advanceTimersByTime(20_000);
    });
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith('92', true, true, { outcome: 'answered', timing: 'timed' });
  });

  it('accepts an answer 1 ms before the deadline and never overwrites it with a timeout', () => {
    const { onAnswer } = mount({ timeLimit: 1 }); start();
    act(() => vi.advanceTimersByTime(999));
    answerCorrect();
    act(() => vi.advanceTimersByTime(10_000));
    expect(onAnswer).toHaveBeenCalledOnce();
    expect(onAnswer.mock.calls[0][1]).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('回答正确！');
  });

  it.each([1000, 1001])('times out once when input is processed at %i ms, before the next timer callback', (now) => {
    const { onAnswer } = mount({ timeLimit: 1 }); start();
    act(() => vi.advanceTimersByTime(900));
    vi.spyOn(performance, 'now').mockReturnValue(now);
    answerCorrect();
    fireEvent.keyDown(window, { key: '1' });
    act(() => vi.advanceTimersByTime(5000));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith('超时', false, false, { outcome: 'timeout', timing: 'timed' });
    expect(screen.getByRole('status')).toHaveTextContent('不代表不会');
  });

  it('does not show the answer or explanation before timeout acknowledgement', () => {
    const { onAnswer, container } = mount({ timeLimit: 1 }); start();
    expect(container).not.toHaveTextContent(question.explanation);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('status')).toHaveTextContent('时间到！');
    expect(screen.queryByText(/正确答案/)).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent(question.explanation);
    expect(container.querySelector('.border-green-500')).toBeNull();
    expect(screen.getByRole('button', { name: 'B92' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '查看答案与解析' }));
    expect(screen.getByRole('status')).toHaveTextContent('正确答案：92');
    expect(container).toHaveTextContent(question.explanation);
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it('distinguishes an actual submitted wrong answer from timeout and explains the method immediately', () => {
    const { onAnswer } = mount(); start();
    fireEvent.click(screen.getByRole('button', { name: 'A82' }));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith('82', false, true, { outcome: 'answered', timing: 'timed' });
    expect(screen.getByRole('status')).toHaveTextContent('回答错误');
    expect(screen.getByRole('status')).toHaveTextContent(question.explanation);
  });

  it('keeps the live region stable while countdown updates stay silent', () => {
    mount(); start();
    const status = screen.getByRole('status');
    const message = status.textContent;
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
    expect(screen.getByRole('timer')).toHaveAttribute('aria-live', 'off');
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole('status')).toBe(status);
    expect(status.textContent).toBe(message);
    expect(screen.getByRole('timer')).toHaveTextContent('10s');
  });

  it.each(['hidden', 'pagehide'])('invalidates the timer on %s without scoring or revealing an answer', (event) => {
    const { onAnswer } = mount(); start();
    if (event === 'hidden') {
      vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
      fireEvent(document, new Event('visibilitychange'));
    } else fireEvent(window, new Event('pagehide'));
    act(() => vi.advanceTimersByTime(60_000));
    expect(onAnswer).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('已转为不限时练习');
    expect(screen.queryByText(/正确答案/)).not.toBeInTheDocument();
    answerCorrect();
    expect(onAnswer).toHaveBeenCalledWith('92', true, true, { outcome: 'answered', timing: 'untimed' });
  });

  it.each(['backward', 'not-finite', 'scheduling-gap', 'wall-jump'])('fails safely on %s, including an input before a timer tick', (kind) => {
    const { onAnswer } = mount(); start();
    act(() => vi.advanceTimersByTime(100));
    if (kind === 'backward') vi.spyOn(performance, 'now').mockReturnValue(-1);
    if (kind === 'not-finite') vi.spyOn(performance, 'now').mockReturnValue(NaN);
    if (kind === 'scheduling-gap') vi.spyOn(performance, 'now').mockReturnValue(20_000);
    if (kind === 'wall-jump') vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 60_000);
    answerCorrect();
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith('92', true, true, { outcome: 'answered', timing: 'untimed' });
  });

  it('uses actual elapsed time rather than callback count after a small scheduling delay', () => {
    mount(); start();
    vi.spyOn(performance, 'now').mockReturnValue(1500);
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1500);
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByRole('timer')).toHaveTextContent('14s');
  });

  it('uses the same deadline when switching to untimed practice races with expiry', () => {
    const { onAnswer } = mount({ timeLimit: 1 }); start();
    act(() => vi.advanceTimersByTime(900));
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    fireEvent.click(screen.getByRole('button', { name: '不限时练习' }));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith('超时', false, false, { outcome: 'timeout', timing: 'timed' });
  });

  it('switches to untimed practice if reading the clock throws', () => {
    const { onAnswer } = mount(); start();
    vi.spyOn(performance, 'now').mockImplementation(() => { throw new Error('clock unavailable'); });
    act(() => vi.advanceTimersByTime(100));
    expect(onAnswer).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('已转为不限时练习');
    answerCorrect();
    expect(onAnswer.mock.calls[0][3].timing).toBe('untimed');
  });

  it('does not start a timer when the clock is invalid', () => {
    const { onAnswer } = mount();
    vi.spyOn(performance, 'now').mockReturnValue(Infinity);
    start();
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('已转为不限时练习');
  });

  it.each(['repeat', 'composing', 'editable', 'outside', 'prevented'])('ignores %s keyboard events', (kind) => {
    const { onAnswer } = mount(); start();
    if (kind === 'editable' || kind === 'outside') {
      const node = document.createElement(kind === 'editable' ? 'input' : 'button');
      document.body.append(node);
      fireEvent.keyDown(node, { key: '2' }); node.remove();
    } else if (kind === 'prevented') {
      const event = new KeyboardEvent('keydown', { key: '2', cancelable: true });
      event.preventDefault(); window.dispatchEvent(event);
    } else fireEvent.keyDown(window, { key: '2', repeat: kind === 'repeat', isComposing: kind === 'composing' });
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('does not restart the deadline when only callback identity changes', () => {
    const { onAnswer, rerender } = mount(); start();
    act(() => vi.advanceTimersByTime(14_000));
    const nextAnswer = vi.fn();
    rerender(<TimedChallengeGame question={{ ...question }} onAnswer={nextAnswer} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(onAnswer).not.toHaveBeenCalled();
    expect(nextAnswer).toHaveBeenCalledExactlyOnceWith('超时', false, false, { outcome: 'timeout', timing: 'timed' });
  });

  it('resets a complete attempt when the question changes, even with the same id', () => {
    const { onAnswer, rerender } = mount(); start(); answerCorrect();
    rerender(<TimedChallengeGame question={{ ...question, timeLimit: 20 }} onAnswer={onAnswer} />);
    expect(screen.getByRole('button', { name: '开始 20 秒练习' })).toBeEnabled();
    start(); answerCorrect();
    expect(onAnswer).toHaveBeenCalledTimes(2);
  });

  it('cleans timers and input listeners on unmount', () => {
    const { onAnswer, unmount } = mount(); start(); unmount();
    fireEvent.keyDown(window, { key: '2' });
    act(() => vi.advanceTimersByTime(60_000));
    expect(onAnswer).not.toHaveBeenCalled();
  });
});
