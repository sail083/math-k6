import { useEffect, useState } from 'react';
import type { Question } from '@/lib/types';
import { CheckIcon, XIcon, InfoIcon } from './shared';

interface ChoiceGameProps {
  question: Question;
  onAnswer: (selectedAnswer: string, isCorrect: boolean) => void;
}

const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function ChoiceGame({ question, onAnswer }: ChoiceGameProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const options = question.options ?? [];

  const checkCorrect = (selected: string): boolean => {
    if (Array.isArray(question.correctAnswer)) {
      return question.correctAnswer.includes(selected);
    }
    return question.correctAnswer === selected;
  };

  const handleSelect = (option: string) => {
    if (hasAnswered) return;
    const isCorrect = checkCorrect(option);
    setSelectedOption(option);
    setHasAnswered(true);
    onAnswer(option, isCorrect);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (hasAnswered) return;
      const keyMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
      const idx = keyMap[e.key.toLowerCase()];
      if (idx !== undefined && idx < options.length) {
        handleSelect(options[idx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasAnswered, options, handleSelect]);

  const getOptionState = (option: string): 'correct' | 'wrong' | 'dimmed' | 'default' => {
    if (!hasAnswered) return 'default';
    const isCorrectOption = checkCorrect(option);
    if (isCorrectOption) return 'correct';
    if (option === selectedOption) return 'wrong';
    return 'dimmed';
  };

  return (
    <div className="space-y-4">
      {/* 题目 */}
      <p className="text-lg font-medium text-slate-800 leading-relaxed">
        {question.prompt}
      </p>

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

      {/* 解析 */}
      {hasAnswered && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <span className="text-blue-500 shrink-0">
            <InfoIcon />
          </span>
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">解析</p>
            <p className="text-sm text-blue-800 leading-relaxed">{question.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
