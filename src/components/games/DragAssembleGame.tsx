import { useMemo, useState } from 'react';
import type { Question } from '@/lib/types';

interface DragAssembleGameProps {
  question: Question;
  onAnswer: (selectedAnswer: string, isCorrect: boolean) => void;
}

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

function ArrowUpIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 3a1 1 0 01.707.293l5 5a1 1 0 01-1.414 1.414L11 6.414V16a1 1 0 11-2 0V6.414L5.707 9.707a1 1 0 01-1.414-1.414l5-5A1 1 0 0110 3z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 17a1 1 0 01-.707-.293l-5-5a1 1 0 011.414-1.414L9 13.586V4a1 1 0 112 0v9.586l3.293-3.293a1 1 0 111.414 1.414l-5 5A1 1 0 0110 17z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function DragAssembleGame({ question, onAnswer }: DragAssembleGameProps) {
  const dragItems = useMemo(() => question.dragItems ?? [], [question.dragItems]);

  // Shuffle items once on mount
  const initialOrder = useMemo(
    () => shuffleArray(dragItems).map((item) => item.id),
    [dragItems],
  );

  const [order, setOrder] = useState<string[]>(initialOrder);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const correctOrder = useMemo<string[]>(() => {
    if (Array.isArray(question.correctAnswer)) {
      return question.correctAnswer;
    }
    return [question.correctAnswer];
  }, [question.correctAnswer]);

  const moveUp = (index: number) => {
    if (hasAnswered || index === 0) return;
    const newOrder = [...order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrder(newOrder);
  };

  const moveDown = (index: number) => {
    if (hasAnswered || index === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    setOrder(newOrder);
  };

  const handleSubmit = () => {
    if (hasAnswered) return;
    const correct = order.every((id, i) => id === correctOrder[i]);
    setIsCorrect(correct);
    setHasAnswered(true);
    onAnswer(order.join(' → '), correct);
  };

  const getItemLabel = (itemId: string): string => {
    return dragItems.find((i) => i.id === itemId)?.label ?? itemId;
  };

  const isPositionCorrect = (index: number): boolean => {
    return order[index] === correctOrder[index];
  };

  return (
    <div className="space-y-4">
      {/* 题目 */}
      <p className="text-lg font-medium text-slate-800 leading-relaxed">
        {question.prompt}
      </p>

      {/* 提示 */}
      {!hasAnswered && (
        <p className="text-sm text-slate-500">
          使用 ↑ / ↓ 按钮调整步骤顺序，完成后点击「确认」。
        </p>
      )}

      {/* 步骤列表 */}
      <div className="space-y-2">
        {order.map((itemId, index) => {
          const label = getItemLabel(itemId);
          const positionCorrect = hasAnswered && isPositionCorrect(index);

          return (
            <div
              key={itemId}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 min-h-[48px] ${
                hasAnswered
                  ? positionCorrect
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* 序号 */}
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${
                  hasAnswered
                    ? positionCorrect
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {index + 1}
              </span>

              {/* 步骤内容 */}
              <span className="flex-1 text-slate-700 text-sm sm:text-base">
                {label}
              </span>

              {/* 状态图标 */}
              {hasAnswered && (
                <span className={positionCorrect ? 'text-green-600' : 'text-red-600'}>
                  {positionCorrect ? <CheckIcon /> : <XIcon />}
                </span>
              )}

              {/* 上移/下移按钮 */}
              {!hasAnswered && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="上移"
                  >
                    <ArrowUpIcon />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === order.length - 1}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="下移"
                  >
                    <ArrowDownIcon />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 确认按钮 */}
      {!hasAnswered && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors min-h-[48px] flex items-center"
          >
            确认
          </button>
        </div>
      )}

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
                {isCorrect ? '排列正确！' : '排列错误'}
              </p>
              {!isCorrect && (
                <p className="text-sm text-green-600 mt-0.5">
                  正确顺序：{correctOrder.map((id) => getItemLabel(id)).join(' → ')}
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
