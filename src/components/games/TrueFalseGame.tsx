import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Question } from '@/lib/types';
import { CheckIcon, XIcon, InfoIcon } from './shared';

interface TrueFalseGameProps {
  question: Question;
  onAnswer: (selectedAnswer: string, isCorrect: boolean, firstTry?: boolean) => void;
}

export default function TrueFalseGame({ question, onAnswer }: TrueFalseGameProps) {
  const [wrongOptions, setWrongOptions] = useState<string[]>([]);
  const [resolved, setResolved] = useState(false);
  const [resolvedCorrect, setResolvedCorrect] = useState(false);
  const [finalSelection, setFinalSelection] = useState<string | null>(null);

  // 选项优先取 question.options，否则回退为 ["对", "错"]
  const options = useMemo(
    () => question.options && question.options.length > 0 ? question.options : ['对', '错'],
    [question.options],
  );

  const checkCorrect = useCallback((selected: string): boolean => {
    const normalized = selected.trim().toLowerCase();
    if (Array.isArray(question.correctAnswer)) {
      return question.correctAnswer.some(
        (ans) => ans.trim().toLowerCase() === normalized,
      );
    }
    return question.correctAnswer.trim().toLowerCase() === normalized;
  }, [question.correctAnswer]);

  const handleSelect = useCallback((option: string) => {
    if (resolved || wrongOptions.includes(option)) return;
    const correct = checkCorrect(option);
    if (correct) {
      setResolved(true);
      setResolvedCorrect(true);
      setFinalSelection(option);
      onAnswer(option, true, wrongOptions.length === 0);
      return;
    }

    setWrongOptions((previous) => [...previous, option]);
  }, [checkCorrect, onAnswer, resolved, wrongOptions]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (resolved) return;
      const index = ({ '1': 0, '2': 1, a: 0, b: 1 } as Record<string, number>)[event.key.toLowerCase()];
      if (index !== undefined && options[index]) handleSelect(options[index]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [resolved, options, handleSelect]);

  const getButtonState = (
    option: string,
  ): 'correct' | 'wrong' | 'dimmed' | 'default' => {
    if (!resolved) return wrongOptions.includes(option) ? 'wrong' : 'default';
    const isCorrectOption = checkCorrect(option);
    if (isCorrectOption) return 'correct';
    if (option === finalSelection) return 'wrong';
    return 'dimmed';
  };

  const isTrueOption = (option: string) => option === '对';

  return (
    <div className="space-y-4">
      {/* 题目 */}
      <p className="text-lg font-medium text-slate-800 leading-relaxed">
        {question.prompt}
      </p>
      <p className="text-xs text-slate-500">按 1 或 A 选对；按 2 或 B 选错</p>

      {/* 对 / 错 按钮 */}
      <div className="grid grid-cols-2 gap-4">
        {options.map((option, index) => {
          const state = getButtonState(option);
          const isTrue = isTrueOption(option);

          return (
            <button
              key={index}
              onClick={() => handleSelect(option)}
              disabled={resolved || wrongOptions.includes(option)}
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

      {wrongOptions.length === 1 && !resolved && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <span className="text-amber-500 shrink-0 mt-0.5"><InfoIcon /></span>
          <div>
            <p className="text-sm font-medium text-amber-900 mb-0.5">再想想</p>
            <p className="text-sm text-amber-800">回到题目的条件，换一个判断再确认一次。</p>
          </div>
        </div>
      )}

      {/* 最终解析 */}
      {resolved && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <span className="text-blue-500 shrink-0">
            <InfoIcon />
          </span>
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">{resolvedCorrect ? '回答正确！' : '解析'}</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              {question.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
