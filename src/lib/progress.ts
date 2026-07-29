import type { ProgressData } from './types';

const STORAGE_KEY = 'math-k6-progress';

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

    return { passedKnowledgePoints, stars };
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
