import { useEffect, useState } from 'react';
import type { Question } from '@/lib/types';

interface TimedChallengeGameProps {
  question: Question;
  onAnswer: (selectedAnswer: string, isCorrect: boolean) => void;
}

const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function CheckIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 111.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function TimedChallengeGame({ question, onAnswer }: TimedChallengeGameProps) {
  const timeLimit = question.timeLimit ?? 30;
  const options = question.options ?? [];

  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (hasAnswered) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [hasAnswered]);

  // Handle timeout
  useEffect(() => {
    if (timeLeft === 0 && !hasAnswered) {
      setTimedOut(true);
      setHasAnswered(true);
      setIsCorrect(false);
      onAnswer('超时', false);
    }
  }, [timeLeft, hasAnswered, onAnswer]);

  const checkCorrect = (selected: string): boolean => {
    if (Array.isArray(question.correctAnswer)) {
      return question.correctAnswer.includes(selected);
    }
    return question.correctAnswer === selected;
  };

  const handleSelect = (option: string) => {
    if (hasAnswered) return;
    const correct = checkCorrect(option);
    setSelectedOption(option);
    setIsCorrect(correct);
    setHasAnswered(true);
    onAnswer(option, correct);
  };

  const getOptionState = (option: string): 'correct' | 'wrong' | 'dimmed' | 'default' => {
    if (!hasAnswered) return 'default';
    const isCorrectOption = checkCorrect(option);
    if (isCorrectOption) return 'correct';
    if (option === selectedOption) return 'wrong';
    return 'dimmed';
  };

  const isUrgent = timeLeft <= 10 && !hasAnswered;
  const progressPercent = (timeLeft / timeLimit) * 100;

  return (
    <div className="space-y-4">
      {/* 计时器 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg tabular-nums transition-colors ${
              hasAnswered
                ? 'bg-slate-100 text-slate-500'
                : isUrgent
                  ? 'bg-red-100 text-red-600 animate-pulse'
                  : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            <ClockIcon />
            <span>{hasAnswered ? '已结束' : `${timeLeft}s`}</span>
          </div>
          {!hasAnswered && (
            <span className="text-sm text-slate-500 font-medium">
              ⚡ 限时挑战
            </span>
          )}
        </div>
        {/* 进度条 */}
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              isUrgent
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 题目 */}
      <p className="text-lg font-medium text-slate-800 leading-relaxed">
        {question.prompt}
      </p>

      {/* 超时提示 */}
      {timedOut && (
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 bg-red-50 border-red-500">
          <span className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 bg-red-500 text-white">
            <XIcon />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700">时间到！</p>
            <p className="text-sm text-green-600 mt-0.5">
              正确答案：{Array.isArray(question.correctAnswer) ? question.correctAnswer.join('、') : question.correctAnswer}
            </p>
          </div>
        </div>
      )}

      {/* 选项 */}
      <div className="space-y-3">
        {options.map((option, index) => {
          const state = getOptionState(option);
          const letter = optionLetters[index] ?? String(index + 1);

          return (
            <button
              key={index}
              onClick={() => handleSelect(option)}
              disabled={hasAnswered}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left min-h-[48px] ${
                state === 'correct'
                  ? 'bg-green-50 border-green-500'
                  : state === 'wrong'
                    ? 'bg-red-50 border-red-500'
                    : state === 'dimmed'
                      ? 'bg-white border-slate-200 opacity-50'
                      : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer'
              }`}
            >
              {/* 选项字母徽章 */}
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${
                  state === 'correct'
                    ? 'bg-green-500 text-white'
                    : state === 'wrong'
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {letter}
              </span>

              {/* 选项文本 */}
              <span className="flex-1 text-slate-700">{option}</span>

              {/* 状态图标 */}
              {state === 'correct' && (
                <span className="text-green-600 shrink-0">
                  <CheckIcon />
                </span>
              )}
              {state === 'wrong' && (
                <span className="text-red-600 shrink-0">
                  <XIcon />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 解析（答题后或超时后都显示） */}
      {hasAnswered && !timedOut && (
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 bg-blue-50 border-blue-200">
          <span
            className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
              isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {isCorrect ? <CheckIcon /> : <XIcon />}
          </span>
          <div className="flex-1">
            <p
              className={`text-sm font-bold ${
                isCorrect ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {isCorrect ? '回答正确！' : '回答错误'}
            </p>
            {!isCorrect && (
              <p className="text-sm text-green-600 mt-0.5">
                正确答案：{Array.isArray(question.correctAnswer) ? question.correctAnswer.join('、') : question.correctAnswer}
              </p>
            )}
          </div>
        </div>
      )}

      {hasAnswered && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <span className="text-blue-500 shrink-0">
            <InfoIcon />
          </span>
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">解析</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              {question.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
