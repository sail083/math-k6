import type { ProgressData, MasteryStatus, MasteryRecord } from './types';

const STORAGE_KEY = 'math-k6-progress';
const DAY_MS = 86_400_000;

const defaultProgress: ProgressData = {
  passedKnowledgePoints: [],
  stars: {},
};

/** 从 localStorage 加载进度数据 */
export function loadProgress(): ProgressData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...defaultProgress };
    const parsed = JSON.parse(stored);

    // Validate passedKnowledgePoints is an array of strings
    const passedKnowledgePoints = Array.isArray(parsed.passedKnowledgePoints)
      ? parsed.passedKnowledgePoints.filter((x: unknown): x is string => typeof x === 'string')
      : [];

    // Validate stars values are numbers in range 0-3
    const rawStars = (parsed.stars ?? {}) as Record<string, unknown>;
    const stars: Record<string, number> = {};
    for (const [k, v] of Object.entries(rawStars)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        stars[k] = Math.max(0, Math.min(3, Math.floor(v)));
      }
    }

    // Validate mastery records (optional — old data has none)
    const rawMastery = (parsed.mastery ?? {}) as Record<string, unknown>;
    const mastery: Record<string, MasteryRecord> = {};
    for (const [k, v] of Object.entries(rawMastery)) {
      if (v && typeof v === 'object') {
        const r = v as Record<string, unknown>;
        const status = r.status as MasteryStatus;
        if (status === 'learning' || status === 'provisional' || status === 'review_due' || status === 'stable') {
          mastery[k] = {
            status,
            lastAttemptAt: typeof r.lastAttemptAt === 'number' ? r.lastAttemptAt : 0,
            nextReviewAt: typeof r.nextReviewAt === 'number' ? r.nextReviewAt : 0,
            delayedReviewCount: typeof r.delayedReviewCount === 'number' ? Math.max(0, Math.min(2, Math.floor(r.delayedReviewCount))) : 0,
          };
        }
      }
    }

    // Validate currentLearning (optional resume target)
    const currentLearning = typeof parsed.currentLearning === 'string' ? parsed.currentLearning : null;

    return { passedKnowledgePoints, stars, mastery, currentLearning };
  } catch {
    return { ...defaultProgress };
  }
}

/** 将进度数据保存到 localStorage */
export function saveProgress(progress: ProgressData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

/** 标记某知识点为已通过，保留最高星数 */
export function markPassed(progress: ProgressData, kpId: string, stars: number): ProgressData {
  const newProgress = { ...progress };
  if (!newProgress.passedKnowledgePoints.includes(kpId)) {
    newProgress.passedKnowledgePoints = [...newProgress.passedKnowledgePoints, kpId];
  }
  // 保留最高星级
  const currentStars = newProgress.stars[kpId] ?? 0;
  if (stars > currentStars) {
    newProgress.stars = { ...newProgress.stars, [kpId]: stars };
  }
  return newProgress;
}

/** 判断某知识点是否已通过 */
export function isPassed(progress: ProgressData, kpId: string): boolean {
  return progress.passedKnowledgePoints.includes(kpId);
}

/** 获取某知识点的星数 */
export function getStars(progress: ProgressData, kpId: string): number {
  return progress.stars[kpId] ?? 0;
}

/**
 * 判断课程是否可以学习。
 *
 * prerequisites 描述知识依赖，用于推荐学习顺序，不应成为访问门槛。
 * 小学生可能按不同教材版本、学校进度或复习需要跳学，因此课程始终开放。
 */
export function isUnlocked(
  _progress: ProgressData,
  _prerequisites: string[],
): boolean {
  return true;
}

/** 计算总体进度（0-1） */
export function getOverallProgress(
  progress: ProgressData,
  totalKnowledgePoints: number,
): number {
  if (totalKnowledgePoints === 0) return 0;
  return progress.passedKnowledgePoints.length / totalKnowledgePoints;
}

// ===== 掌握状态（mastery loop）=====

/**
 * 推导某个知识点在给定时间点的有效掌握状态。
 * - 无掌握记录 -> null（一次性通过或未学过）
 * - stable -> stable
 * - provisional 且 nextReviewAt <= now -> review_due
 * - 否则 -> 记录中的状态
 */
export function getMasteryStatus(
  progress: ProgressData,
  kpId: string,
  now: number,
): MasteryStatus | null {
  const record = progress.mastery?.[kpId];
  if (!record) return null;
  if (record.status === 'stable') return 'stable';
  if (record.status === 'provisional' && record.nextReviewAt <= now) return 'review_due';
  return record.status;
}

/**
 * 标记初次通过：加入 passedKnowledgePoints + stars，
 * 若课程有复习题集则创建 provisional 掌握记录，D1 复习在 1 天后到期。
 */
export function markInitialPass(
  progress: ProgressData,
  kpId: string,
  stars: number,
  now: number,
  hasReviewSets: boolean,
): ProgressData {
  const p = markPassed(progress, kpId, stars);
  if (!hasReviewSets) {
    return { ...p, currentLearning: p.currentLearning === kpId ? null : p.currentLearning };
  }
  const mastery = p.mastery ? { ...p.mastery } : {};
  // If a mastery record already exists, preserve existing status/count/schedule
  // to avoid downgrading stable or erasing a completed D1.
  if (!mastery[kpId]) {
    mastery[kpId] = {
      status: 'provisional',
      lastAttemptAt: now,
      nextReviewAt: now + DAY_MS,
      delayedReviewCount: 0,
    };
  }
  return { ...p, mastery, currentLearning: p.currentLearning === kpId ? null : p.currentLearning };
}

/**
 * 标记延迟复习通过：
 * - 第 1 次复习通过（count 0→1）：provisional，下次复习 6 天后
 * - 第 2 次复习通过（count 1→2）：stable
 */
export function markDelayedReviewPass(
  progress: ProgressData,
  kpId: string,
  now: number,
): ProgressData {
  const record = progress.mastery?.[kpId];
  if (!record || record.delayedReviewCount >= 2) return progress;
  const mastery = { ...progress.mastery! };
  const newCount = record.delayedReviewCount + 1;
  if (newCount >= 2) {
    mastery[kpId] = {
      status: 'stable',
      lastAttemptAt: now,
      nextReviewAt: 0,
      delayedReviewCount: 2,
    };
  } else {
    mastery[kpId] = {
      status: 'provisional',
      lastAttemptAt: now,
      nextReviewAt: now + 6 * DAY_MS,
      delayedReviewCount: 1,
    };
  }
  return { ...progress, mastery };
}

/**
 * 标记延迟复习未通过：保持 review_due（provisional + nextReviewAt 在过去）。
 */
export function markDelayedReviewFail(
  progress: ProgressData,
  kpId: string,
  now: number,
): ProgressData {
  const record = progress.mastery?.[kpId];
  if (!record) return progress;
  const mastery = { ...progress.mastery! };
  mastery[kpId] = {
    ...record,
    lastAttemptAt: now,
  };
  return { ...progress, mastery };
}

/** 列出当前到期需要复习的知识点 ID */
export function getDueReviewIds(progress: ProgressData, now: number): string[] {
  if (!progress.mastery) return [];
  return Object.keys(progress.mastery).filter(
    (id) => getMasteryStatus(progress, id, now) === 'review_due',
  );
}

/**
 * 判断某个知识点应使用哪套复习题（D1 或 D7）。
 * 仅当有效状态为 review_due 时返回 'd1'（首次复习）或 'd7'（第二次复习）。
 */
export function getReviewMode(
  progress: ProgressData,
  kpId: string,
  now: number,
): 'd1' | 'd7' | null {
  const status = getMasteryStatus(progress, kpId, now);
  if (status !== 'review_due') return null;
  const record = progress.mastery?.[kpId];
  if (!record) return null;
  return record.delayedReviewCount === 0 ? 'd1' : 'd7';
}

/** 设置当前学习中课程（恢复目标） */
export function setCurrentLearning(
  progress: ProgressData,
  kpId: string,
): ProgressData {
  return { ...progress, currentLearning: kpId };
}

/** 获取当前学习中课程 ID */
export function getCurrentLearning(progress: ProgressData): string | null {
  return progress.currentLearning ?? null;
}

/**
 * Deterministic mastery record merge:
 * 1. stable always wins
 * 2. higher delayedReviewCount wins
 * 3. for equal stage/count, newer lastAttemptAt wins
 */
export function pickBetterMastery(
  a: MasteryRecord,
  b: MasteryRecord,
): MasteryRecord {
  if (a.status === 'stable' && b.status !== 'stable') return a;
  if (b.status === 'stable' && a.status !== 'stable') return b;
  if (a.delayedReviewCount !== b.delayedReviewCount) {
    return a.delayedReviewCount > b.delayedReviewCount ? a : b;
  }
  return a.lastAttemptAt >= b.lastAttemptAt ? a : b;
}
