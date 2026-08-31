import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type { ProgressData, MasteryStatus, EvidenceType, SkillEvidenceMode, SkillReviewSchedule, ExperimentAssignment, LearningEventName, LearningGoalSource, LanguageSubject } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { supabase, logLearningEvent } from '@/lib/supabase';
import {
  isUnlocked as isUnlockedUtil,
  loadProgress,
  markPassed as markPassedUtil,
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
  parseLearningGoal,
  parseRepairSession,
  mergeLearningGoal,
  mergeRepairSession,
  isSkillReadyForPath as isSkillReadyForPathUtil,
  parseProgress,
  mergeLanguageLessons,
  startLanguageLesson as startLanguageLessonUtil,
  completeLanguageLesson as completeLanguageLessonUtil,
  setLearningGoal as setLearningGoalUtil,
  startRepairSession as startRepairSessionUtil,
  finishRepairSession as finishRepairSessionUtil,
  // v0.3
  scheduleSkillReview as scheduleSkillReviewUtil,
  getDueSkillReviews as getDueSkillReviewsUtil,
  getSkillReviewSchedule as getSkillReviewScheduleUtil,
  parseSkillReviews,
  mergeSkillReviewSchedule,
  setExperimentAssignment as setExperimentAssignmentUtil,
  getEffectiveAssignment as getEffectiveAssignmentUtil,
  mergeExperimentAssignments,
  getHomeTasks as getHomeTasksUtil,
  type HomeTask,
  type SkillDisplayStatus,
  type TransitionEvent,
  DAY_MS,
  // v0.3 atomic transitions
  resolveSkillReviewTransition,
  markInitialPassTransition,
  // v0.3 course intervention
  parseCourseIntervention,
  mergeCourseIntervention,
  startCourseIntervention as startCourseInterventionUtil,
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
  recordSkillEvidence: (skillId: string, isCorrect: boolean, isFirstTry: boolean, evidenceType: EvidenceType, mode: SkillEvidenceMode) => void;
  getSkillDisplayStatus: (skillId: string) => SkillDisplayStatus;
  hasDirectSkillEvidence: (skillId: string) => boolean;
  isSkillReadyForPath: (skillId: string) => boolean;
  // ===== v0.2：目标与补修 =====
  setGoal: (skillId: string, source?: LearningGoalSource) => void;
  startRepair: (skillId: string, targetSkillId: string) => void;
  finishRepair: (skillId: string) => void;
  // ===== v0.3：技能复习 =====
  scheduleSkillReview: (skillId: string, targetSkillId: string, stage: 'd1' | 'd7') => void;
  getDueSkillReviews: () => SkillReviewSchedule[];
  resolveSkillReview: (skillId: string, passed: boolean) => void;
  getSkillReviewSchedule: (skillId: string) => SkillReviewSchedule | undefined;
  // ===== v0.3：实验分组 =====
  setExperimentAssignment: (skillId: string, assignment: ExperimentAssignment) => void;
  getEffectiveAssignment: (skillId: string) => ExperimentAssignment;
  // ===== v0.3：课程干预 =====
  startCourseIntervention: (
    skillId: string,
    targetSkillId: string,
    courseId: string,
    options?: { reviewStage?: 'd1' | 'd7'; nextForm?: 'a' | 'b'; origin?: 'diagnostic' | 'review' },
  ) => void;
  startLanguageLesson: (subject: LanguageSubject, lessonId: string, orderedLessonIds: string[]) => void;
  completeLanguageLesson: (subject: LanguageSubject, lessonId: string, orderedLessonIds: string[]) => void;
  // ===== v0.3：首页任务 =====
  getHomeTasks: () => HomeTask[];
  // ===== v0.3：学习事件 =====
  emitEvent: (params: { clientEventId: string; eventName: LearningEventName; skillId?: string; courseId?: string; mode?: string; variant?: string; passed?: boolean; firstTry?: boolean; durationMs?: number; dueAt?: string; properties?: Record<string, unknown> }) => void;
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
  // Merge learningGoal: use the deterministic merge function with parsed values
  const learningGoal = mergeLearningGoal(
    parseLearningGoal(local.learningGoal),
    parseLearningGoal(remote.learningGoal),
  );
  // Merge repairSession: updatedAt-based merge with completed tombstone tie-break
  const repairSession = mergeRepairSession(
    parseRepairSession(local.repairSession),
    parseRepairSession(remote.repairSession),
  );
  // Merge skillReviews: per-skill deterministic merge
  const localReviews = parseSkillReviews(local.skillReviews);
  const remoteReviews = parseSkillReviews(remote.skillReviews);
  const skillReviews: Record<string, SkillReviewSchedule> = {};
  const allReviewIds = new Set([...Object.keys(localReviews), ...Object.keys(remoteReviews)]);
  for (const id of allReviewIds) {
    const l = localReviews[id];
    const r = remoteReviews[id];
    if (l && r) {
      skillReviews[id] = mergeSkillReviewSchedule(l, r);
    } else {
      skillReviews[id] = l ?? r!;
    }
  }
  // Merge experiment assignments
  const experimentAssignments = mergeExperimentAssignments(
    local.experimentAssignments,
    remote.experimentAssignments,
  );
  // Merge course intervention
  const courseIntervention = mergeCourseIntervention(
    parseCourseIntervention(local.courseIntervention),
    parseCourseIntervention(remote.courseIntervention),
  );
  const languageLessons = mergeLanguageLessons(local.languageLessons, remote.languageLessons);
  return {
    passedKnowledgePoints: Array.from(passedSet),
    stars,
    mastery,
    currentLearning,
    skillEvidence,
    learningGoal,
    repairSession,
    skillReviews: Object.keys(skillReviews).length > 0 ? skillReviews : undefined,
    experimentAssignments,
    courseIntervention,
    languageLessons: Object.keys(languageLessons).length > 0 ? languageLessons : undefined,
  };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [progress, setProgress] = useState<ProgressData>(() => loadProgress(userId));
  const progressRef = useRef(progress);
  progressRef.current = progress;

  // Track whether we've done the initial sync for the current user
  const hasSyncedRef = useRef(false);
  const syncReadyUserIdRef = useRef<string | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  // When user changes (login/logout), sync remote progress
  useEffect(() => {
    // Reset sync flag when user changes
    if (userId !== prevUserIdRef.current) {
      hasSyncedRef.current = false;
      syncReadyUserIdRef.current = null;
      prevUserIdRef.current = userId ?? null;
    }

    if (!userId || hasSyncedRef.current) return;

    hasSyncedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        // Load remote progress from profiles table
        const { data: profile, error: readError } = await supabase
          .from('profiles')
          .select('progress')
          .eq('id', userId)
          .single();
        if (readError) throw readError;
        if (cancelled) return;

        const localProgress = progressRef.current;
        const remoteProgress = parseProgress(profile?.progress);
        const merged = hasMeaningfulProgress(remoteProgress)
          ? mergeProgress(localProgress, remoteProgress)
          : localProgress;
        progressRef.current = merged;
        setProgress(merged);
        saveProgress(merged, userId);

        if (hasMeaningfulProgress(merged)) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ progress: merged })
            .eq('id', userId);
          if (updateError) {
            console.error('[ProgressSync] Failed to save merged progress:', updateError);
          }
        }
        if (cancelled) return;
        syncReadyUserIdRef.current = userId;

        // A lesson may finish while the first merged UPDATE is in flight.
        // Write that newer snapshot once so it does not wait for another user action.
        const latestProgress = progressRef.current;
        if (latestProgress !== merged && hasMeaningfulProgress(latestProgress)) {
          const { error: latestUpdateError } = await supabase
            .from('profiles')
            .update({ progress: latestProgress })
            .eq('id', userId);
          if (latestUpdateError) {
            console.error('[ProgressSync] Failed to save newer progress:', latestUpdateError);
          }
        }
      } catch (err) {
        console.error('[ProgressSync] Failed to sync on login:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 进度变化时自动持久化（防抖）+ sync to Supabase
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProgress(progress, userId);

      // Never overwrite an unknown remote snapshot before the initial read/merge succeeds.
      if (userId && syncReadyUserIdRef.current === userId) {
        supabase
          .from('profiles')
          .update({ progress })
          .eq('id', userId)
          .then(({ error }) => {
            if (error) {
              console.error('[ProgressSync] Failed to save progress to Supabase:', error);
            }
          });
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [progress, userId]);

  // Internal event emitter — stable reference, auth-gated. Used by transition methods.
  const emitEventInternal = useCallback((evt: TransitionEvent) => {
    if (!user) return;
    logLearningEvent({ userId: user.id, ...evt });
  }, [user]);

  const markPassed = useCallback((kpId: string, stars: number) => {
    setProgress((prev) => markPassedUtil(prev, kpId, stars));
  }, []);

  const markInitialPass = useCallback((kpId: string, stars: number, hasReviewSets: boolean) => {
    const now = Date.now();
    const result = markInitialPassTransition(progress, kpId, stars, now, hasReviewSets);
    setProgress(result.progress);
    for (const evt of result.events) {
      emitEventInternal(evt);
    }
  }, [progress, emitEventInternal]);

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

  const startLanguageLesson = useCallback((
    subject: LanguageSubject,
    lessonId: string,
    orderedLessonIds: string[],
  ) => {
    setProgress((prev) => startLanguageLessonUtil(prev, subject, lessonId, orderedLessonIds, Date.now()));
  }, []);

  const completeLanguageLesson = useCallback((
    subject: LanguageSubject,
    lessonId: string,
    orderedLessonIds: string[],
  ) => {
    setProgress((prev) => completeLanguageLessonUtil(prev, subject, lessonId, orderedLessonIds, Date.now()));
  }, []);

  const recordSkillEvidence = useCallback((
    skillId: string,
    isCorrect: boolean,
    isFirstTry: boolean,
    evidenceType: EvidenceType,
    mode: SkillEvidenceMode,
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

  const isSkillReadyForPath = useCallback(
    (skillId: string) => isSkillReadyForPathUtil(progress, skillId, Date.now()),
    [progress],
  );

  const setGoal = useCallback((skillId: string, source: LearningGoalSource = 'map') => {
    const now = Date.now();
    const prevGoal = progress.learningGoal;
    // 只有真正切换目标或来源时才写 learning_goal_started，避免重复目标重复上报。
    const changed = !prevGoal || prevGoal.skillId !== skillId || prevGoal.source !== source;
    setProgress((prev) => setLearningGoalUtil(prev, skillId, now, source));
    if (changed) {
      // clientEventId 含时间戳：每次真正切换目标/来源都产生一个新事件，不记录任何 PII。
      emitEventInternal({
        clientEventId: `lg:${skillId}:${source}:${now}`,
        eventName: 'learning_goal_started',
        skillId,
        properties: { source },
      });
    }
  }, [progress, emitEventInternal]);

  const startRepair = useCallback((skillId: string, targetSkillId: string) => {
    setProgress((prev) => startRepairSessionUtil(prev, skillId, targetSkillId, Date.now()));
  }, []);

  const finishRepair = useCallback((skillId: string) => {
    setProgress((prev) => finishRepairSessionUtil(prev, skillId, Date.now()));
  }, []);

  // ===== v0.3 =====

  const scheduleSkillReview = useCallback((skillId: string, targetSkillId: string, stage: 'd1' | 'd7') => {
    const now = Date.now();
    setProgress((prev) => scheduleSkillReviewUtil(prev, skillId, targetSkillId, stage, now));
    // Emit skill_review_scheduled with the same timestamp used for the schedule
    const dueAt = stage === 'd1' ? now + DAY_MS : now + 6 * DAY_MS;
    emitEventInternal({
      clientEventId: `srs:${skillId}:${stage}:${now}`,
      eventName: 'skill_review_scheduled',
      skillId,
      mode: stage,
      dueAt: new Date(dueAt).toISOString(),
      properties: {
        reviewCycleId: `rc:${skillId}:${stage}:a:${now}`,
        attemptNo: 1,
        firstExposure: true,
        evidenceEligible: true,
        formId: 'a',
      },
    });
  }, [emitEventInternal]);

  const getDueSkillReviews = useCallback(
    () => getDueSkillReviewsUtil(progress, Date.now()),
    [progress],
  );

  const resolveSkillReview = useCallback((skillId: string, passed: boolean) => {
    const now = Date.now();
    const result = resolveSkillReviewTransition(progress, skillId, passed, now);
    setProgress(result.progress);
    for (const evt of result.events) {
      emitEventInternal(evt);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, emitEventInternal]);

  const getSkillReviewSchedule = useCallback(
    (skillId: string) => getSkillReviewScheduleUtil(progress, skillId),
    [progress],
  );

  const setExperimentAssignment = useCallback((skillId: string, assignment: ExperimentAssignment) => {
    setProgress((prev) => setExperimentAssignmentUtil(prev, skillId, assignment));
  }, []);

  const getEffectiveAssignment = useCallback(
    (skillId: string) => getEffectiveAssignmentUtil(progress, user?.id ?? null, skillId),
    [progress, user],
  );

  const getHomeTasks = useCallback(
    () => getHomeTasksUtil(progress, getDueReviewIdsUtil(progress, Date.now()), Date.now()),
    [progress],
  );

  // ===== v0.3: Course Intervention =====

  const startCourseIntervention = useCallback((
    skillId: string,
    targetSkillId: string,
    courseId: string,
    options?: { reviewStage?: 'd1' | 'd7'; nextForm?: 'a' | 'b'; origin?: 'diagnostic' | 'review' },
  ) => {
    setProgress((prev) => startCourseInterventionUtil(prev, skillId, targetSkillId, courseId, Date.now(), options));
  }, []);

  // ===== v0.3: Event logging =====

  const emitEvent = useCallback((params: {
    clientEventId: string;
    eventName: LearningEventName;
    skillId?: string;
    courseId?: string;
    mode?: string;
    variant?: string;
    passed?: boolean;
    firstTry?: boolean;
    durationMs?: number;
    dueAt?: string;
    properties?: Record<string, unknown>;
  }) => {
    emitEventInternal(params as TransitionEvent);
  }, [emitEventInternal]);

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
      startLanguageLesson,
      completeLanguageLesson,
      recordSkillEvidence,
      getSkillDisplayStatus,
      hasDirectSkillEvidence,
      isSkillReadyForPath,
      setGoal,
      startRepair,
      finishRepair,
      // v0.3
      scheduleSkillReview,
      getDueSkillReviews,
      resolveSkillReview,
      getSkillReviewSchedule,
      setExperimentAssignment,
      getEffectiveAssignment,
      // v0.3 course intervention
      startCourseIntervention,
      getHomeTasks,
      emitEvent,
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
      startLanguageLesson,
      completeLanguageLesson,
      recordSkillEvidence,
      getSkillDisplayStatus,
      hasDirectSkillEvidence,
      isSkillReadyForPath,
      setGoal,
      startRepair,
      finishRepair,
      scheduleSkillReview,
      getDueSkillReviews,
      resolveSkillReview,
      getSkillReviewSchedule,
      setExperimentAssignment,
      getEffectiveAssignment,
      startCourseIntervention,
      getHomeTasks,
      emitEvent,
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
