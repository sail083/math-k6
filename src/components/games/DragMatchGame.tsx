import { useMemo, useState } from 'react';
import type { Question } from '@/lib/types';

interface DragMatchGameProps {
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

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function DragMatchGame({ question, onAnswer }: DragMatchGameProps) {
  const dragItems = useMemo(() => question.dragItems ?? [], [question.dragItems]);

  // Derive target labels from question.options, or from unique target values in dragItems
  const targets = useMemo<string[]>(() => {
    if (question.options && question.options.length > 0) {
      return [...question.options];
    }
    const uniqueTargets = [
      ...new Set(dragItems.map((item) => item.target).filter(Boolean)),
    ] as string[];
    return uniqueTargets;
  }, [question.options, dragItems]);

  // Shuffle items once on mount
  const shuffledItems = useMemo(() => shuffleArray(dragItems), [dragItems]);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  // targetLabel -> itemId (correct placements only)
  const [placements, setPlacements] = useState<Record<string, string>>({});
  // targetLabel that is currently flashing red (wrong attempt)
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [hadMistake, setHadMistake] = useState(false);

  const placedItemIds = new Set(Object.values(placements));
  const remainingItems = shuffledItems.filter((item) => !placedItemIds.has(item.id));

  const handleItemClick = (itemId: string) => {
    if (hasAnswered) return;
    setSelectedItemId((prev) => (prev === itemId ? null : itemId));
  };

  const handleTargetClick = (targetLabel: string) => {
    if (hasAnswered) return;
    if (!selectedItemId) return;
    if (placements[targetLabel]) return; // already filled

    const item = dragItems.find((i) => i.id === selectedItemId);
    if (!item) return;

    if (item.target === targetLabel) {
      // Correct match
      const newPlacements = { ...placements, [targetLabel]: item.id };
      setPlacements(newPlacements);
      setSelectedItemId(null);

      // Check if all matched
      if (Object.keys(newPlacements).length === dragItems.length) {
        setHasAnswered(true);
        const matchDescription = dragItems
          .map((i) => `${i.label}→${i.target}`)
          .join('，');
        // Prefer correctAnswer as the authority (consistent with other game types);
        // fall back to the constructed mapping string when not provided.
        const hasCorrectAnswer = Array.isArray(question.correctAnswer)
          ? question.correctAnswer.length > 0
          : question.correctAnswer !== '';
        const answerValue = hasCorrectAnswer
          ? Array.isArray(question.correctAnswer)
            ? question.correctAnswer.join('、')
            : question.correctAnswer
          : matchDescription;
        onAnswer(answerValue, !hadMistake);
      }
    } else {
      // Wrong match — flash red and return item
      setHadMistake(true);
      setWrongFlash(targetLabel);
      setSelectedItemId(null);
      setTimeout(() => setWrongFlash(null), 800);
    }
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
          点击左侧项目选中，再点击右侧目标完成匹配。
        </p>
      )}

      {/* 两栏布局 */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {/* 左栏：待匹配项目 */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-600 text-center">项目</p>
          {remainingItems.length === 0 && (
            <div className="flex items-center justify-center min-h-[120px] rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm">
              全部已匹配
            </div>
          )}
          {remainingItems.map((item) => {
            const isSelected = selectedItemId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                disabled={hasAnswered}
                className={`w-full flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-left min-h-[48px] ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 cursor-pointer'
                    : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer'
                }`}
              >
                <span className="flex-1 text-slate-700 text-sm sm:text-base font-medium">
                  {item.label}
                </span>
                {isSelected && (
                  <span className="text-indigo-500 text-xs font-semibold shrink-0">
                    已选中
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 右栏：放置目标 */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-600 text-center">目标</p>
          {targets.map((targetLabel) => {
            const placedItemId = placements[targetLabel];
            const placedItem = placedItemId
              ? dragItems.find((i) => i.id === placedItemId)
              : null;
            const isFlashing = wrongFlash === targetLabel;

            return (
              <button
                key={targetLabel}
                onClick={() => handleTargetClick(targetLabel)}
                disabled={hasAnswered || !!placedItemId}
                className={`w-full flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-left min-h-[48px] ${
                  placedItem
                    ? 'bg-green-50 border-green-500'
                    : isFlashing
                      ? 'bg-red-50 border-red-500 animate-pulse'
                      : selectedItemId
                        ? 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer'
                        : 'bg-white border-slate-200 cursor-default'
                }`}
              >
                <span className="flex-1 text-slate-700 text-sm sm:text-base font-medium">
                  {targetLabel}
                </span>
                {placedItem && (
                  <span className="flex items-center gap-1 shrink-0">
                    <span className="text-green-600 text-xs font-medium">
                      {placedItem.label}
                    </span>
                    <span className="text-green-600">
                      <CheckIcon />
                    </span>
                  </span>
                )}
                {isFlashing && (
                  <span className="text-red-600 shrink-0">
                    <XIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 解析 */}
      {hasAnswered && (
        <>
          {/* 反馈条 */}
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
              !hadMistake
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}
          >
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                !hadMistake
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {!hadMistake ? <CheckIcon /> : <XIcon />}
            </span>
            <div className="flex-1">
              <p
                className={`text-sm font-bold ${
                  !hadMistake ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {!hadMistake ? '全部匹配正确！' : '匹配完成（有错误尝试）'}
              </p>
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
