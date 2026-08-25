import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type { ProgressData, MasteryStatus, EvidenceType } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  isUnlocked as isUnlockedUtil,
  loadProgress,
  markPassed as markPassedUtil,
  markInitialPass as markInitialPassUtil,
  markDelayedReviewPass as markDelayedReviewPassUtil,
  markDelayedReviewFail as markDelayedReviewFailUtil,
  getMasteryStatus as getMasteryStatusUtil,
  getDueReviewIds as getDueReviewIdsUtil,
  getReviewMode as getReviewModeUtil,
  setCurrentLearning as setCurrentLearningUtil,
  pickBetterMastery,
  saveProgress,
  recordSkillEvidence as recordSkillEvidenceUtil,
  getSkillDisplayStatus as getSkillDisplayStatusUtil,
  hasDirectSkillEvidence as hasDirectSkillEvidenceUtil,
  mergeSkillEvidence,
  hasMeaningfulProgress,
  parseSkillEvidence,
  type SkillDisplayStatus,
} from '@/lib/progress';

interface ProgressContextValue {
  progress: ProgressData;
  markPassed: (kpId: string, stars: number) => void;
  markInitialPass: (kpId: string, stars: number, hasReviewSets: boolean) => void;
  markDelayedReviewPass: (kpId: string) => void;
  markDelayedReviewFail: (kpId: string) => void;
  isPassed: (kpId: string) => boolean;
  isUnlocked: (prerequisites: string[]) => boolean;
  getStars: (kpId: string) => number;
  getMasteryStatus: (kpId: string) => MasteryStatus | null;
  getDueReviewIds: () => string[];
  getReviewMode: (kpId: string) => 'd1' | 'd7' | null;
  setCurrentLearning: (kpId: string) => void;
  // ===== 技能证据 =====
  recordSkillEvidence: (skillId: string, isCorrect: boolean, isFirstTry: boolean, evidenceType: EvidenceType, mode: 'initial' | 'd1' | 'd7') => void;
  getSkillDisplayStatus: (skillId: string) => SkillDisplayStatus;
  hasDirectSkillEvidence: (skillId: string) => boolean;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

/** Merge remote + local: union of passedKnowledgePoints, keep highest stars, merge mastery. */
function mergeProgress(local: ProgressData, remote: ProgressData): ProgressData {
  // Null-protect passedKnowledgePoints
  const localPassed = local.passedKnowledgePoints ?? [];
  const remotePassed = remote.passedKnowledgePoints ?? [];
  const passedSet = new Set([...localPassed, ...remotePassed]);
  // Null-protect stars
  const localStars = local.stars ?? {};
  const remoteStars = remote.stars ?? {};
  const stars: Record<string, number> = {};
  for (const kpId of passedSet) {
    stars[kpId] = Math.max(localStars[kpId] ?? 0, remoteStars[kpId] ?? 0);
  }
  // Merge mastery: prefer the record with higher delayedReviewCount (or stable)
  const mastery: Record<string, import('@/lib/types').MasteryRecord> = {};
  const allMasteryIds = new Set([
    ...Object.keys(local.mastery ?? {}),
    ...Object.keys(remote.mastery ?? {}),
  ]);
  for (const id of allMasteryIds) {
    const l = local.mastery?.[id];
    const r = remote.mastery?.[id];
    if (l && r) {
      mastery[id] = pickBetterMastery(l, r);
    } else {
      mastery[id] = l ?? r!;
    }
  }
  // Parse skillEvidence from both sides to ensure safe objects before merging
  const localEvidence = parseSkillEvidence(local.skillEvidence);
  const remoteEvidence = parseSkillEvidence(remote.skillEvidence);
  const skillEvidence: Record<string, import('@/lib/types').SkillEvidenceRecord> = {};
  const allEvidenceIds = new Set([
    ...Object.keys(localEvidence),
    ...Object.keys(remoteEvidence),
  ]);
  for (const id of allEvidenceIds) {
    const l = localEvidence[id];
    const r = remoteEvidence[id];
    if (l && r) {
      skillEvidence[id] = mergeSkillEvidence(l, r);
    } else {
      skillEvidence[id] = l ?? r!;
    }
  }
  const currentLearning = local.currentLearning ?? remote.currentLearning ?? null;
  return { passedKnowledgePoints: Array.from(passedSet), stars, mastery, currentLearning, skillEvidence };
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

        if (remoteProgress && hasMeaningfulProgress(remoteProgress)) {
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
          // No meaningful remote progress yet -- push local progress to Supabase
          const localProgress = loadProgress();
          if (hasMeaningfulProgress(localProgress)) {
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

  const markInitialPass = useCallback((kpId: string, stars: number, hasReviewSets: boolean) => {
    setProgress((prev) => markInitialPassUtil(prev, kpId, stars, Date.now(), hasReviewSets));
  }, []);

  const markDelayedReviewPass = useCallback((kpId: string) => {
    setProgress((prev) => markDelayedReviewPassUtil(prev, kpId, Date.now()));
  }, []);

  const markDelayedReviewFail = useCallback((kpId: string) => {
    setProgress((prev) => markDelayedReviewFailUtil(prev, kpId, Date.now()));
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

  const getMasteryStatus = useCallback(
    (kpId: string) => getMasteryStatusUtil(progress, kpId, Date.now()),
    [progress],
  );

  const getDueReviewIds = useCallback(
    () => getDueReviewIdsUtil(progress, Date.now()),
    [progress],
  );

  const getReviewMode = useCallback(
    (kpId: string) => getReviewModeUtil(progress, kpId, Date.now()),
    [progress],
  );

  const setCurrentLearning = useCallback((kpId: string) => {
    setProgress((prev) => setCurrentLearningUtil(prev, kpId));
  }, []);

  const recordSkillEvidence = useCallback((
    skillId: string,
    isCorrect: boolean,
    isFirstTry: boolean,
    evidenceType: EvidenceType,
    mode: 'initial' | 'd1' | 'd7',
  ) => {
    setProgress((prev) => recordSkillEvidenceUtil(prev, skillId, isCorrect, isFirstTry, evidenceType, mode, Date.now()));
  }, []);

  const getSkillDisplayStatus = useCallback(
    (skillId: string) => getSkillDisplayStatusUtil(progress, skillId),
    [progress],
  );

  const hasDirectSkillEvidence = useCallback(
    (skillId: string) => hasDirectSkillEvidenceUtil(progress, skillId),
    [progress],
  );

  const value = useMemo(
    () => ({
      progress,
      markPassed,
      markInitialPass,
      markDelayedReviewPass,
      markDelayedReviewFail,
      isPassed,
      isUnlocked,
      getStars,
      getMasteryStatus,
      getDueReviewIds,
      getReviewMode,
      setCurrentLearning,
      recordSkillEvidence,
      getSkillDisplayStatus,
      hasDirectSkillEvidence,
    }),
    [
      progress,
      markPassed,
      markInitialPass,
      markDelayedReviewPass,
      markDelayedReviewFail,
      isPassed,
      isUnlocked,
      getStars,
      getMasteryStatus,
      getDueReviewIds,
      getReviewMode,
      setCurrentLearning,
      recordSkillEvidence,
      getSkillDisplayStatus,
      hasDirectSkillEvidence,
    ],
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
