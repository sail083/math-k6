import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GameRunner from '@/components/GameRunner';
import type { GameConfig } from '@/lib/types';
import { approvedTimedQuestion } from './fixtures/timedQuestion';

const progressMocks = {
  markInitialPass: vi.fn(), markDelayedReviewPass: vi.fn(), markDelayedReviewFail: vi.fn(), recordSkillEvidence: vi.fn(),
};
vi.mock('@/context/ProgressContext', () => ({ useProgress: () => progressMocks }));
const questions: GameConfig['questions'] = [
  { ...approvedTimedQuestion, timeLimit: 1, primarySkillId: 'mult.one-digit', evidenceType: 'procedural' },
  { id: 'independent', type: 'fill-blank', prompt: '不用选项：12 × 3 = ?', correctAnswer: '36', explanation: '12+12+12=36。', points: 10, primarySkillId: 'mult.one-digit', evidenceType: 'transfer' },
];
const game: GameConfig = {
  knowledgePointId: 'timed-scoring', passThreshold: 0.8, questions,
  reviewSets: { d1: { questions }, d7: { questions } },
};
function timeout() {
  fireEvent.click(screen.getByRole('button', { name: '开始 1 秒练习' }));
  act(() => vi.advanceTimersByTime(1000));
}
function answerTransfer() {
  fireEvent.click(screen.getByRole('button', { name: '下一题' }));
  fireEvent.change(screen.getByPlaceholderText('在此输入你的答案'), { target: { value: '36' } });
  fireEvent.click(screen.getByRole('button', { name: '确认' }));
  fireEvent.click(screen.getByRole('button', { name: '查看结果' }));
}

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('timed practice learning evidence and score attribution', () => {
  it.each([null, 'd1', 'd7'] as const)('keeps timeout out of knowledge errors, score denominator and skill evidence in %s mode', (reviewMode) => {
    const { container } = render(<GameRunner game={game} knowledgePointId={game.knowledgePointId} reviewMode={reviewMode} />);
    timeout();
    expect(progressMocks.recordSkillEvidence).not.toHaveBeenCalled();
    expect(container.querySelector('.answer-wrong-anim')).toBeNull();
    expect(screen.getByRole('button', { name: '下一题' })).not.toHaveFocus();
    expect(screen.queryByText(/正确答案/)).not.toBeInTheDocument();
    expect(screen.getByText('知识得分: 0 / 10')).toBeInTheDocument();
    answerTransfer();
    expect(screen.getByText('/ 10')).toBeInTheDocument();
    expect(progressMocks.recordSkillEvidence).toHaveBeenCalledExactlyOnceWith('mult.one-digit', true, true, 'transfer', reviewMode ?? 'initial');
    expect(screen.getByText('未在时限内完成 · 不记知识错误')).toBeInTheDocument();
    expect(screen.queryByText('你的答案：超时')).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent('NaN');
    if (reviewMode === null) {
      expect(progressMocks.markInitialPass).toHaveBeenCalledWith(game.knowledgePointId, 3, true);
      expect(screen.getByText('当堂会')).toBeInTheDocument();
    } else {
      expect(progressMocks.markDelayedReviewPass).toHaveBeenCalledWith(game.knowledgePointId);
      expect(progressMocks.markDelayedReviewFail).not.toHaveBeenCalled();
    }
  });

  it('cannot pass a course using timeout-only results or manufacture transfer evidence', () => {
    render(<GameRunner game={{ ...game, questions: [questions[0]] }} knowledgePointId={game.knowledgePointId} />);
    timeout();
    fireEvent.click(screen.getByRole('button', { name: '查看结果' }));
    expect(progressMocks.markInitialPass).not.toHaveBeenCalled();
    expect(progressMocks.recordSkillEvidence).not.toHaveBeenCalled();
    expect(screen.getByText('最后再练一下')).toBeInTheDocument();
  });

  it('retains untimed submitted wrong answers as procedural evidence and scores, separately from timeout', () => {
    render(<GameRunner game={game} knowledgePointId={game.knowledgePointId} />);
    fireEvent.click(screen.getByRole('button', { name: '不限时练习' }));
    fireEvent.click(screen.getByRole('button', { name: 'A82' }));
    expect(progressMocks.recordSkillEvidence).toHaveBeenCalledExactlyOnceWith('mult.one-digit', false, true, 'procedural', 'initial');
    answerTransfer();
    expect(progressMocks.markInitialPass).not.toHaveBeenCalled();
    expect(screen.getByText('你的答案：82')).toBeInTheDocument();
    expect(screen.queryByText('未在时限内完成 · 不记知识错误')).not.toBeInTheDocument();
  });

  it('does not turn timed answers into knowledge evidence under same-batch duplicate input', () => {
    render(<GameRunner game={game} knowledgePointId={game.knowledgePointId} />);
    fireEvent.click(screen.getByRole('button', { name: '开始 1 秒练习' }));
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    });
    expect(progressMocks.recordSkillEvidence).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('回答正确！');
  });

  it('never treats single-choice timing metadata as transfer mastery, even when content is misconfigured', () => {
    const unsafeGame: GameConfig = { ...game, questions: [{ ...questions[0], evidenceType: 'transfer' }] };
    render(<GameRunner game={unsafeGame} knowledgePointId={game.knowledgePointId} />);
    fireEvent.keyDown(window, { key: '2' }); // Invalid mapping falls back to untimed practice.
    fireEvent.click(screen.getByRole('button', { name: '查看结果' }));
    expect(progressMocks.recordSkillEvidence).not.toHaveBeenCalled();
    expect(progressMocks.markInitialPass).not.toHaveBeenCalled();
  });

  it.each(['A82', 'B92'])('keeps %s under timing as practice performance and judges mastery from untimed evidence', (answer) => {
    render(<GameRunner game={game} knowledgePointId={game.knowledgePointId} />);
    fireEvent.click(screen.getByRole('button', { name: '开始 1 秒练习' }));
    fireEvent.click(screen.getByRole('button', { name: answer }));
    expect(progressMocks.recordSkillEvidence).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '下一题' })).not.toHaveFocus();
    expect(screen.getByText('知识得分: 0 / 10')).toBeInTheDocument();
    answerTransfer();
    expect(screen.getByText('/ 10')).toBeInTheDocument();
    expect(progressMocks.recordSkillEvidence).toHaveBeenCalledExactlyOnceWith('mult.one-digit', true, true, 'transfer', 'initial');
    expect(progressMocks.markInitialPass).toHaveBeenCalledWith(game.knowledgePointId, 3, true);
    expect(screen.getByText('限时练习表现 · 不计知识得分')).toBeInTheDocument();
  });

  it('allows a fresh attempt after restarting without retaining the previous timeout lock', () => {
    render(<GameRunner game={{ ...game, questions: [questions[0]] }} knowledgePointId={game.knowledgePointId} />);
    timeout();
    fireEvent.click(screen.getByRole('button', { name: '查看结果' }));
    fireEvent.click(screen.getByRole('button', { name: '再试一次' }));
    fireEvent.click(screen.getByRole('button', { name: '不限时练习' }));
    fireEvent.keyDown(window, { key: '2' });
    expect(progressMocks.recordSkillEvidence).toHaveBeenCalledExactlyOnceWith('mult.one-digit', true, true, 'procedural', 'initial');
  });
});
