import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type { ProgressData } from '@/lib/types';
import {
  isUnlocked as isUnlockedUtil,
  loadProgress,
  markPassed as markPassedUtil,
  saveProgress,
} from '@/lib/progress';

interface ProgressContextValue {
  progress: ProgressData;
  markPassed: (kpId: string, stars: number) => void;
  isPassed: (kpId: string) => boolean;
  isUnlocked: (prerequisites: string[]) => boolean;
  getStars: (kpId: string) => number;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressData>(() => loadProgress());

  // 进度变化时自动持久化（防抖）
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveProgress(progress), 300);
    return () => clearTimeout(saveTimer.current);
  }, [progress]);

  const markPassed = useCallback((kpId: string, stars: number) => {
    setProgress((prev) => markPassedUtil(prev, kpId, stars));
  }, []);

  const isPassed = useCallback(
    (kpId: string) => progress.passedKnowledgePoints.includes(kpId),
    [progress],
  );

  const isUnlocked = useCallback(
    (prerequisites: string[]) => isUnlockedUtil(progress, prerequisites),
    [progress],
  );

  const getStars = useCallback((kpId: string) => progress.stars[kpId] ?? 0, [progress]);

  const value = useMemo(
    () => ({
      progress,
      markPassed,
      isPassed,
      isUnlocked,
      getStars,
    }),
    [progress, markPassed, isPassed, isUnlocked, getStars],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

/** 获取进度上下文，必须在 ProgressProvider 内使用 */
export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error('useProgress must be used within ProgressProvider');
  }
  return ctx;
}
