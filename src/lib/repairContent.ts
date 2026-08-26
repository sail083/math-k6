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
 * - 恰好 9 单元 / 108 题（36 补修 + 72 复习 A/B）
 * - 9 个预期 skillId 恰好出现一次
 * - 每单元 2 diagnostic + 2 check + D1/D7 各 2 题 × 2 套卷（A/B）
 * - 题目 ID 全局唯一
 * - 仅 choice/fill-blank；choice 有 options 且 options 包含 correctAnswer
 * - 答案/解析非空
 * - 每题 primarySkillId 等于 unit.skillId
 * - check 全部 evidenceType=transfer
 * - D1 全部 evidenceType=transfer；D7 第一题 transfer，第二题 retention（A、B 各自）
 * - D1/D7 每套卷至少一道 fill-blank
 * - 同一 skill 的 A/B 两套卷在归一化 prompt 模板上不重复
 * - estimatedMinutes 3-5；lesson steps 2-4；workedExample/misconception 字段完整
 */
export function validateRepairUnits(units: RepairUnit[] = repairUnits): ValidationError[] {
  const errors: ValidationError[] = [];

  // 单元数量
  if (units.length !== 9) {
    errors.push({ type: 'error', message: `期望 9 个补修单元，实际 ${units.length} 个` });
  }

  // 补修题目总数（diagnostic + check）
  const repairQ = units.reduce((s, u) => s + u.diagnosticQuestions.length + u.checkQuestions.length, 0);
  if (repairQ !== 36) {
    errors.push({ type: 'error', message: `期望 36 道补修题，实际 ${repairQ} 道` });
  }

  // 复习题目总数（d1 + d7 的 A/B 两套卷）
  const reviewQ = units.reduce((s, u) => {
    const d1A = u.reviewSets?.d1?.questions?.length ?? 0;
    const d1B = u.reviewSets?.d1?.alternateQuestions?.length ?? 0;
    const d7A = u.reviewSets?.d7?.questions?.length ?? 0;
    const d7B = u.reviewSets?.d7?.alternateQuestions?.length ?? 0;
    return s + d1A + d1B + d7A + d7B;
  }, 0);
  if (reviewQ !== 72) {
    errors.push({ type: 'error', message: `期望 72 道复习题（A/B 两套卷），实际 ${reviewQ} 道` });
  }

  // 题目总数
  const totalQ = repairQ + reviewQ;
  if (totalQ !== 108) {
    errors.push({ type: 'error', message: `期望 108 道题（补修+复习 A/B），实际 ${totalQ} 道` });
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

  // 全局题目 ID 唯一（包括 A/B 复习题）
  const allQuestionIds = new Set<string>();
  for (const u of units) {
    const allQs = [
      ...u.diagnosticQuestions,
      ...u.checkQuestions,
      ...(u.reviewSets?.d1?.questions ?? []),
      ...(u.reviewSets?.d1?.alternateQuestions ?? []),
      ...(u.reviewSets?.d7?.questions ?? []),
      ...(u.reviewSets?.d7?.alternateQuestions ?? []),
    ];
    for (const q of allQs) {
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

    // 复习集结构：每 stage 有 A/B 两套卷，各 2 题
    const d1A = u.reviewSets?.d1?.questions ?? [];
    const d1B = u.reviewSets?.d1?.alternateQuestions ?? [];
    const d7A = u.reviewSets?.d7?.questions ?? [];
    const d7B = u.reviewSets?.d7?.alternateQuestions ?? [];
    for (const [setName, qs] of [
      ['D1 A 卷', d1A],
      ['D1 B 卷', d1B],
      ['D7 A 卷', d7A],
      ['D7 B 卷', d7B],
    ] as const) {
      if (qs.length !== 2) {
        errors.push({ type: 'error', message: `${prefix} ${setName} 应为 2 题，实际 ${qs.length} 道` });
      }
    }

    // D1 evidenceType: all transfer（A、B 各自）
    for (const q of [...d1A, ...d1B]) {
      if (q.evidenceType !== 'transfer') {
        errors.push({ type: 'error', message: `${prefix}[${q.id}] D1 题 evidenceType 应为 transfer，实际 ${q.evidenceType}` });
      }
    }
    // D7 evidenceType: first=transfer, second=retention（A、B 各自）
    for (const d7Qs of [d7A, d7B]) {
      if (d7Qs.length >= 1 && d7Qs[0].evidenceType !== 'transfer') {
        errors.push({ type: 'error', message: `${prefix}[${d7Qs[0].id}] D7 第一题 evidenceType 应为 transfer，实际 ${d7Qs[0].evidenceType}` });
      }
      if (d7Qs.length >= 2 && d7Qs[1].evidenceType !== 'retention') {
        errors.push({ type: 'error', message: `${prefix}[${d7Qs[1].id}] D7 第二题 evidenceType 应为 retention，实际 ${d7Qs[1].evidenceType}` });
      }
    }

    // D1/D7 每套卷至少一道 fill-blank
    for (const [setName, qs] of [
      ['D1 A 卷', d1A],
      ['D1 B 卷', d1B],
      ['D7 A 卷', d7A],
      ['D7 B 卷', d7B],
    ] as const) {
      if (qs.length > 0 && qs.every((q) => q.type === 'choice')) {
        errors.push({ type: 'error', message: `${prefix} ${setName} 至少包含一道 fill-blank 题` });
      }
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

    // 验证每道题（包括 A/B 复习题）
    const allQuestions = [
      ...u.diagnosticQuestions.map((q) => ({ q, phase: 'diagnostic' as const })),
      ...u.checkQuestions.map((q) => ({ q, phase: 'check' as const })),
      ...d1A.map((q) => ({ q, phase: 'd1a' as const })),
      ...d1B.map((q) => ({ q, phase: 'd1b' as const })),
      ...d7A.map((q) => ({ q, phase: 'd7a' as const })),
      ...d7B.map((q) => ({ q, phase: 'd7b' as const })),
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

      // check 题 evidenceType=transfer (already checked for d1/d7 above)
      if (phase === 'check' && q.evidenceType !== 'transfer') {
        errors.push({ type: 'error', message: `${qp} check 题 evidenceType 应为 transfer，实际 ${q.evidenceType}` });
      }
    }

    // R4: Within same unit, ALL questions prompt+correctAnswer must not duplicate each other or workedExample
    const qaKeys = new Set<string>();
    const workedKey = `${(l.workedExample.question || '').trim()}|||${(l.workedExample.answer || '').trim()}`;
    qaKeys.add(workedKey);
    for (const q of [...u.diagnosticQuestions, ...u.checkQuestions, ...d1A, ...d1B, ...d7A, ...d7B]) {
      const answer = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
      const key = `${(q.prompt || '').trim()}|||${(answer || '').trim()}`;
      if (qaKeys.has(key)) {
        errors.push({ type: 'error', message: `${prefix}[${q.id}] 与同单元其他题目或 workedExample prompt+answer 重复` });
      }
      qaKeys.add(key);
    }

    // v0.3: Mechanical guard — A/B forms within the same skill and same stage must differ
    // in normalized prompt template. Normalize digits, fractions (a/b), and whitespace
    // so pure number/noun swaps between form A and form B are caught.
    const normalizeTemplate = (s: string): string =>
      s
        .replace(/\d+/g, '#')
        .replace(/#\s*\/\s*#/g, '#/#')
        .replace(/\s+/g, ' ')
        .trim();
    for (const [stageName, formA, formB] of [
      ['D1', d1A, d1B],
      ['D7', d7A, d7B],
    ] as const) {
      const aTemplates = new Set(formA.map((q) => normalizeTemplate(q.prompt)));
      for (const q of formB) {
        const normalized = normalizeTemplate(q.prompt);
        if (aTemplates.has(normalized)) {
          errors.push({ type: 'error', message: `${prefix}[${q.id}] ${stageName} B 卷归一化 prompt 模板与 A 卷重复（仅数字/名词替换？）` });
        }
      }
    }

    // v0.3: Extended guard — diagnostic/check questions must not share normalized prompt
    // templates with D1/D7 A/B review questions in the same skill. This catches cases
    // where a review question is merely a number-swap of a diagnostic/check question.
    const diagCheckTemplates = new Set(
      [...u.diagnosticQuestions, ...u.checkQuestions].map((q) => normalizeTemplate(q.prompt)),
    );
    for (const [phaseLabel, qs] of [
      ['D1 A', d1A],
      ['D1 B', d1B],
      ['D7 A', d7A],
      ['D7 B', d7B],
    ] as const) {
      for (const q of qs) {
        const normalized = normalizeTemplate(q.prompt);
        if (diagCheckTemplates.has(normalized)) {
          errors.push({ type: 'error', message: `${prefix}[${q.id}] ${phaseLabel} 卷归一化 prompt 模板与诊断/验证题重复（仅数字/名词替换？）` });
        }
      }
    }
  }

  return errors;
}

/** 获取所有补修+复习题目（供测试去重校验用） */
export function getAllRepairQuestions(): { questions: import('./types').Question[]; skillId: string; phase: string }[] {
  const result: { questions: import('./types').Question[]; skillId: string; phase: string }[] = [];
  for (const u of repairUnits) {
    result.push({ questions: u.diagnosticQuestions, skillId: u.skillId, phase: 'diagnostic' });
    result.push({ questions: u.checkQuestions, skillId: u.skillId, phase: 'check' });
    if (u.reviewSets?.d1?.questions) {
      result.push({ questions: u.reviewSets.d1.questions, skillId: u.skillId, phase: 'd1a' });
    }
    if (u.reviewSets?.d1?.alternateQuestions) {
      result.push({ questions: u.reviewSets.d1.alternateQuestions, skillId: u.skillId, phase: 'd1b' });
    }
    if (u.reviewSets?.d7?.questions) {
      result.push({ questions: u.reviewSets.d7.questions, skillId: u.skillId, phase: 'd7a' });
    }
    if (u.reviewSets?.d7?.alternateQuestions) {
      result.push({ questions: u.reviewSets.d7.alternateQuestions, skillId: u.skillId, phase: 'd7b' });
    }
  }
  return result;
}
