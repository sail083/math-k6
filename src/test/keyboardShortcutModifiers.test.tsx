import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import type { Question } from '@/lib/types';
import ChoiceGame from '@/components/games/ChoiceGame';
import TimedChallengeGame from '@/components/games/TimedChallengeGame';
import TrueFalseGame from '@/components/games/TrueFalseGame';

const choiceQuestion: Question = {
  id: 'choice', type: 'choice', prompt: '选择题', options: ['对', '错'],
  correctAnswer: '对', explanation: '', points: 10,
};
const timedQuestion: Question = {
  ...choiceQuestion, id: 'timed', type: 'timed-challenge', timeLimit: 30,
};
const trueFalseQuestion: Question = {
  ...choiceQuestion, id: 'true-false', type: 'true-false', options: undefined,
};

type AnswerHandler = (selected: string, isCorrect: boolean, firstTry?: boolean) => void;

const games = [
  ['choice', (onAnswer: AnswerHandler) => <ChoiceGame question={choiceQuestion} onAnswer={onAnswer} />],
  ['timed', (onAnswer: AnswerHandler) => <TimedChallengeGame question={timedQuestion} onAnswer={onAnswer} />],
  ['true-false', (onAnswer: AnswerHandler) => <TrueFalseGame question={trueFalseQuestion} onAnswer={onAnswer} />],
] as const;

describe('answer keyboard shortcuts', () => {
  it.each(games)('%s still accepts an unmodified A key', (_, Game) => {
    const onAnswer = vi.fn();
    render(Game(onAnswer));

    fireEvent.keyDown(window, { key: 'a' });

    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it.each(games.flatMap(([name, Game]) => [
    [`${name} Ctrl+A`, Game, 'ctrlKey'],
    [`${name} Cmd+A`, Game, 'metaKey'],
    [`${name} Alt+A`, Game, 'altKey'],
  ]))('%s does not submit an answer', (_, Game, modifier) => {
    const onAnswer = vi.fn();
    render(Game(onAnswer));

    fireEvent.keyDown(window, { key: 'a', [modifier]: true });

    expect(onAnswer).not.toHaveBeenCalled();
  });
});
