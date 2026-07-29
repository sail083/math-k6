import { useState } from 'react';
import type { Question } from '@/lib/types';
import { CheckIcon, XIcon, InfoIcon } from './shared';

interface FillBlankGameProps {
  question: Question;
  onAnswer: (selectedAnswer: string, isCorrect: boolean) => void;
}

export default function FillBlankGame({ question, onAnswer }: FillBlankGameProps) {
  const [inputValue, setInputValue] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
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
    if (hasAnswered) return;
    const trimmed = inputValue.trim();
    if (trimmed === '') return;
    const correct = checkCorrect(trimmed);
    setSubmittedValue(trimmed);
    setIsCorrect(correct);
    setHasAnswered(true);
    onAnswer(trimmed, correct);
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
          value={hasAnswered ? submittedValue : inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={hasAnswered}
          placeholder="在此输入你的答案"
          autoComplete="off"
          className={`flex-1 min-h-[48px] px-4 rounded-xl border-2 text-base transition-all duration-200 outline-none ${
            !hasAnswered
              ? 'bg-white border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-800 placeholder:text-slate-400'
              : isCorrect
                ? 'bg-green-50 border-green-500 text-slate-800'
                : 'bg-red-50 border-red-500 text-slate-800'
          }`}
        />
        <button
          onClick={handleSubmit}
          disabled={hasAnswered || inputValue.trim() === ''}
          className="px-6 min-h-[48px] rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center"
        >
          确认
        </button>
      </div>

      {/* 反馈 + 解析 */}
      {hasAnswered && (
        <>
          {/* 正确 / 错误反馈条 */}
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
              isCorrect
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}
          >
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
