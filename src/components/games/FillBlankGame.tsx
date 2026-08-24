import { useState } from 'react';
import type { Question } from '@/lib/types';
import { CheckIcon, XIcon, InfoIcon } from './shared';

interface FillBlankGameProps {
  question: Question;
  onAnswer: (selectedAnswer: string, isCorrect: boolean, firstTry?: boolean) => void;
}

export default function FillBlankGame({ question, onAnswer }: FillBlankGameProps) {
  const [inputValue, setInputValue] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [resolved, setResolved] = useState(false);
  const [resolvedCorrect, setResolvedCorrect] = useState(false);
  const [submittedValue, setSubmittedValue] = useState('');

  const checkCorrect = (input: string): boolean => {
    const normalized = input.trim().toLowerCase();
    if (normalized === '') return false;
    if (Array.isArray(question.correctAnswer)) {
      return question.correctAnswer.some(
        (ans) => ans.trim().toLowerCase() === normalized,
      );
    }
    return question.correctAnswer.trim().toLowerCase() === normalized;
  };

  const handleSubmit = () => {
    if (resolved) return;
    const trimmed = inputValue.trim();
    if (trimmed === '') return;
    const correct = checkCorrect(trimmed);

    if (correct) {
      const firstTry = attemptCount === 0;
      setSubmittedValue(trimmed);
      setResolved(true);
      setResolvedCorrect(true);
      onAnswer(trimmed, true, firstTry);
    } else {
      const newCount = attemptCount + 1;
      setAttemptCount(newCount);
      setSubmittedValue(trimmed);

      if (newCount >= 2) {
        setResolved(true);
        setResolvedCorrect(false);
        onAnswer(trimmed, false, false);
      } else {
        // First wrong — clear input for retry, don't reveal answer
        setInputValue('');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const correctAnswerText = Array.isArray(question.correctAnswer)
    ? question.correctAnswer.join(' 或 ')
    : question.correctAnswer;

  return (
    <div className="space-y-4">
      {/* 题目 */}
      <p className="text-lg font-medium text-slate-800 leading-relaxed">
        {question.prompt}
      </p>

      {/* 输入框 + 确认按钮 */}
      <div className="flex gap-3">
        <input
          type="text"
          value={resolved ? submittedValue : inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={resolved}
          placeholder="在此输入你的答案"
          autoComplete="off"
          className={`flex-1 min-h-[48px] px-4 rounded-xl border-2 text-base transition-all duration-200 outline-none ${
            !resolved
              ? 'bg-white border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-800 placeholder:text-slate-400'
              : resolvedCorrect
                ? 'bg-green-50 border-green-500 text-slate-800'
                : 'bg-red-50 border-red-500 text-slate-800'
          }`}
        />
        <button
          onClick={handleSubmit}
          disabled={resolved || inputValue.trim() === ''}
          className="px-6 min-h-[48px] rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center"
        >
          确认
        </button>
      </div>

      {/* 第一次答错提示（不揭示正确答案） */}
      {attemptCount === 1 && !resolved && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <span className="text-amber-500 shrink-0 mt-0.5">
            <InfoIcon />
          </span>
          <div>
            <p className="text-sm font-medium text-amber-900 mb-0.5">再想想</p>
            <p className="text-sm text-amber-800">仔细看看题目里的关键条件，换个答案再试一次。</p>
          </div>
        </div>
      )}

      {/* 最终反馈 + 解析（答对或第二次答错后显示） */}
      {resolved && (
        <>
          {/* 正确 / 错误反馈条 */}
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
              resolvedCorrect
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}
          >
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                resolvedCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {resolvedCorrect ? <CheckIcon /> : <XIcon />}
            </span>
            <div className="flex-1">
              <p
                className={`text-sm font-bold ${
                  resolvedCorrect ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {resolvedCorrect ? '回答正确！' : '回答错误'}
              </p>
              {!resolvedCorrect && (
                <p className="text-sm text-green-600 mt-0.5">
                  正确答案：{correctAnswerText}
                </p>
              )}
            </div>
          </div>

          {/* 解析 */}
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
        </>
      )}
    </div>
  );
}
