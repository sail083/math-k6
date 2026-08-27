import type { ProgressData, MasteryStatus, MasteryRecord, SkillEvidenceRecord, EvidenceType, SkillEvidenceMode, SkillReviewSchedule, ExperimentAssignment, CourseIntervention, LearningEventName, LearningGoalSource } from './types';

const STORAGE_KEY = 'math-k6-progress';
export const DAY_MS = 86_400_000;

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

    // Validate learningGoal (optional v0.2 field)
    const learningGoal = parseLearningGoal(parsed.learningGoal);

    // Validate repairSession (optional v0.2 field)
    const repairSession = parseRepairSession(parsed.repairSession);

    // Validate skillReviews (optional v0.3 field)
    const skillReviews = parseSkillReviews(parsed.skillReviews);

    // Validate experimentAssignments (optional v0.3 field)
    const experimentAssignments = parseExperimentAssignments(parsed.experimentAssignments);

    // Validate courseIntervention (optional v0.3 field)
    const courseIntervention = parseCourseIntervention(parsed.courseIntervention);

    return { passedKnowledgePoints, stars, mastery, currentLearning, skillEvidence, learningGoal, repairSession, skillReviews: Object.keys(skillReviews).length > 0 ? skillReviews : undefined, experimentAssignments, courseIntervention };
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

const VALID_MODES = new Set<string>(['initial', 'd1', 'd7', 'repair']);
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
  mode: SkillEvidenceMode,
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

  // 无任何正确
  if (ev.correct === 0) return 'in_progress';

  // 时间语义：根据最后证据的模式判断 provisional / review_due
  const elapsed = now - ev.lastAttemptAt;
  if (ev.lastMode === 'repair') {
    // 补修通过证据：1 天内 provisional，1 天后 review_due；不得直接 stable
    return elapsed < DAY_MS ? 'provisional' : 'review_due';
  }

  // 已稳固：transfer 与 retention 均有首次正确直接证据
  // 仅在非 repair 模式下可达 stable，避免 repair 通过后直接绕过 review
  if (ev.transfer > 0 && ev.retention > 0) return 'stable';

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

// ===== 路径准备度 =====

/**
 * 判断某个技能在路径上是否"已准备好"。
 * - stable → ready
 * - provisional + 有直接 firstTry transfer 证据 → ready
 * - 其他状态（review_due, needs_remediation, in_progress, not_started）→ not ready
 */
export function isSkillReadyForPath(
  progress: ProgressData,
  skillId: string,
  now: number = Date.now(),
): boolean {
  const status = getSkillDisplayStatus(progress, skillId, now);
  if (status === 'stable') return true;
  if (status === 'provisional') {
    const ev = progress.skillEvidence?.[skillId];
    if (ev && ev.transfer > 0) return true;
  }
  return false;
}

// ===== 学习目标与补修会话 =====

/** 设置学习目标（忽略更早的更新）。source 默认 map；同一目标重复设置保留 startedAt，只更新 updatedAt/source。 */
export function setLearningGoal(
  progress: ProgressData,
  skillId: string,
  now: number,
  source: LearningGoalSource = 'map',
): ProgressData {
  const existing = progress.learningGoal;
  if (existing && existing.updatedAt > now) return progress;
  if (existing && existing.skillId === skillId) {
    return {
      ...progress,
      learningGoal: {
        skillId,
        startedAt: Number.isFinite(existing.startedAt) && existing.startedAt >= 0
          ? existing.startedAt
          : existing.updatedAt,
        updatedAt: now,
        source,
      },
    };
  }
  return { ...progress, learningGoal: { skillId, startedAt: now, updatedAt: now, source } };
}

/** 开始补修会话（同时保留/更新目标） */
export function startRepairSession(
  progress: ProgressData,
  skillId: string,
  targetSkillId: string,
  now: number,
): ProgressData {
  const existing = progress.learningGoal;
  const source: LearningGoalSource = existing && existing.skillId === targetSkillId ? existing.source : 'map';
  const updated = setLearningGoal(progress, targetSkillId, now, source);
  return {
    ...updated,
    repairSession: { skillId, targetSkillId, status: 'active', updatedAt: now },
  };
}

/** 结束补修会话（completed tombstone） */
export function finishRepairSession(progress: ProgressData, skillId: string, now: number): ProgressData {
  const existing = progress.repairSession;
  if (!existing || existing.skillId !== skillId) return progress;
  return {
    ...progress,
    repairSession: { ...existing, status: 'completed', updatedAt: now },
  };
}

// ===== 有意义进度判断 =====

/**
 * 解析并校验 learningGoal 字段（不信任外部数据）。
 * 返回合法对象或 undefined。
 */
export function parseLearningGoal(raw: unknown): ProgressData['learningGoal'] {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.skillId !== 'string' || r.skillId.trim() === '') return undefined;
  if (typeof r.updatedAt !== 'number' || !Number.isFinite(r.updatedAt) || r.updatedAt < 0) return undefined;
  // Backward-compatible: old data {skillId, updatedAt} has no startedAt/source — backfill
  // startedAt from updatedAt and default source to 'map'. Invalid source fails closed to 'map'.
  const startedAt = typeof r.startedAt === 'number' && Number.isFinite(r.startedAt) && r.startedAt >= 0
    ? r.startedAt
    : r.updatedAt;
  const source: LearningGoalSource = r.source === 'home' || r.source === 'map' || r.source === 'course'
    ? r.source
    : 'map';
  return { skillId: r.skillId, startedAt, updatedAt: r.updatedAt, source };
}

/**
 * 解析并校验 repairSession 字段（不信任外部数据）。
 * 返回合法对象或 undefined。
 */
export function parseRepairSession(raw: unknown): ProgressData['repairSession'] {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.skillId !== 'string' || r.skillId.trim() === '') return undefined;
  if (typeof r.targetSkillId !== 'string' || r.targetSkillId.trim() === '') return undefined;
  if (r.status !== 'active' && r.status !== 'completed') return undefined;
  if (typeof r.updatedAt !== 'number' || !Number.isFinite(r.updatedAt) || r.updatedAt < 0) return undefined;
  return {
    skillId: r.skillId,
    targetSkillId: r.targetSkillId,
    status: r.status,
    updatedAt: r.updatedAt,
  };
}

/**
 * 合并两个 learningGoal 记录（确定性，可测试）。
 * 更新时间更新的记录胜；相同时间前者胜（保持原有可预测规则）。
 * 若两记录指向同一目标，保留最早 startedAt、最新 updatedAt，source 取较新记录，避免丢失字段。
 */
export function mergeLearningGoal(
  a: ProgressData['learningGoal'],
  b: ProgressData['learningGoal'],
): ProgressData['learningGoal'] {
  if (!a && !b) return undefined;
  if (!a) return b;
  if (!b) return a;
  if (a.skillId === b.skillId) {
    const newer = a.updatedAt >= b.updatedAt ? a : b;
    return {
      skillId: a.skillId,
      startedAt: Math.min(a.startedAt, b.startedAt),
      updatedAt: Math.max(a.updatedAt, b.updatedAt),
      source: newer.source,
    };
  }
  return a.updatedAt >= b.updatedAt ? a : b;
}

/**
 * 合并两个 repairSession 记录（确定性，可测试）。
 *
 * 规则：
 * 1. 比较 updatedAt，更新记录胜。
 * 2. 相同 updatedAt 时，completed 胜（防止同一旧 active 复活）。
 */
export function mergeRepairSession(
  a: ProgressData['repairSession'],
  b: ProgressData['repairSession'],
): ProgressData['repairSession'] {
  if (!a && !b) return undefined;
  if (!a) return b;
  if (!b) return a;
  if (a.updatedAt === b.updatedAt) {
    // Tie-break: completed wins to prevent old active from reviving
    return (a.status === 'completed' || b.status === 'completed')
      ? (a.status === 'completed' ? a : b)
      : a;
  }
  return a.updatedAt > b.updatedAt ? a : b;
}

/**
 * 判断进度数据是否包含有意义的学习内容。
 * 用于登录同步：不再只看 passedKnowledgePoints.length，
 * 而是综合判断 passed / stars / mastery / currentLearning / skillEvidence / goal / repair。
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
  if (progress.learningGoal) return true;
  if (progress.repairSession?.status === 'active') return true;
  if (progress.skillReviews && Object.keys(progress.skillReviews).length > 0) return true;
  if (progress.courseIntervention) return true;
  // F15: non-empty experimentAssignments count as meaningful for sync completeness
  const experimentAssignments = progress.experimentAssignments ?? {};
  if (Object.keys(experimentAssignments).length > 0) return true;
  return false;
}

// ===== v0.3：技能复习调度 =====

const REVIEW_CONTENT_VERSION = '0.3.0';

/**
 * 校验并解析 skillReviews 字段（不信任外部数据）。
 */
export function parseSkillReviews(
  raw: unknown,
): Record<string, SkillReviewSchedule> {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<string, SkillReviewSchedule> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k !== 'string') continue;
    if (!v || typeof v !== 'object') continue;
    const r = v as Record<string, unknown>;
    if (typeof r.skillId !== 'string' || r.skillId.trim() === '') continue;
    if (typeof r.targetSkillId !== 'string' || r.targetSkillId.trim() === '') continue;
    if (r.stage !== 'd1' && r.stage !== 'd7') continue;
    if (r.status !== 'scheduled' && r.status !== 'due' && r.status !== 'passed' && r.status !== 'failed') continue;
    if (typeof r.dueAt !== 'number' || !Number.isFinite(r.dueAt) || r.dueAt < 0) continue;
    if (typeof r.updatedAt !== 'number' || !Number.isFinite(r.updatedAt) || r.updatedAt < 0) continue;
    result[k] = {
      skillId: r.skillId,
      targetSkillId: r.targetSkillId,
      stage: r.stage,
      status: r.status,
      dueAt: r.dueAt,
      updatedAt: r.updatedAt,
      contentVersion: typeof r.contentVersion === 'string' ? r.contentVersion : REVIEW_CONTENT_VERSION,
      firstExposure: r.firstExposure === true,
      formId: r.formId === 'b' ? 'b' : 'a',
      attemptNo: typeof r.attemptNo === 'number' && Number.isFinite(r.attemptNo) && r.attemptNo >= 1
        ? Math.floor(r.attemptNo)
        : 1,
    };
  }
  return result;
}

/**
 * 确定性合并两个 SkillReviewSchedule 记录。
 * 规则：更新者优先；同时间 passed/failed 不可被 scheduled/due 复活。
 */
export function mergeSkillReviewSchedule(
  a: SkillReviewSchedule,
  b: SkillReviewSchedule,
): SkillReviewSchedule {
  if (a.updatedAt === b.updatedAt) {
    // Tie-break: passed > failed > due > scheduled
    const rank = { passed: 3, failed: 2, due: 1, scheduled: 0 } as const;
    return rank[a.status] >= rank[b.status] ? a : b;
  }
  return a.updatedAt > b.updatedAt ? a : b;
}

/** Build a stable review-cycle id for event properties. */
export function getReviewCycleId(schedule: SkillReviewSchedule): string {
  return `rc:${schedule.skillId}:${schedule.stage}:${schedule.formId}:${schedule.updatedAt}`;
}

/**
 * 调度技能复习（成功补修后调用）。
 * 成功补修（含快速通过）→ 调度 D1 +1 天。
 * D1 通过 → 调度 D7 +6 天。
 */
export function scheduleSkillReview(
  progress: ProgressData,
  skillId: string,
  targetSkillId: string,
  stage: 'd1' | 'd7',
  now: number,
  options?: { formId?: 'a' | 'b'; attemptNo?: number },
): ProgressData {
  const dueAt = stage === 'd1' ? now + DAY_MS : now + 6 * DAY_MS;
  const schedule: SkillReviewSchedule = {
    skillId,
    targetSkillId,
    stage,
    status: 'scheduled',
    dueAt,
    updatedAt: now,
    contentVersion: REVIEW_CONTENT_VERSION,
    firstExposure: true,
    formId: options?.formId ?? 'a',
    attemptNo: options?.attemptNo ?? 1,
  };
  const existing = progress.skillReviews?.[skillId];
  // 防止旧 scheduled/due 覆盖已完成状态（同 stage 时才阻止）
  if (existing && existing.stage === stage && (existing.status === 'passed' || existing.status === 'failed')) {
    if (existing.updatedAt >= now) return progress;
  }
  return {
    ...progress,
    skillReviews: {
      ...(progress.skillReviews ?? {}),
      [skillId]: schedule,
    },
  };
}

/**
 * 获取所有到期的技能复习（status=scheduled 且 dueAt <= now，或 status=due）。
 *
 * F18：若某技能的当前显示状态已为 stable（例如已有课程级 D7 直接证据），
 * 则不再将其作为待复习任务呈现；历史调度记录仍保留，仅停止展示为 due。
 */
export function getDueSkillReviews(
  progress: ProgressData,
  now: number,
): SkillReviewSchedule[] {
  const reviews = progress.skillReviews ?? {};
  return Object.values(reviews)
    .filter((r) => {
      if (getSkillDisplayStatus(progress, r.skillId, now) === 'stable') return false;
      if (r.status === 'due') return true;
      if (r.status === 'scheduled' && r.dueAt <= now) return true;
      return false;
    })
    .sort((a, b) => a.dueAt - b.dueAt);
}

/**
 * 获取某个技能的复习调度记录。
 */
export function getSkillReviewSchedule(
  progress: ProgressData,
  skillId: string,
): SkillReviewSchedule | undefined {
  return progress.skillReviews?.[skillId];
}

/**
 * 结算技能复习结果。
 * 通过：标记 passed，若 D1 则调度 D7，若 D7 则记录 retention 证据。
 * 失败：标记 failed，保持 due 可重试。
 *
 * 接受 status='due' 或 status='scheduled' 且 dueAt <= now（F10）。
 */
export function resolveSkillReview(
  progress: ProgressData,
  skillId: string,
  passed: boolean,
  now: number,
): ProgressData {
  const schedule = progress.skillReviews?.[skillId];
  const isDue = schedule && (
    schedule.status === 'due' ||
    (schedule.status === 'scheduled' && schedule.dueAt <= now)
  );
  if (!schedule || !isDue) return progress;

  const reviews = { ...progress.skillReviews! };

  if (passed) {
    reviews[skillId] = {
      ...schedule,
      status: 'passed',
      updatedAt: now,
      firstExposure: schedule.firstExposure,
      formId: schedule.formId,
      attemptNo: schedule.attemptNo + 1,
    };
    let result: ProgressData = { ...progress, skillReviews: reviews };

    // D1 通过 → 调度 D7
    if (schedule.stage === 'd1') {
      result = scheduleSkillReview(result, skillId, schedule.targetSkillId, 'd7', now);
    }

    return result;
  }

  // 失败：标记 failed，但 status 保持为 due 以便重试；firstExposure 关闭，attemptNo 递增
  reviews[skillId] = {
    ...schedule,
    status: 'due',
    updatedAt: now,
    firstExposure: false, // 不再是首次接触
    formId: schedule.formId,
    attemptNo: schedule.attemptNo + 1,
  };
  return { ...progress, skillReviews: reviews };
}

/**
 * 将到期的 scheduled 复习标记为 due（供调度刷新用）。
 */
export function refreshDueReviews(
  progress: ProgressData,
  now: number,
): ProgressData {
  const reviews = progress.skillReviews ?? {};
  let changed = false;
  const updated: Record<string, SkillReviewSchedule> = {};
  for (const [k, r] of Object.entries(reviews)) {
    if (r.status === 'scheduled' && r.dueAt <= now) {
      updated[k] = { ...r, status: 'due' };
      changed = true;
    } else {
      updated[k] = r;
    }
  }
  if (!changed) return progress;
  return { ...progress, skillReviews: updated };
}

// ===== v0.3：实验分组 =====

/**
 * 确定性实验分组：基于 userId + skillId 的稳定 50/50 分配。
 * 纯函数，无副作用。
 */
export function getExperimentAssignment(
  userId: string,
  skillId: string,
): 'repair' | 'course' {
  const combined = `${userId}:${skillId}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
  }
  return (hash & 1) === 0 ? 'repair' : 'course';
}

/**
 * 存储实验分组到进度数据。
 */
export function setExperimentAssignment(
  progress: ProgressData,
  skillId: string,
  assignment: ExperimentAssignment,
): ProgressData {
  return {
    ...progress,
    experimentAssignments: {
      ...(progress.experimentAssignments ?? {}),
      [skillId]: assignment,
    },
  };
}

/**
 * 获取某技能的有效实验分组（优先已存储的，否则计算）。
 */
export function getEffectiveAssignment(
  progress: ProgressData,
  userId: string | null,
  skillId: string,
): ExperimentAssignment {
  // 已存储的分组优先
  const stored = progress.experimentAssignments?.[skillId];
  if (stored) return stored;
  // 快速通过用户是 observer（由调用方在快速通过后设置）
  // 无 userId 时默认 repair
  if (!userId) return 'repair';
  return getExperimentAssignment(userId, skillId);
}

/**
 * 合并实验分组记录（确定性、可交换）。
 *
 * 优先级（F8 fix）：observer > repair > course。
 * observer 是 fast-pass 用户的事实标记，不可被远端旧 repair/course 覆盖。
 * repair/course 由确定性 hash 产生，冲突时 repair 优先（固定秩）。
 */
export function mergeExperimentAssignments(
  local: Record<string, ExperimentAssignment> | undefined,
  remote: Record<string, ExperimentAssignment> | undefined,
): Record<string, ExperimentAssignment> | undefined {
  if (!local && !remote) return undefined;
  const allKeys = new Set([
    ...Object.keys(local ?? {}),
    ...Object.keys(remote ?? {}),
  ]);
  if (allKeys.size === 0) return undefined;

  const rank: Record<ExperimentAssignment, number> = { observer: 2, repair: 1, course: 0 };
  const result: Record<string, ExperimentAssignment> = {};
  for (const key of allKeys) {
    const l = local?.[key];
    const r = remote?.[key];
    if (l && r) {
      result[key] = rank[l] >= rank[r] ? l : r;
    } else {
      result[key] = (l ?? r)!;
    }
  }
  return result;
}

/**
 * 解析实验分组字段（不信任外部数据）。
 */
export function parseExperimentAssignments(
  raw: unknown,
): Record<string, ExperimentAssignment> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const valid = new Set(['repair', 'course', 'observer']);
  const result: Record<string, ExperimentAssignment> = {};
  let count = 0;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k !== 'string') continue;
    if (typeof v === 'string' && valid.has(v)) {
      result[k] = v as ExperimentAssignment;
      count++;
    }
  }
  return count > 0 ? result : undefined;
}

// ===== v0.3：首页任务优先级 =====

export interface HomeTask {
  type: 'skill_review' | 'course_review' | 'active_repair' | 'course_intervention' | 'learning_goal' | 'current_learning' | 'next_course';
  skillId?: string;
  courseId?: string;
  link: string;
  title: string;
  reason: string;
  duration?: string;
  urgent: boolean;
  /** Stable cycle identity for event dedup (non-UI). Built from persisted state timestamps. */
  eventCycleId: string;
}

/**
 * 计算首页任务列表：1 个主要 + 最多 2 个预览。
 * 优先级：到期技能复习 > 到期课程复习 > 活跃补修 > 活跃课程干预 > 学习目标 > 当前学习中 > 下一课程。
 */
export function getHomeTasks(
  progress: ProgressData,
  dueCourseIds: string[],
  now: number,
): HomeTask[] {
  const tasks: HomeTask[] = [];
  const seenLinks = new Set<string>();
  const dueSkillReviews = getDueSkillReviews(progress, now);

  const pushUnique = (task: HomeTask) => {
    if (!seenLinks.has(task.link)) {
      seenLinks.add(task.link);
      tasks.push(task);
    }
  };

  // Priority 1: due skill D1/D7
  for (const r of dueSkillReviews) {
    const formParam = r.formId === 'b' ? '&form=b' : '';
    const formLabel = r.formId === 'b' ? ' · 新题组' : '';
    pushUnique({
      type: 'skill_review',
      skillId: r.skillId,
      link: `/repair/${r.skillId}?target=${r.targetSkillId}&review=${r.stage}${formParam}`,
      title: `技能复习（${r.stage === 'd1' ? '第1天' : '第7天'}）${formLabel}`,
      reason: r.stage === 'd1' ? '昨天的技能需要巩固' : '上周的技能需要巩固',
      duration: '约2分钟',
      urgent: true,
      eventCycleId: `sr:${r.skillId}:${r.stage}:${r.formId}:${r.updatedAt}`,
    });
  }

  // Priority 2: due course D1/D7
  for (const kpId of dueCourseIds) {
    const mastery = progress.mastery?.[kpId];
    const cycleTs = mastery ? `${mastery.delayedReviewCount}:${mastery.nextReviewAt}:${mastery.lastAttemptAt}` : kpId;
    pushUnique({
      type: 'course_review',
      courseId: kpId,
      link: `/kp/${kpId}`,
      title: '课程复习',
      reason: '复习时间到了',
      duration: '约5分钟',
      urgent: true,
      eventCycleId: `cr:${kpId}:${cycleTs}`,
    });
  }

  // Priority 3: active repair
  if (progress.repairSession?.status === 'active') {
    const { skillId, targetSkillId, updatedAt } = progress.repairSession;
    pushUnique({
      type: 'active_repair',
      skillId,
      link: `/repair/${skillId}?target=${targetSkillId}`,
      title: '微补修进行中',
      reason: '继续你的微补修',
      duration: '约3分钟',
      urgent: false,
      eventCycleId: `ar:${skillId}:${updatedAt}`,
    });
  }

  // Priority 4: active course intervention (F2)
  if (progress.courseIntervention?.status === 'active') {
    const ci = progress.courseIntervention;
    pushUnique({
      type: 'course_intervention',
      skillId: ci.skillId,
      courseId: ci.courseId,
      link: `/kp/${ci.courseId}`,
      title: '课程巩固进行中',
      reason: '完成课程后安排复习',
      duration: '约5分钟',
      urgent: false,
      eventCycleId: `ci:${ci.skillId}:${ci.courseId}:${ci.updatedAt}`,
    });
  }

  // Priority 5: learning goal
  if (progress.learningGoal) {
    pushUnique({
      type: 'learning_goal',
      skillId: progress.learningGoal.skillId,
      link: `/map?target=${progress.learningGoal.skillId}`,
      title: '学习目标',
      reason: '前往知识地图',
      urgent: false,
      eventCycleId: `lg:${progress.learningGoal.skillId}:${progress.learningGoal.updatedAt}`,
    });
  }

  // Priority 6: currentLearning resume (F6)
  if (progress.currentLearning) {
    pushUnique({
      type: 'current_learning',
      courseId: progress.currentLearning,
      link: `/kp/${progress.currentLearning}`,
      title: '继续学习',
      reason: '上次学到的地方',
      urgent: false,
      eventCycleId: `cl:${progress.currentLearning}`,
    });
  }

  return tasks;
}

// ===== v0.3：课程干预 =====

/**
 * 解析并校验 courseIntervention 字段（不信任外部数据）。
 */
export function parseCourseIntervention(raw: unknown): CourseIntervention | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.skillId !== 'string' || r.skillId.trim() === '') return undefined;
  if (typeof r.targetSkillId !== 'string' || r.targetSkillId.trim() === '') return undefined;
  if (typeof r.courseId !== 'string' || r.courseId.trim() === '') return undefined;
  if (r.variant !== 'course') return undefined;
  if (r.status !== 'active' && r.status !== 'completed') return undefined;
  if (typeof r.updatedAt !== 'number' || !Number.isFinite(r.updatedAt) || r.updatedAt < 0) return undefined;
  const reviewStage = r.reviewStage === 'd1' || r.reviewStage === 'd7' ? r.reviewStage : undefined;
  const nextForm = r.nextForm === 'a' || r.nextForm === 'b' ? r.nextForm : undefined;
  const origin = r.origin === 'diagnostic' || r.origin === 'review' ? r.origin : undefined;
  return {
    skillId: r.skillId,
    targetSkillId: r.targetSkillId,
    courseId: r.courseId,
    variant: 'course',
    status: r.status,
    updatedAt: r.updatedAt,
    reviewStage,
    nextForm,
    origin,
  };
}

/**
 * 合并两个 courseIntervention 记录（确定性）。
 * 规则：updatedAt 较新者胜；同时间 completed 胜（防止旧 active 复活）。
 */
export function mergeCourseIntervention(
  a: CourseIntervention | undefined,
  b: CourseIntervention | undefined,
): CourseIntervention | undefined {
  if (!a && !b) return undefined;
  if (!a) return b;
  if (!b) return a;
  if (a.updatedAt === b.updatedAt) {
    return (a.status === 'completed' || b.status === 'completed')
      ? (a.status === 'completed' ? a : b)
      : a;
  }
  return a.updatedAt > b.updatedAt ? a : b;
}

/**
 * 开始课程干预（诊断失败或复习失败后分配 course 组时调用）。
 */
export function startCourseIntervention(
  progress: ProgressData,
  skillId: string,
  targetSkillId: string,
  courseId: string,
  now: number,
  options?: { reviewStage?: 'd1' | 'd7'; nextForm?: 'a' | 'b'; origin?: 'diagnostic' | 'review' },
): ProgressData {
  return {
    ...progress,
    courseIntervention: {
      skillId,
      targetSkillId,
      courseId,
      variant: 'course',
      status: 'active',
      updatedAt: now,
      reviewStage: options?.reviewStage,
      nextForm: options?.nextForm,
      origin: options?.origin,
    },
  };
}

/**
 * 完成课程干预（匹配的课程首次通过后调用）。
 * 返回更新后的 progress，或原始 progress 如果不匹配。
 */
export function completeCourseIntervention(
  progress: ProgressData,
  courseId: string,
  now: number,
): ProgressData {
  const ci = progress.courseIntervention;
  if (!ci || ci.status !== 'active') return progress;
  if (ci.courseId !== courseId) return progress;
  return {
    ...progress,
    courseIntervention: { ...ci, status: 'completed', updatedAt: now },
  };
}

/**
 * 检查某个 courseId 是否匹配活跃的课程干预。
 */
export function isActiveCourseIntervention(
  progress: ProgressData,
  courseId: string,
): boolean {
  const ci = progress.courseIntervention;
  return !!ci && ci.status === 'active' && ci.courseId === courseId;
}

// ===== Atomic transition helpers (event emission from context) =====

/** A single event to emit after a state transition */
export interface TransitionEvent {
  clientEventId: string;
  eventName: LearningEventName;
  skillId?: string;
  courseId?: string;
  mode?: string;
  variant?: string;
  passed?: boolean;
  firstTry?: boolean;
  dueAt?: string;
  properties?: Record<string, unknown>;
}

/**
 * Atomic skill review resolution:
 * 1. Records evidence on first exposure only (F11/F12)
 * 2. Resolves schedule status and D1→D7 scheduling
 * 3. Computes post-transition display status
 * 4. Returns new progress + deterministic events to emit
 *
 * Valid attempts: status='due' OR status='scheduled' && dueAt <= now (F10).
 *
 * Events emitted:
 * - skill_review_finished (for every valid attempt; F12)
 * - skill_review_scheduled for D7 (if D1 pass)
 * - stable_achieved (if D7 first-exposure pass AND post-status is stable)
 */
export function resolveSkillReviewTransition(
  progress: ProgressData,
  skillId: string,
  passed: boolean,
  now: number,
): { progress: ProgressData; events: TransitionEvent[] } {
  const schedule = progress.skillReviews?.[skillId];
  const isDue = schedule && (
    schedule.status === 'due' ||
    (schedule.status === 'scheduled' && schedule.dueAt <= now)
  );
  if (!schedule || !isDue) return { progress, events: [] };

  const cycleId = schedule.updatedAt; // pre-transition cycle identity
  const isFirstExposure = schedule.firstExposure;
  const stage = schedule.stage;
  const formId = schedule.formId;
  const attemptNo = schedule.attemptNo;
  const evidenceEligible = isFirstExposure;
  const events: TransitionEvent[] = [];

  let p = progress;

  // Record evidence on first exposure only
  if (isFirstExposure) {
    if (stage === 'd1') {
      // D1: one transfer summary (success only for 2/2 first-try pass)
      p = recordSkillEvidence(p, skillId, passed, passed, 'transfer', 'd1', now);
    } else {
      // D7: pass = exactly one transfer + one retention; fail = failure transfer only
      if (passed) {
        p = recordSkillEvidence(p, skillId, true, true, 'transfer', 'd7', now);
        p = recordSkillEvidence(p, skillId, true, true, 'retention', 'd7', now);
      } else {
        p = recordSkillEvidence(p, skillId, false, false, 'transfer', 'd7', now);
      }
    }
  }

  const reviewProperties = {
    reviewCycleId: getReviewCycleId(schedule),
    attemptNo,
    firstExposure: isFirstExposure,
    evidenceEligible,
    formId,
  };

  // F11: Non-first-exposure retry never marks schedule passed or schedules the next stage;
  // it stays due so the task remains in the queue until a fresh first-exposure form.
  if (!isFirstExposure) {
    const reviews = { ...p.skillReviews! };
    reviews[skillId] = {
      ...schedule,
      status: 'due',
      updatedAt: now,
      firstExposure: false,
      formId,
      attemptNo: attemptNo + 1,
    };
    p = { ...p, skillReviews: reviews };

    events.push({
      clientEventId: `srf:${skillId}:${stage}:${formId}:${cycleId}:${attemptNo}`,
      eventName: 'skill_review_finished',
      skillId,
      mode: stage,
      passed,
      firstTry: false,
      properties: reviewProperties,
    });

    return { progress: p, events };
  }

  // Resolve schedule (handles D1→D7 scheduling internally)
  p = resolveSkillReview(p, skillId, passed, now);

  // Compute post-transition display status from the updated progress
  const postStatus = getSkillDisplayStatus(p, skillId, now);

  // skill_review_finished for every valid attempt (F12)
  events.push({
    clientEventId: `srf:${skillId}:${stage}:${formId}:${cycleId}`,
    eventName: 'skill_review_finished',
    skillId,
    mode: stage,
    passed,
    firstTry: passed,
    properties: reviewProperties,
  });

  // D1 pass → skill_review_scheduled for D7
  if (passed && stage === 'd1') {
    const d7Schedule = p.skillReviews?.[skillId];
    if (d7Schedule && d7Schedule.stage === 'd7') {
      events.push({
        clientEventId: `srs:${skillId}:d7:${d7Schedule.updatedAt}`,
        eventName: 'skill_review_scheduled',
        skillId,
        mode: 'd7',
        dueAt: new Date(d7Schedule.dueAt).toISOString(),
        properties: {
          reviewCycleId: getReviewCycleId(d7Schedule),
          attemptNo: d7Schedule.attemptNo,
          firstExposure: d7Schedule.firstExposure,
          evidenceEligible: d7Schedule.firstExposure,
          formId: d7Schedule.formId,
        },
      });
    }
  }

  // D7 pass + stable → stable_achieved (only on first exposure)
  if (passed && stage === 'd7' && isFirstExposure && postStatus === 'stable') {
    events.push({
      clientEventId: `sa:${skillId}:${cycleId}`,
      eventName: 'stable_achieved',
      skillId,
      properties: reviewProperties,
    });
  }

  return { progress: p, events };
}

/**
 * Atomic markInitialPass with course intervention completion:
 * 1. Marks initial pass (with mastery record if hasReviewSets)
 * 2. If active course intervention matches, completes it and schedules the next review
 *    - Diagnostic intervention → schedule D1 form A
 *    - Review remediation intervention → schedule the same stage with the specified next form
 * 3. Returns new progress + deterministic events
 *
 * Events emitted (when course intervention matches):
 * - intervention_completed (variant: course)
 * - skill_review_scheduled (mode: d1 or remedial stage)
 */
export function markInitialPassTransition(
  progress: ProgressData,
  kpId: string,
  stars: number,
  now: number,
  hasReviewSets: boolean,
): { progress: ProgressData; events: TransitionEvent[] } {
  const events: TransitionEvent[] = [];

  // Capture pre-completion intervention identity
  const ci = progress.courseIntervention;
  const interventionCycleId = ci && ci.status === 'active' && ci.courseId === kpId
    ? ci.updatedAt
    : null;

  // Mark initial pass
  let p = markInitialPass(progress, kpId, stars, now, hasReviewSets);

  // Complete intervention + schedule next review if matching
  if (interventionCycleId !== null && ci) {
    p = completeCourseIntervention(p, kpId, now);

    const remedialStage = ci.reviewStage;
    const remedialForm = ci.nextForm ?? 'a';
    const isReviewRemediation = ci.origin === 'review' && remedialStage != null;
    const nextStage = isReviewRemediation ? remedialStage : 'd1';

    p = scheduleSkillReview(p, ci.skillId, ci.targetSkillId, nextStage, now, {
      formId: remedialForm,
      attemptNo: 1,
    });

    events.push({
      clientEventId: `ic:${ci.skillId}:course:${interventionCycleId}`,
      eventName: 'intervention_completed',
      skillId: ci.skillId,
      courseId: kpId,
      variant: 'course',
      properties: {
        origin: ci.origin ?? 'diagnostic',
        reviewStage: nextStage,
        nextForm: remedialForm,
      },
    });

    const nextSchedule = p.skillReviews?.[ci.skillId];
    if (nextSchedule && nextSchedule.stage === nextStage) {
      events.push({
        clientEventId: `srs:${ci.skillId}:${nextStage}:${nextSchedule.updatedAt}`,
        eventName: 'skill_review_scheduled',
        skillId: ci.skillId,
        mode: nextStage,
        dueAt: new Date(nextSchedule.dueAt).toISOString(),
        properties: {
          reviewCycleId: getReviewCycleId(nextSchedule),
          attemptNo: nextSchedule.attemptNo,
          firstExposure: nextSchedule.firstExposure,
          evidenceEligible: nextSchedule.firstExposure,
          formId: nextSchedule.formId,
          origin: 'course_intervention',
        },
      });
    }
  }

  return { progress: p, events };
}
