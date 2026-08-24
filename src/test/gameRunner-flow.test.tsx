/**
 * Rendered regression test for GameRunner frozen review mode and course-switch reset.
 *
 * Verifies:
 * 1. D1 review result persists after live mastery changes (reviewMode prop goes null).
 * 2. Navigating to a different course via keyed boundary resets question state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import type { GameConfig, Question } from '@/lib/types';
import GameRunner from '@/components/GameRunner';

// --- Mock progress context ---

const progressMocks = {
  markInitialPass: vi.fn(),
  markDelayedReviewPass: vi.fn(),
  markDelayedReviewFail: vi.fn(),
};

vi.mock('@/context/ProgressContext', () => ({
  useProgress: () => ({
    progress: { passedKnowledgePoints: [], stars: {} },
    markPassed: vi.fn(),
    isPassed: vi.fn(() => false),
    isUnlocked: vi.fn(() => true),
    getStars: vi.fn(() => 0),
    getMasteryStatus: vi.fn(() => null),
    getDueReviewIds: vi.fn(() => []),
    getReviewMode: vi.fn(() => null),
    setCurrentLearning: vi.fn(),
    ...progressMocks,
  }),
}));

// --- Mock game sub-components ---
// These render clickable options that call onAnswer, mirroring real game UX.

vi.mock('@/components/games/ChoiceGame', () => ({
  default: ({ question, onAnswer }: { question: Question; onAnswer: (s: string, c: boolean, ft: boolean) => void }) => (
    <div data-testid={`question-${question.id}`}>
      <p>{question.prompt}</p>
      {(question.options ?? []).map((opt) => (
        <button
          key={opt}
          onClick={() => onAnswer(opt, opt === question.correctAnswer, true)}
        >
          {opt}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/components/games/FillBlankGame', () => ({
  default: ({ question, onAnswer }: { question: Question; onAnswer: (s: string, c: boolean, ft: boolean) => void }) => (
    <div data-testid={`question-${question.id}`}>
      <p>{question.prompt}</p>
      <button
        data-testid="fill-submit"
        onClick={() => onAnswer(String(question.correctAnswer), true, true)}
      >
        submit
      </button>
    </div>
  ),
}));

// --- Mock UiIcon ---

vi.mock('@/components/UiIcon', () => ({
  default: () => <span data-testid="ui-icon" />,
}));

// --- Tests ---

describe('GameRunner rendered regression', () => {
  function makeQuestion(
    id: string,
    type: 'choice' | 'fill-blank',
    prompt: string,
    opts?: string[],
    answer?: string,
    points = 10,
  ): Question {
    if (type === 'choice') {
      return {
        id, type, prompt,
        options: opts ?? ['A', 'B'],
        correctAnswer: answer ?? 'A',
        explanation: '', points,
      };
    }
    return {
      id, type, prompt,
      correctAnswer: answer ?? '42',
      explanation: '', points,
    };
  }

  const gameWithReview: GameConfig = {
    knowledgePointId: 'kp-review',
    passThreshold: 0.8,
    questions: [
      makeQuestion('orig-c', 'choice', '原始选择题', ['X', 'Y'], 'X'),
      makeQuestion('orig-f', 'fill-blank', '原始填空题', undefined, '99'),
    ],
    reviewSets: {
      d1: {
        questions: [
          makeQuestion('d1-c', 'choice', 'D1复习选择题', ['P', 'Q'], 'P'),
          makeQuestion('d1-f', 'fill-blank', 'D1复习填空题', undefined, '50'),
        ],
      },
      d7: {
        questions: [
          makeQuestion('d7-c', 'choice', 'D7复习题'),
          makeQuestion('d7-f', 'fill-blank', 'D7复习填空', undefined, '77'),
        ],
      },
    },
  };

  const otherGame: GameConfig = {
    knowledgePointId: 'kp-other',
    passThreshold: 0.8,
    questions: [
      makeQuestion('other-c', 'choice', '另一课选择题', ['M', 'N'], 'M'),
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Harness: manages GameRunner props in state so the test can simulate
   * parent re-renders (e.g. reviewMode going null after mastery change,
   * or knowledgePointId changing on course navigation).
   */
  function Harness() {
    const [reviewMode, setReviewMode] = useState<'d1' | 'd7' | null>('d1');
    const [kpId, setKpId] = useState('kp-review');
    const [game, setGame] = useState<GameConfig>(gameWithReview);

    return (
      <div>
        <button
          data-testid="harness-clear-review"
          onClick={() => setReviewMode(null)}
        >
          clear-review
        </button>
        <button
          data-testid="harness-switch-course"
          onClick={() => {
            setKpId('kp-other');
            setGame(otherGame);
            setReviewMode(null);
          }}
        >
          switch-course
        </button>
        <GameRunner
          key={`gamerunner-${kpId}`}
          game={game}
          knowledgePointId={kpId}
          reviewMode={reviewMode}
        />
      </div>
    );
  }

  it('D1 review result persists after live mastery changes to null reviewMode', () => {
    render(<Harness />);

    // --- Question 1: D1 choice question ---
    expect(screen.getByTestId('question-d1-c')).toBeInTheDocument();
    expect(screen.queryByTestId('question-orig-c')).not.toBeInTheDocument();
    expect(screen.getByText(/复习（第一次）/)).toBeInTheDocument();

    // Answer choice question correctly
    fireEvent.click(screen.getByText('P'));
    // Advance to next question
    fireEvent.click(screen.getByText('下一题'));

    // --- Question 2: D1 fill-blank question ---
    expect(screen.getByTestId('question-d1-f')).toBeInTheDocument();
    expect(screen.queryByTestId('question-orig-f')).not.toBeInTheDocument();

    // Answer fill-blank correctly
    fireEvent.click(screen.getByTestId('fill-submit'));
    // Click "查看结果"
    fireEvent.click(screen.getByText('查看结果'));

    // --- Verify D1 pass result ---
    expect(screen.getByText('第一次复习通过')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('/ 20')).toBeInTheDocument();

    expect(progressMocks.markDelayedReviewPass).toHaveBeenCalledWith('kp-review');

    // --- Simulate parent re-render with reviewMode=null ---
    act(() => {
      fireEvent.click(screen.getByTestId('harness-clear-review'));
    });

    // Result MUST still show D1 review copy and score
    expect(screen.getByText('第一次复习通过')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();

    // Must NOT show original-question content
    expect(screen.queryByTestId('question-orig-c')).not.toBeInTheDocument();
    expect(screen.queryByTestId('question-orig-f')).not.toBeInTheDocument();

    // D1 review questions appear in the answer review section
    expect(screen.getByText('D1复习选择题')).toBeInTheDocument();
    expect(screen.getByText('D1复习填空题')).toBeInTheDocument();
  });

  it('different knowledgePointId through keyed boundary starts at question 1 with no prior answers', () => {
    render(<Harness />);

    // Verify initial state: D1 review questions
    expect(screen.getByTestId('question-d1-c')).toBeInTheDocument();
    expect(screen.getByText(/复习（第一次）/)).toBeInTheDocument();

    // Answer both D1 questions
    fireEvent.click(screen.getByText('P'));
    fireEvent.click(screen.getByText('下一题'));
    fireEvent.click(screen.getByTestId('fill-submit'));
    fireEvent.click(screen.getByText('查看结果'));

    // Confirm D1 pass
    expect(screen.getByText('第一次复习通过')).toBeInTheDocument();

    // --- Switch to a different course ---
    act(() => {
      fireEvent.click(screen.getByTestId('harness-switch-course'));
    });

    // --- New course: starts at question 1, no prior result ---
    expect(screen.getByTestId('question-other-c')).toBeInTheDocument();
    expect(screen.getByText('另一课选择题')).toBeInTheDocument();

    // Question 1 of 1, no review prefix
    expect(screen.getByText('第 1 / 1 题')).toBeInTheDocument();
    expect(screen.queryByText(/复习/)).not.toBeInTheDocument();

    // No prior result from D1 review
    expect(screen.queryByText('第一次复习通过')).not.toBeInTheDocument();
    expect(screen.queryByText('答题回顾')).not.toBeInTheDocument();
  });
});
