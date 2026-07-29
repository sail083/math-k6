import { useState } from 'react';
import type { Question } from '@/lib/types';
import { CheckIcon, XIcon, InfoIcon } from './shared';

interface TrueFalseGameProps {
  question: Question;
  onAnswer: (selectedAnswer: string, isCorrect: boolean) => void;
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
