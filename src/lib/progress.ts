import type { ProgressData, MasteryStatus, MasteryRecord, SkillEvidenceRecord, EvidenceType } from './types';

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

    // Validate skillEvidence via unified parser (no duplicate field logic)
    const skillEvidence = parseSkillEvidence(parsed.skillEvidence);

    return { passedKnowledgePoints, stars, mastery, currentLearning, skillEvidence };
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

// ===== 技能证据 =====

const VALID_MODES = new Set<string>(['initial', 'd1', 'd7']);
const VALID_EVIDENCE_TYPES = new Set<string>(['conceptual', 'procedural', 'transfer', 'retention']);

/**
 * 规范化计数不变量：
 * - correct <= attempts
 * - firstTryCorrect <= correct
 * - conceptual <= correct, procedural <= correct
 * - transfer <= firstTryCorrect, retention <= firstTryCorrect
 *   (transfer/retention 只累计"正确且首次无提示正确"的直接证据)
 */
function normalizeInvariants(r: SkillEvidenceRecord): SkillEvidenceRecord {
  const attempts = Math.max(0, Math.floor(r.attempts));
  const correct = Math.max(0, Math.min(Math.floor(r.correct), attempts));
  const firstTryCorrect = Math.max(0, Math.min(Math.floor(r.firstTryCorrect), correct));
  const conceptual = Math.max(0, Math.min(Math.floor(r.conceptual), correct));
  const procedural = Math.max(0, Math.min(Math.floor(r.procedural), correct));
  const transfer = Math.max(0, Math.min(Math.floor(r.transfer), firstTryCorrect));
  const retention = Math.max(0, Math.min(Math.floor(r.retention), firstTryCorrect));
  return {
    attempts,
    correct,
    firstTryCorrect,
    conceptual,
    procedural,
    transfer,
    retention,
    lastAttemptAt: Math.max(0, Math.floor(r.lastAttemptAt)),
    lastMode: r.lastMode,
  };
}

/**
 * 校验并规范化单个技能证据记录（不信任外部数据源）。
 */
export function validateSkillEvidence(raw: unknown): SkillEvidenceRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, fallback = 0): number =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
  const mode = VALID_MODES.has(r.lastMode as string) ? (r.lastMode as SkillEvidenceRecord['lastMode']) : 'initial';
  return normalizeInvariants({
    attempts: num(r.attempts),
    correct: num(r.correct),
    firstTryCorrect: num(r.firstTryCorrect),
    conceptual: num(r.conceptual),
    procedural: num(r.procedural),
    transfer: num(r.transfer),
    retention: num(r.retention),
    lastAttemptAt: num(r.lastAttemptAt),
    lastMode: mode,
  });
}

/**
 * 记录一次技能证据（题目首次提交时调用，重渲染不重复调用由调用方保证）。
 * 不保存学生原始答案。
 *
 * @param progress 当前进度
 * @param skillId 主技能 ID
 * @param isCorrect 是否正确
 * @param isFirstTry 是否首次无提示正确
 * @param evidenceType 证据类型
 * @param mode 当前模式（initial/d1/d7）
 * @param now 当前时间戳
 */
export function recordSkillEvidence(
  progress: ProgressData,
  skillId: string,
  isCorrect: boolean,
  isFirstTry: boolean,
  evidenceType: EvidenceType,
  mode: 'initial' | 'd1' | 'd7',
  now: number,
): ProgressData {
  const existing = progress.skillEvidence?.[skillId];
  const prev: SkillEvidenceRecord = existing ?? {
    attempts: 0,
    correct: 0,
    firstTryCorrect: 0,
    conceptual: 0,
    procedural: 0,
    transfer: 0,
    retention: 0,
    lastAttemptAt: 0,
    lastMode: 'initial',
  };

  const typeKey = evidenceType as 'conceptual' | 'procedural' | 'transfer' | 'retention';
  const updated: SkillEvidenceRecord = {
    attempts: prev.attempts + 1,
    correct: prev.correct + (isCorrect ? 1 : 0),
    firstTryCorrect: prev.firstTryCorrect + (isCorrect && isFirstTry ? 1 : 0),
    conceptual: prev.conceptual + (isCorrect && typeKey === 'conceptual' ? 1 : 0),
    procedural: prev.procedural + (isCorrect && typeKey === 'procedural' ? 1 : 0),
    // transfer/retention 只累计"正确且首次无提示正确"的直接证据
    transfer: prev.transfer + (isCorrect && isFirstTry && typeKey === 'transfer' ? 1 : 0),
    retention: prev.retention + (isCorrect && isFirstTry && typeKey === 'retention' ? 1 : 0),
    lastAttemptAt: now,
    lastMode: mode,
  };

  return {
    ...progress,
    skillEvidence: {
      ...(progress.skillEvidence ?? {}),
      [skillId]: updated,
    },
  };
}

/**
 * 技能显示状态派生——由直接题目证据推导，不由下游课程完成自动点亮。
 *
 * 状态：
 * - 'not_started'  无任何证据
 * - 'in_progress'  有尝试但无正确
 * - 'provisional'  初始学习中正确过（当堂会），时间窗口内
 * - 'review_due'   provisional 过期或 D7 未满足 stable
 * - 'stable'       transfer 首次正确 + retention 首次正确
 * - 'needs_remediation' 连续/累计失败（attempts >= 3 且正确率 < 40%）
 */
export type SkillDisplayStatus =
  | 'not_started'
  | 'in_progress'
  | 'provisional'
  | 'review_due'
  | 'stable'
  | 'needs_remediation';

/**
 * @param now 当前时间戳（可注入用于测试），默认 Date.now()
 */
export function getSkillDisplayStatus(
  progress: ProgressData,
  skillId: string,
  now: number = Date.now(),
): SkillDisplayStatus {
  const ev = progress.skillEvidence?.[skillId];
  if (!ev || ev.attempts === 0) return 'not_started';

  // 需补修：多次尝试但正确率低
  if (ev.attempts >= 3 && ev.correct / ev.attempts < 0.4) return 'needs_remediation';

  // 已稳固：transfer 与 retention 均有首次正确直接证据
  // （两者本身即代表该类型首次正确，不需额外检查 firstTryCorrect）
  if (ev.transfer > 0 && ev.retention > 0) return 'stable';

  // 无任何正确
  if (ev.correct === 0) return 'in_progress';

  // 时间语义：根据最后证据的模式判断 provisional / review_due
  const elapsed = now - ev.lastAttemptAt;
  if (ev.lastMode === 'initial') {
    // 初始正确证据：1 天内 provisional，1 天后 review_due
    return elapsed < DAY_MS ? 'provisional' : 'review_due';
  }
  if (ev.lastMode === 'd1') {
    // D1 正确证据：6 天内 provisional，6 天后 review_due
    return elapsed < 6 * DAY_MS ? 'provisional' : 'review_due';
  }
  // lastMode === 'd7' 且未达到 stable
  return 'review_due';
}

/**
 * 是否有直接技能证据（至少一次正确答题）。
 */
export function hasDirectSkillEvidence(progress: ProgressData, skillId: string): boolean {
  const ev = progress.skillEvidence?.[skillId];
  return !!ev && ev.correct > 0;
}

/**
 * 确定性合并两个 SkillEvidenceRecord（幂等）。
 *
 * 在没有事件 ID 的 P0 里，本地与远端通常是同一累计快照，
 * 各单调累计计数使用 Math.max 合并避免翻倍；
 * lastAttemptAt 取较新，lastMode 取较新记录的 mode。
 */
export function mergeSkillEvidence(
  a: SkillEvidenceRecord,
  b: SkillEvidenceRecord,
): SkillEvidenceRecord {
  const merged: SkillEvidenceRecord = {
    attempts: Math.max(a.attempts, b.attempts),
    correct: Math.max(a.correct, b.correct),
    firstTryCorrect: Math.max(a.firstTryCorrect, b.firstTryCorrect),
    conceptual: Math.max(a.conceptual, b.conceptual),
    procedural: Math.max(a.procedural, b.procedural),
    transfer: Math.max(a.transfer, b.transfer),
    retention: Math.max(a.retention, b.retention),
    lastAttemptAt: Math.max(a.lastAttemptAt, b.lastAttemptAt),
    lastMode: a.lastAttemptAt >= b.lastAttemptAt ? a.lastMode : b.lastMode,
  };
  return normalizeInvariants(merged);
}

/**
 * 校验并解析 skillEvidence 字段（不信任外部数据）。
 */
export function parseSkillEvidence(
  raw: unknown,
): Record<string, SkillEvidenceRecord> {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<string, SkillEvidenceRecord> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k !== 'string') continue;
    const validated = validateSkillEvidence(v);
    if (validated) result[k] = validated;
  }
  return result;
}

export { VALID_EVIDENCE_TYPES };

// ===== 有意义进度判断 =====

/**
 * 判断进度数据是否包含有意义的学习内容。
 * 用于登录同步：不再只看 passedKnowledgePoints.length，
 * 而是综合判断 passed / stars / mastery / currentLearning / skillEvidence。
 */
export function hasMeaningfulProgress(progress: ProgressData): boolean {
  if (progress.passedKnowledgePoints?.length > 0) return true;
  const stars = progress.stars ?? {};
  if (Object.values(stars).some((v) => v > 0)) return true;
  const mastery = progress.mastery ?? {};
  if (Object.keys(mastery).length > 0) return true;
  if (progress.currentLearning) return true;
  const skillEvidence = progress.skillEvidence ?? {};
  for (const ev of Object.values(skillEvidence)) {
    if (ev.attempts > 0) return true;
  }
  return false;
}
