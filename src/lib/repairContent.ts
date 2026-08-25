/**
 * repairContent.ts — 集中内容读取与运行时校验
 *
 * 提供：repairUnits, getRepairUnit, validateRepairUnits
 * Map、RepairPage、测试均从此处导入，禁止在其他文件直接 import JSON。
 */
import repairUnitsRaw from '@/content/knowledge-graph/fraction-repair-v0.2.json';
import type { RepairUnit } from './types';
import { getSkillById } from './knowledgeGraph';
import { getKnowledgePointById } from './content';

/** 已加载、已类型转换的补修单元列表 */
export const repairUnits: RepairUnit[] = repairUnitsRaw as unknown as RepairUnit[];

/** 按 skillId 查找补修单元，未找到返回 undefined */
export function getRepairUnit(skillId: string): RepairUnit | undefined {
  return repairUnits.find((u) => u.skillId === skillId);
}

// 预期 9 个 skillId
const EXPECTED_SKILL_IDS = [
  'frac.whole',
  'frac.equal_partition',
  'frac.notation',
  'frac.of_quantity',
  'frac.multiply_fraction',
  'frac.reciprocal',
  'frac.division_grouping',
  'frac.division_sharing',
  'frac.divide_transform',
] as const;

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
}

/**
 * validateRepairUnits — 运行时自检，返回所有发现的问题。
 * 无错误时返回空数组。
 *
 * 校验项：
 * - 恰好 9 单元 / 36 题
 * - 9 个预期 skillId 恰好出现一次
 * - 每单元 2 diagnostic + 2 check
 * - 题目 ID 全局唯一
 * - 仅 choice/fill-blank；choice 有 options 且 options 包含 correctAnswer
 * - 答案/解析非空
 * - 每题 primarySkillId 等于 unit.skillId
 * - check 全部 evidenceType=transfer
 * - estimatedMinutes 3-5；lesson steps 2-4；workedExample/misconception 字段完整
 */
export function validateRepairUnits(units: RepairUnit[] = repairUnits): ValidationError[] {
  const errors: ValidationError[] = [];

  // 单元数量
  if (units.length !== 9) {
    errors.push({ type: 'error', message: `期望 9 个补修单元，实际 ${units.length} 个` });
  }

  // 题目总数
  const totalQ = units.reduce((s, u) => s + u.diagnosticQuestions.length + u.checkQuestions.length, 0);
  if (totalQ !== 36) {
    errors.push({ type: 'error', message: `期望 36 道题，实际 ${totalQ} 道` });
  }

  // skillId 覆盖
  const foundIds = new Set(units.map((u) => u.skillId));
  for (const id of EXPECTED_SKILL_IDS) {
    if (!foundIds.has(id)) {
      errors.push({ type: 'error', message: `缺少预期 skillId: ${id}` });
    }
  }
  const counts = new Map<string, number>();
  for (const u of units) {
    counts.set(u.skillId, (counts.get(u.skillId) ?? 0) + 1);
  }
  for (const [id, cnt] of counts) {
    if (cnt > 1) {
      errors.push({ type: 'error', message: `skillId 重复出现 ${cnt} 次: ${id}` });
    }
  }

  // 全局题目 ID 唯一
  const allQuestionIds = new Set<string>();
  for (const u of units) {
    for (const q of [...u.diagnosticQuestions, ...u.checkQuestions]) {
      if (allQuestionIds.has(q.id)) {
        errors.push({ type: 'error', message: `题目 ID 重复: ${q.id}` });
      }
      allQuestionIds.add(q.id);
    }
  }

  for (const u of units) {
    const prefix = `[${u.skillId}]`;

    // R4: skillId must exist in graph and be published
    const skillNode = getSkillById(u.skillId);
    if (!skillNode) {
      errors.push({ type: 'error', message: `${prefix} skillId 不存在于知识图谱中` });
    } else if (skillNode.status !== 'published') {
      errors.push({ type: 'error', message: `${prefix} skillId 状态为 ${skillNode.status}，应为 published` });
    }

    // R4: courseId must exist in course content
    const courseKp = getKnowledgePointById(u.courseId);
    if (!courseKp) {
      errors.push({ type: 'error', message: `${prefix} courseId "${u.courseId}" 不存在于课程内容中` });
    }

    // 每单元 2 diag + 2 check
    if (u.diagnosticQuestions.length !== 2) {
      errors.push({ type: 'error', message: `${prefix} 诊断题应为 2 道，实际 ${u.diagnosticQuestions.length} 道` });
    }
    if (u.checkQuestions.length !== 2) {
      errors.push({ type: 'error', message: `${prefix} 验证题应为 2 道，实际 ${u.checkQuestions.length} 道` });
    }

    // estimatedMinutes 3-5
    if (u.estimatedMinutes < 3 || u.estimatedMinutes > 5) {
      errors.push({ type: 'error', message: `${prefix} estimatedMinutes 应在 3-5，实际 ${u.estimatedMinutes}` });
    }

    // lesson 字段完整
    const l = u.lesson;
    if (!l.coreExplanation || l.coreExplanation.trim() === '') {
      errors.push({ type: 'error', message: `${prefix} lesson.coreExplanation 为空` });
    }
    if (!Array.isArray(l.steps) || l.steps.length < 2 || l.steps.length > 4) {
      errors.push({ type: 'error', message: `${prefix} lesson.steps 应为 2-4 步，实际 ${l.steps?.length}` });
    }
    if (!l.workedExample?.question || !l.workedExample?.answer) {
      errors.push({ type: 'error', message: `${prefix} lesson.workedExample 字段不完整` });
    }
    // R4: workedExample.steps at least 1 step and all text non-empty
    if (l.workedExample?.steps) {
      if (!Array.isArray(l.workedExample.steps) || l.workedExample.steps.length < 1) {
        errors.push({ type: 'error', message: `${prefix} lesson.workedExample.steps 至少需要 1 步` });
      }
      for (let si = 0; si < (l.workedExample.steps?.length ?? 0); si++) {
        if (!l.workedExample.steps[si] || l.workedExample.steps[si].trim() === '') {
          errors.push({ type: 'error', message: `${prefix} lesson.workedExample.steps[${si}] 为空` });
        }
      }
    }
    if (!l.misconception?.mistake || !l.misconception?.correction) {
      errors.push({ type: 'error', message: `${prefix} lesson.misconception 字段不完整` });
    }

    // 验证每道题
    const allQuestions = [
      ...u.diagnosticQuestions.map((q) => ({ q, phase: 'diagnostic' })),
      ...u.checkQuestions.map((q) => ({ q, phase: 'check' })),
    ];
    for (const { q, phase } of allQuestions) {
      const qp = `${prefix}[${q.id}]`;

      // 题型
      if (q.type !== 'choice' && q.type !== 'fill-blank') {
        errors.push({ type: 'error', message: `${qp} 题型不允许: ${q.type}，只允许 choice/fill-blank` });
      }

      // choice 需有 options 且包含 correctAnswer
      if (q.type === 'choice') {
        if (!Array.isArray(q.options) || q.options.length < 2) {
          errors.push({ type: 'error', message: `${qp} choice 题需要至少 2 个 options` });
        } else {
          const ca = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
          if (!q.options.includes(ca as string)) {
            errors.push({ type: 'error', message: `${qp} correctAnswer 不在 options 中` });
          }
        }
      }

      // 答案/解析非空
      if (!q.correctAnswer || (Array.isArray(q.correctAnswer) && q.correctAnswer.length === 0)) {
        errors.push({ type: 'error', message: `${qp} correctAnswer 为空` });
      }
      if (!q.explanation || q.explanation.trim() === '') {
        errors.push({ type: 'error', message: `${qp} explanation 为空` });
      }
      if (!q.prompt || q.prompt.trim() === '') {
        errors.push({ type: 'error', message: `${qp} prompt 为空` });
      }

      // primarySkillId 必须等于 unit.skillId
      if (q.primarySkillId !== u.skillId) {
        errors.push({ type: 'error', message: `${qp} primarySkillId (${q.primarySkillId}) 与 unit.skillId (${u.skillId}) 不一致` });
      }

      // check 题 evidenceType=transfer
      if (phase === 'check' && q.evidenceType !== 'transfer') {
        errors.push({ type: 'error', message: `${qp} check 题 evidenceType 应为 transfer，实际 ${q.evidenceType}` });
      }
    }

    // R4: Within same unit, diagnostic/check prompt+correctAnswer must not duplicate each other or workedExample
    const qaKeys = new Set<string>();
    const workedKey = `${(l.workedExample.question || '').trim()}|||${(l.workedExample.answer || '').trim()}`;
    qaKeys.add(workedKey);
    for (const q of [...u.diagnosticQuestions, ...u.checkQuestions]) {
      const answer = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
      const key = `${(q.prompt || '').trim()}|||${(answer || '').trim()}`;
      if (qaKeys.has(key)) {
        errors.push({ type: 'error', message: `${prefix}[${q.id}] 与同单元其他题目或 workedExample prompt+answer 重复` });
      }
      qaKeys.add(key);
    }
  }

  return errors;
}
