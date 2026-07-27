import { useMemo, useState } from 'react';
import type { GameConfig } from '@/lib/types';
import { useProgress } from '@/context/ProgressContext';
import ChoiceGame from '@/components/games/ChoiceGame';
import FillBlankGame from '@/components/games/FillBlankGame';
import TrueFalseGame from '@/components/games/TrueFalseGame';
import DragMatchGame from '@/components/games/DragMatchGame';
import DragAssembleGame from '@/components/games/DragAssembleGame';
import TimelineGame from '@/components/games/TimelineGame';
import TimedChallengeGame from '@/components/games/TimedChallengeGame';

interface GameRunnerProps {
  game: GameConfig;
  knowledgePointId: string;
  className?: string;
}

type GameStatus = 'playing' | 'passed' | 'failed';

interface AnswerRecord {
  selected: string | string[];
  correct: boolean;
}

export function calculateStars(correctRate: number, passThreshold: number): number {
  if (correctRate < passThreshold) return 0;
  if (correctRate >= 1.0) return 3;
  if (correctRate >= 0.9) return 2;
  return 1;
}

function StarRow({ earned, total }: { earned: number; total: number }) {
  return (
    <div className="flex justify-center gap-2 text-4xl">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={
            i < earned
              ? 'text-amber-400 animate-bounce'
              : 'text-slate-300'
          }
          style={{ animationDelay: `${i * 100}ms`, animationDuration: '0.6s' }}
        >
          {i < earned ? '\u2605' : '\u2606'}
        </span>
      ))}
    </div>
  );
}

function NextArrowIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function GameRunner({ game, knowledgePointId, className }: GameRunnerProps) {
  const { markPassed } = useProgress();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');

  const maxScore = useMemo(
    () => game.questions.reduce((sum, q) => sum + q.points, 0),
    [game.questions],
  );

  const score = useMemo(
    () =>
      game.questions.reduce((sum, q) => {
        const answer = answers[q.id];
        return sum + (answer?.correct ? q.points : 0);
      }, 0),
    [answers, game.questions],
  );

  // 边界情况：没有题目
  if (game.questions.length === 0) {
    return (
      <div className={`text-center py-12${className ? ' ' + className : ''}`}>
        <div className="text-4xl mb-3">📝</div>
        <p className="text-slate-500 text-lg">暂无题目</p>
      </div>
    );
  }

  const currentQuestion = game.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === game.questions.length - 1;
  const isAnswered = answers[currentQuestion.id] !== undefined;
  const progressPercent = ((currentQuestionIndex + 1) / game.questions.length) * 100;

  const handleAnswer = (selected: string, isCorrect: boolean) => {
    if (answers[currentQuestion.id]) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: { selected, correct: isCorrect },
    }));
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      const correctRate = maxScore > 0 ? score / maxScore : 0;
      if (correctRate >= game.passThreshold) {
        const stars = calculateStars(correctRate, game.passThreshold);
        setGameStatus('passed');
        markPassed(knowledgePointId, stars);
      } else {
        setGameStatus('failed');
      }
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setGameStatus('playing');
  };

  const handleBack = () => {
    window.history.back();
  };

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'choice':
        return (
          <ChoiceGame
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        );
      case 'fill-blank':
        return (
          <FillBlankGame
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        );
      case 'true-false':
        return (
          <TrueFalseGame
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        );
      case 'drag-match':
        return (
          <DragMatchGame
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        );
      case 'drag-assemble':
        return (
          <DragAssembleGame
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        );
      case 'timeline':
        return (
          <TimelineGame
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        );
      case 'timed-challenge':
        return (
          <TimedChallengeGame
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        );
      default:
        return (
          <div className="text-center py-8 text-slate-500">该题型即将上线</div>
        );
    }
  };

  // ===== 结果界面 =====
  if (gameStatus === 'passed' || gameStatus === 'failed') {
    const correctRate = maxScore > 0 ? score / maxScore : 0;
    const stars = calculateStars(correctRate, game.passThreshold);
    const passed = gameStatus === 'passed';

    return (
      <div className={`space-y-6${className ? ' ' + className : ''}`}>
        {/* 结果卡片 */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 text-center">
          {passed ? (
            <>
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-indigo-600 mb-2">恭喜过关！</h2>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3">💪</div>
              <h2 className="text-2xl font-bold text-slate-700 mb-2">再接再厉！</h2>
            </>
          )}

          {/* 星级 */}
          <div className="my-6">
            <StarRow earned={stars} total={3} />
          </div>

          {/* 得分摘要 */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100">
            <span className="text-sm text-slate-500">得分</span>
            <span className="text-lg font-bold text-slate-800 tabular-nums">{score}</span>
            <span className="text-sm text-slate-400">/ {maxScore}</span>
          </div>
        </div>

        {/* 答题回顾 */}
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">答题回顾</h3>
          <div className="space-y-4">
            {game.questions.map((q, index) => {
              const answer = answers[q.id];
              const correct = answer?.correct ?? false;
              const selectedText = answer
                ? Array.isArray(answer.selected)
                  ? answer.selected.join('、')
                  : answer.selected
                : '';
              const correctText = Array.isArray(q.correctAnswer)
                ? q.correctAnswer.join('、')
                : q.correctAnswer;

              return (
                <div
                  key={q.id}
                  className="rounded-lg border border-slate-200 overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-3 bg-slate-50">
                    <span
                      className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        correct
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {correct ? '✓' : '✗'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">
                        第 {index + 1} 题
                      </p>
                      <p className="text-sm text-slate-600 mt-0.5">{q.prompt}</p>
                    </div>
                  </div>
                  {!correct && answer && (
                    <div className="px-3 pb-3 pt-2 space-y-1 bg-white border-t border-slate-100">
                      <p className="text-xs text-red-500">你的答案：{selectedText}</p>
                      <p className="text-xs text-green-600">正确答案：{correctText}</p>
                      <p className="text-xs text-slate-500 mt-1">{q.explanation}</p>
                    </div>
                  )}
                  {correct && (
                    <div className="px-3 pb-3 pt-2 bg-white border-t border-slate-100">
                      <p className="text-xs text-slate-500">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 justify-center">
          {!passed && (
            <button
              onClick={handleRestart}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[48px] flex items-center"
            >
              再试一次
            </button>
          )}
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-xl bg-white border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors min-h-[48px] flex items-center"
          >
            返回知识点
          </button>
        </div>
      </div>
    );
  }

  // ===== 游戏进行中界面 =====
  return (
    <div className={`space-y-4${className ? ' ' + className : ''}`}>
      {/* 进度条 + 信息 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">
            第 {currentQuestionIndex + 1} / {game.questions.length} 题
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium tabular-nums">
            得分: {score} / {maxScore}
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 题目卡片 */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6">
        {renderQuestion()}
      </div>

      {/* 下一题按钮 */}
      {isAnswered && (
        <div className="flex justify-end">
          <button
            onClick={handleNext}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[48px] flex items-center gap-2"
          >
            {isLastQuestion ? '查看结果' : '下一题'}
            <NextArrowIcon />
          </button>
        </div>
      )}
    </div>
  );
}
