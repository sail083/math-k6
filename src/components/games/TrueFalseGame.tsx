import { useState } from 'react';
import type { Question } from '@/lib/types';

interface TrueFalseGameProps {
  question: Question;
  onAnswer: (selectedAnswer: string, isCorrect: boolean) => void;
}

function CheckIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
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
    <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
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

export default function TrueFalseGame({ question, onAnswer }: TrueFalseGameProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  // 选项优先取 question.options，否则回退为 ["对", "错"]
  const options =
    question.options && question.options.length > 0
      ? question.options
      : ['对', '错'];

  const checkCorrect = (selected: string): boolean => {
    const normalized = selected.trim().toLowerCase();
    if (Array.isArray(question.correctAnswer)) {
      return question.correctAnswer.some(
        (ans) => ans.trim().toLowerCase() === normalized,
      );
    }
    return question.correctAnswer.trim().toLowerCase() === normalized;
  };

  const handleSelect = (option: string) => {
    if (hasAnswered) return;
    const correct = checkCorrect(option);
    setSelectedOption(option);
    setHasAnswered(true);
    onAnswer(option, correct);
  };

  const getButtonState = (
    option: string,
  ): 'correct' | 'wrong' | 'dimmed' | 'default' => {
    if (!hasAnswered) return 'default';
    const isCorrectOption = checkCorrect(option);
    if (isCorrectOption) return 'correct';
    if (option === selectedOption) return 'wrong';
    return 'dimmed';
  };

  const isTrueOption = (option: string) => option === '对';

  return (
    <div className="space-y-4">
      {/* 题目 */}
      <p className="text-lg font-medium text-slate-800 leading-relaxed">
        {question.prompt}
      </p>

      {/* 对 / 错 按钮 */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((option, index) => {
          const state = getButtonState(option);
          const isTrue = isTrueOption(option);

          return (
            <button
              key={index}
              onClick={() => handleSelect(option)}
              disabled={hasAnswered}
              className={`relative w-full flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border-2 transition-all duration-200 min-h-[88px] ${
                state === 'correct'
                  ? 'bg-green-500 border-green-600 text-white shadow-md'
                  : state === 'wrong'
                    ? 'bg-red-500 border-red-600 text-white shadow-md'
                    : state === 'dimmed'
                      ? 'bg-white border-slate-200 opacity-50 text-slate-400'
                      : isTrue
                        ? 'bg-white border-slate-200 text-green-600 hover:border-green-400 hover:bg-green-50 cursor-pointer'
                        : 'bg-white border-slate-200 text-red-600 hover:border-red-400 hover:bg-red-50 cursor-pointer'
              }`}
            >
              <span className="text-3xl">
                {isTrue ? '✓' : '✗'}
              </span>
              <span className="text-xl font-bold">{option}</span>

              {/* 状态图标 */}
              {state === 'correct' && (
                <span className="absolute">
                  <CheckIcon />
                </span>
              )}
              {state === 'wrong' && (
                <span className="absolute">
                  <XIcon />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 解析 */}
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
