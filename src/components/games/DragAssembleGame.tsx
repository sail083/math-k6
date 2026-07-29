import { useMemo, useState } from 'react';
import type { Question } from '@/lib/types';
import { CheckIcon, XIcon, InfoIcon, ArrowUpIcon, ArrowDownIcon, shuffleArray } from './shared';

interface DragAssembleGameProps {
  question: Question;
  onAnswer: (selectedAnswer: string, isCorrect: boolean) => void;
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
                    className="flex items-center justify-center w-11 h-11 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="上移"
                  >
                    <ArrowUpIcon />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === order.length - 1}
                    className="flex items-center justify-center w-11 h-11 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
