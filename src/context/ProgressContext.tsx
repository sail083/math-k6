import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type { ProgressData } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
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

/** Merge remote + local: union of passedKnowledgePoints, keep highest stars. */
function mergeProgress(local: ProgressData, remote: ProgressData): ProgressData {
  const passedSet = new Set([...local.passedKnowledgePoints, ...remote.passedKnowledgePoints]);
  const stars: Record<string, number> = {};
  for (const kpId of passedSet) {
    const localStars = local.stars[kpId] ?? 0;
    const remoteStars = remote.stars[kpId] ?? 0;
    stars[kpId] = Math.max(localStars, remoteStars);
  }
  return { passedKnowledgePoints: Array.from(passedSet), stars };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressData>(() => loadProgress());

  // Track whether we've done the initial sync for the current user
  const hasSyncedRef = useRef(false);
  const prevUserIdRef = useRef<string | null>(null);

  // When user changes (login/logout), sync remote progress
  useEffect(() => {
    // Reset sync flag when user changes
    if (user?.id !== prevUserIdRef.current) {
      hasSyncedRef.current = false;
      prevUserIdRef.current = user?.id ?? null;
    }

    if (!user || hasSyncedRef.current) return;

    hasSyncedRef.current = true;

    (async () => {
      try {
        // Load remote progress from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('progress')
          .eq('id', user.id)
          .single();

        const remoteProgress = (profile?.progress as ProgressData | null) ?? null;

        if (remoteProgress && remoteProgress.passedKnowledgePoints?.length > 0) {
          // Merge local and remote, then save merged result everywhere
          const localProgress = loadProgress();
          const merged = mergeProgress(localProgress, remoteProgress);
          setProgress(merged);
          saveProgress(merged);
          // Also push merged back to Supabase
          await supabase
            .from('profiles')
            .update({ progress: merged })
            .eq('id', user.id);
        } else {
          // No remote progress yet -- push local progress to Supabase
          const localProgress = loadProgress();
          if (localProgress.passedKnowledgePoints.length > 0) {
            await supabase
              .from('profiles')
              .update({ progress: localProgress })
              .eq('id', user.id);
          }
        }
      } catch (err) {
        console.error('[ProgressSync] Failed to sync on login:', err);
      }
    })();
  }, [user]);

  // 进度变化时自动持久化（防抖）+ sync to Supabase
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProgress(progress);

      // Sync to Supabase if user is logged in
      if (user) {
        supabase
          .from('profiles')
          .update({ progress })
          .eq('id', user.id)
          .then(({ error }) => {
            if (error) {
              console.error('[ProgressSync] Failed to save progress to Supabase:', error);
            }
          });
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [progress, user]);

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
