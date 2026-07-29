import { useMemo, useState } from 'react';
import type { Question } from '@/lib/types';
import { CheckIcon, XIcon, InfoIcon, ArrowUpIcon, ArrowDownIcon, shuffleArray } from './shared';

interface TimelineGameProps {
  question: Question;
  onAnswer: (selectedAnswer: string, isCorrect: boolean) => void;
}

export default function TimelineGame({ question, onAnswer }: TimelineGameProps) {
  const dragItems = useMemo(() => question.dragItems ?? [], [question.dragItems]);

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
          使用 ↑ / ↓ 按钮按正确时间顺序排列，完成后点击「确认」。
        </p>
      )}

      {/* 时间线卡片列表 */}
      <div className="relative space-y-3">
        {/* 时间线竖线 */}
        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-200" />

        {order.map((itemId, index) => {
          const label = getItemLabel(itemId);
          const positionCorrect = hasAnswered && isPositionCorrect(index);
          const isLast = index === order.length - 1;

          return (
            <div key={itemId} className="relative flex items-center gap-3">
              {/* 时间线节点 */}
              <span
                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shrink-0 border-2 transition-all duration-200 ${
                  hasAnswered
                    ? positionCorrect
                      ? 'bg-green-500 border-green-600 text-white'
                      : 'bg-red-500 border-red-600 text-white'
                    : 'bg-white border-slate-300 text-slate-600'
                }`}
              >
                {hasAnswered && !positionCorrect ? (
                  <XIcon />
                ) : hasAnswered && positionCorrect ? (
                  <CheckIcon />
                ) : (
                  index + 1
                )}
              </span>

              {/* 卡片内容 */}
              <div
                className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 min-h-[48px] ${
                  hasAnswered
                    ? positionCorrect
                      ? 'bg-green-50 border-green-500'
                      : 'bg-red-50 border-red-500'
                    : 'bg-white border-slate-200'
                }`}
              >
                <span className="text-slate-700 text-sm sm:text-base">
                  {label}
                </span>
              </div>

              {/* 上移/下移按钮 */}
              {!hasAnswered && (
                <div className="flex flex-col gap-1 shrink-0">
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
                    disabled={isLast}
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
                {isCorrect ? '排序正确！' : '排序错误'}
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
