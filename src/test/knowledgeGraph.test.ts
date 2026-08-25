/**
 * knowledgeGraph.test.ts
 *
 * 覆盖交接单要求的 8 大回归测试类别：
 * T1. 图谱校验
 * T2. 70 道分数课程题目的技能映射完整性
 * T3. 路径正确性
 * T4. 已稳固节点不进入学习路径
 * T5. 进度数据兼容性（skillEvidence 向后兼容）
 * T6. 技能证据不传播（下游课程完成不自动点亮技能）
 * T7. D7 状态转移
 * T8. GameRunner 重复提交防重
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateGraph,
  graph,
  getHardPrerequisitePath,
  getCourseContext,
} from '@/lib/knowledgeGraph';
import {
  loadProgress,
  markInitialPass,
  markDelayedReviewPass,
  getMasteryStatus,
  recordSkillEvidence,
  getSkillDisplayStatus,
  hasDirectSkillEvidence,
  mergeSkillEvidence,
  hasMeaningfulProgress,
} from '@/lib/progress';
import type { ProgressData, SkillEvidenceRecord } from '@/lib/types';

// ==========================================
// T1: 图谱校验
// ==========================================

describe('T1: validateGraph', () => {
  it('生产图谱无任何校验错误', () => {
    const result = validateGraph(graph);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('节点数量恰好为 34', () => {
    expect(graph.nodes.length).toBe(34);
  });

  it('所有节点 ID 唯一', () => {
    const ids = graph.nodes.map((n) => n.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('所有边引用的节点存在', () => {
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    for (const e of graph.edges) {
      expect(nodeIds.has(e.from), `边 from 节点 ${e.from} 不存在`).toBe(true);
      expect(nodeIds.has(e.to), `边 to 节点 ${e.to} 不存在`).toBe(true);
    }
  });

  it('REQUIRES_HARD 子图无环', () => {
    const result = validateGraph(graph);
    const cycleErrors = result.errors.filter((e) => e.includes('环'));
    expect(cycleErrors).toEqual([]);
  });

  it('课程映射引用的技能节点全部存在', () => {
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    for (const cm of graph.courseMappings) {
      const allSkills = [...cm.coreSkills, ...cm.reviewSkills, ...cm.transferSkills];
      for (const skillId of allSkills) {
        expect(nodeIds.has(skillId), `课程 ${cm.courseId} 引用了不存在的技能 ${skillId}`).toBe(true);
      }
    }
  });

  it('4 种关系类型的边各至少有 1 条', () => {
    const types = new Set(graph.edges.map((e) => e.type));
    expect(types.has('REQUIRES_HARD')).toBe(true);
    expect(types.has('REQUIRES_HELPFUL')).toBe(true);
    expect(types.has('GENERALIZES_TO')).toBe(true);
    expect(types.has('CONTRASTS_WITH')).toBe(true);
  });
});

// ==========================================
// T2: 70 道分数题目技能映射完整性
// ==========================================

/**
 * 动态导入所有 7 门分数课程的 game.json，
 * 校验所有题目（含 D1/D7）都有有效 primarySkillId 和 evidenceType。
 */
describe('T2: 7 门分数课程 game.json 技能映射', () => {
  const FRACTION_COURSE_IDS = [
    'g3-fraction-intro',
    'g3-fraction-compare',
    'g3-fraction-add-sub',
    'g5-fraction-meaning',
    'g5-fraction-add-sub',
    'g6-fraction-mult',
    'g6-fraction-div',
  ];

  const VALID_EVIDENCE_TYPES = new Set(['conceptual', 'procedural', 'transfer', 'retention']);
  const nodeIds = new Set(graph.nodes.map((n) => n.id));

  // Vitest 支持在 describe 内部动态 import，使用 glob 来加载所有 game.json
  const gameModules = import.meta.glob<{ default: unknown }>(
    '@/content/knowledge-points/*/game.json',
    { eager: true }
  );

  function getGame(courseId: string) {
    const key = Object.keys(gameModules).find((k) => k.includes(`/${courseId}/game.json`));
    return key ? (gameModules[key]?.default as {
      knowledgePointId: string;
      questions: Array<{ id: string; primarySkillId?: string; evidenceType?: string; secondarySkillIds?: string[] }>;
      reviewSets?: {
        d1?: { questions: Array<{ id: string; primarySkillId?: string; evidenceType?: string; secondarySkillIds?: string[] }> };
        d7?: { questions: Array<{ id: string; primarySkillId?: string; evidenceType?: string; secondarySkillIds?: string[] }> };
      };
    }) : null;
  }

  it('7 门分数课程题目总数恰好为 70', () => {
    let total = 0;
    for (const courseId of FRACTION_COURSE_IDS) {
      const game = getGame(courseId);
      expect(game, `找不到 ${courseId}/game.json`).not.toBeNull();
      if (!game) continue;
      total += game.questions.length;
      total += game.reviewSets?.d1?.questions.length ?? 0;
      total += game.reviewSets?.d7?.questions.length ?? 0;
    }
    expect(total).toBe(70);
  });

  for (const courseId of FRACTION_COURSE_IDS) {
    it(`${courseId}: 所有题目有有效 primarySkillId + evidenceType，每门恰好 10 题`, () => {
      const game = getGame(courseId);
      expect(game, `找不到 ${courseId}/game.json`).not.toBeNull();
      if (!game) return;

      const allQuestions = [
        ...game.questions,
        ...(game.reviewSets?.d1?.questions ?? []),
        ...(game.reviewSets?.d7?.questions ?? []),
      ];

      // 每门课应有恰好 10 道题（6 初始 + 2 D1 + 2 D7）
      expect(allQuestions.length).toBe(10);

      for (const q of allQuestions) {
        expect(q.primarySkillId, `题目 ${q.id} 缺少 primarySkillId`).toBeTruthy();
        expect(nodeIds.has(q.primarySkillId!), `题目 ${q.id} 的 primarySkillId=${q.primarySkillId} 不在图谱中`).toBe(true);
        expect(q.evidenceType, `题目 ${q.id} 缺少 evidenceType`).toBeTruthy();
        expect(VALID_EVIDENCE_TYPES.has(q.evidenceType!), `题目 ${q.id} 的 evidenceType=${q.evidenceType} 不合法`).toBe(true);

        // secondarySkillIds 检查：最多 2 个，且引用合法
        if (q.secondarySkillIds) {
          expect(q.secondarySkillIds.length, `题目 ${q.id} 的 secondarySkillIds 超过 2 个`).toBeLessThanOrEqual(2);
          for (const sid of q.secondarySkillIds) {
            expect(nodeIds.has(sid), `题目 ${q.id} 的 secondarySkillId=${sid} 不在图谱中`).toBe(true);
          }
        }
      }
    });
  }
});

// ==========================================
// T3: 路径正确性
// ==========================================

describe('T3: getHardPrerequisitePath 路径正确性', () => {
  it('frac.notation 的路径包含 frac.whole 和 frac.equal_partition，且顺序正确', () => {
    const path = getHardPrerequisitePath('frac.notation', new Set());
    expect(path).toContain('frac.whole');
    expect(path).toContain('frac.equal_partition');
    // frac.whole -> frac.equal_partition -> frac.notation, 所以 whole 应在 equal_partition 前
    const wholeIdx = path.indexOf('frac.whole');
    const partIdx = path.indexOf('frac.equal_partition');
    expect(wholeIdx).toBeLessThan(partIdx);
  });

  it('无前置节点的技能路径返回空数组', () => {
    const path = getHardPrerequisitePath('frac.whole', new Set());
    expect(path).toEqual([]);
  });

  it('路径不包含目标节点本身', () => {
    const path = getHardPrerequisitePath('frac.multiple_units', new Set());
    expect(path).not.toContain('frac.multiple_units');
  });

  it('frac.divide_transform 路径包含 frac.reciprocal', () => {
    const path = getHardPrerequisitePath('frac.divide_transform', new Set());
    expect(path).toContain('frac.reciprocal');
  });

  it('frac.divide_transform 整个硬前置闭包拓扑顺序正确', () => {
    const path = getHardPrerequisitePath('frac.divide_transform', new Set());
    // 闭包包含的节点（path + target）
    const closureNodes = new Set([...path, 'frac.divide_transform']);

    // 对闭包内的每条 REQUIRES_HARD 边，from 必须在 to 之前出现
    for (const edge of graph.edges) {
      if (edge.type !== 'REQUIRES_HARD') continue;
      if (!closureNodes.has(edge.from) || !closureNodes.has(edge.to)) continue;

      const fromIdx = path.indexOf(edge.from);
      const toIdx = path.indexOf(edge.to);
      // from 应在 to 之前（to 可能是 target 本身，不在 path 中）
      const effectiveToIdx = toIdx === -1 ? path.length : toIdx;
      expect(fromIdx, `边 ${edge.from} → ${edge.to} 中 from 应在 to 之前`).toBeLessThan(effectiveToIdx);
    }
  });
});

// ==========================================
// T4: 已稳固节点不进入学习路径
// ==========================================

describe('T4: stable 节点从路径中移除', () => {
  it('已稳固的前置节点不出现在路径中，但路径顺序保持', () => {
    // frac.notation 的前置是 frac.whole 和 frac.equal_partition
    const stable = new Set(['frac.whole']);
    const path = getHardPrerequisitePath('frac.notation', stable);
    // frac.whole 已稳固，不应出现
    expect(path).not.toContain('frac.whole');
    // frac.equal_partition 未稳固，应出现
    expect(path).toContain('frac.equal_partition');
  });

  it('所有前置都已稳固时路径为空', () => {
    const prereqs = getHardPrerequisitePath('frac.notation', new Set());
    const allStable = new Set(prereqs);
    const path = getHardPrerequisitePath('frac.notation', allStable);
    expect(path).toEqual([]);
  });
});

// ==========================================
// T5: 进度兼容性 — skillEvidence 向后兼容
// ==========================================

describe('T5: loadProgress skillEvidence 向后兼容', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('旧格式进度（无 skillEvidence 字段）加载后 skillEvidence 为空对象', () => {
    localStorage.setItem(
      'math-k6-progress',
      JSON.stringify({
        passedKnowledgePoints: ['g3-fraction-intro'],
        stars: { 'g3-fraction-intro': 2 },
      }),
    );
    const p = loadProgress();
    expect(p.skillEvidence).toEqual({});
    expect(p.passedKnowledgePoints).toEqual(['g3-fraction-intro']);
  });

  it('包含 skillEvidence 的新格式正确加载', () => {
    const now = Date.now();
    const evidence = {
      'frac.notation': {
        attempts: 3,
        correct: 2,
        firstTryCorrect: 1,
        conceptual: 1,
        procedural: 1,
        transfer: 0,
        retention: 0,
        lastAttemptAt: now,
        lastMode: 'initial',
      },
    };
    localStorage.setItem(
      'math-k6-progress',
      JSON.stringify({
        passedKnowledgePoints: [],
        stars: {},
        skillEvidence: evidence,
      }),
    );
    const p = loadProgress();
    expect(p.skillEvidence?.['frac.notation']?.attempts).toBe(3);
    expect(p.skillEvidence?.['frac.notation']?.correct).toBe(2);
    expect(p.skillEvidence?.['frac.notation']?.lastMode).toBe('initial');
  });

  it('skillEvidence 中负数被截断为 0', () => {
    localStorage.setItem(
      'math-k6-progress',
      JSON.stringify({
        passedKnowledgePoints: [],
        stars: {},
        skillEvidence: {
          'frac.notation': {
            attempts: -5,
            correct: -1,
            firstTryCorrect: 0,
            conceptual: 0,
            procedural: 0,
            transfer: 0,
            retention: 0,
            lastAttemptAt: 0,
            lastMode: 'initial',
          },
        },
      }),
    );
    const p = loadProgress();
    expect(p.skillEvidence?.['frac.notation']?.attempts).toBe(0);
    expect(p.skillEvidence?.['frac.notation']?.correct).toBe(0);
  });

  it('非法的 lastMode 值被回退为 initial', () => {
    localStorage.setItem(
      'math-k6-progress',
      JSON.stringify({
        passedKnowledgePoints: [],
        stars: {},
        skillEvidence: {
          'frac.notation': {
            attempts: 1,
            correct: 1,
            firstTryCorrect: 1,
            conceptual: 1,
            procedural: 0,
            transfer: 0,
            retention: 0,
            lastAttemptAt: 0,
            lastMode: 'invalid_mode',
          },
        },
      }),
    );
    const p = loadProgress();
    expect(p.skillEvidence?.['frac.notation']?.lastMode).toBe('initial');
  });
});

// ==========================================
// T6: 技能证据不传播
// ==========================================

describe('T6: 技能证据不传播（下游课程完成不自动点亮技能）', () => {
  it('通过课程不自动点亮图谱技能', () => {
    const initial: ProgressData = { passedKnowledgePoints: [], stars: {} };
    const p = markInitialPass(initial, 'g3-fraction-intro', 3, Date.now(), true);
    // 课程通过了，但技能证据未记录 -> not_started
    expect(getSkillDisplayStatus(p, 'frac.notation')).toBe('not_started');
    expect(hasDirectSkillEvidence(p, 'frac.notation')).toBe(false);
  });

  it('只有显式调用 recordSkillEvidence 才更新技能状态', () => {
    let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
    p = recordSkillEvidence(p, 'frac.notation', true, true, 'conceptual', 'initial', Date.now());
    expect(getSkillDisplayStatus(p, 'frac.notation')).toBe('provisional');
    expect(hasDirectSkillEvidence(p, 'frac.notation')).toBe(true);
  });

  it('记录 frac.notation 证据不影响 frac.whole 的状态', () => {
    let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
    p = recordSkillEvidence(p, 'frac.notation', true, true, 'conceptual', 'initial', Date.now());
    expect(getSkillDisplayStatus(p, 'frac.whole')).toBe('not_started');
  });
});

// ==========================================
// T7: D7 状态转移
// ==========================================

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

describe('T7: D7 状态转移', () => {
  it('D7 retention 首次正确 + transfer 首次正确 达到 stable', () => {
    let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
    const skillId = 'frac.notation';

    // 模拟初始学习：conceptual + procedural + transfer
    p = recordSkillEvidence(p, skillId, true, true, 'conceptual', 'initial', NOW);
    p = recordSkillEvidence(p, skillId, true, true, 'procedural', 'initial', NOW + 1000);
    p = recordSkillEvidence(p, skillId, true, true, 'transfer', 'initial', NOW + 2000);

    // D7 retention 证据（首次正确）
    p = recordSkillEvidence(p, skillId, true, true, 'retention', 'd7', NOW + 7 * DAY);

    // F2 后：stable 只需 transfer > 0 && retention > 0（两者本身即代表首次正确）
    expect(getSkillDisplayStatus(p, skillId, NOW + 7 * DAY)).toBe('stable');
    const ev = p.skillEvidence?.[skillId];
    expect(ev?.retention).toBeGreaterThan(0);
    expect(ev?.transfer).toBeGreaterThan(0);
  });

  it('mastery loop D1 通过后 6 天复习到期，D7 通过后达到 stable', () => {
    let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
    p = markInitialPass(p, 'g5-fraction-meaning', 2, NOW, true);

    // D1 通过
    const afterD1 = markDelayedReviewPass(p, 'g5-fraction-meaning', NOW + DAY);
    expect(afterD1.mastery?.['g5-fraction-meaning']?.delayedReviewCount).toBe(1);
    expect(getMasteryStatus(afterD1, 'g5-fraction-meaning', NOW + DAY)).toBe('provisional');

    // D7 到期
    const d7Time = NOW + DAY + 6 * DAY;
    expect(getMasteryStatus(afterD1, 'g5-fraction-meaning', d7Time)).toBe('review_due');

    // D7 通过
    const afterD7 = markDelayedReviewPass(afterD1, 'g5-fraction-meaning', d7Time);
    expect(afterD7.mastery?.['g5-fraction-meaning']?.status).toBe('stable');
    expect(getMasteryStatus(afterD7, 'g5-fraction-meaning', d7Time)).toBe('stable');
  });
});

// ==========================================
// T8: 技能证据纯函数累积（渲染级防重测试见 gameRunner-flow.test.tsx）
// ==========================================

describe('T8: recordSkillEvidence 纯函数累积', () => {
  it('同一 skillId 调用两次累积记录', () => {
    let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
    p = recordSkillEvidence(p, 'frac.notation', true, true, 'conceptual', 'initial', NOW);
    p = recordSkillEvidence(p, 'frac.notation', true, false, 'procedural', 'initial', NOW + 1);
    const ev = p.skillEvidence?.['frac.notation'];
    expect(ev?.attempts).toBe(2);
    expect(ev?.correct).toBe(2);
  });

  it('recordSkillEvidence 是纯函数，不修改输入', () => {
    const initial: ProgressData = { passedKnowledgePoints: [], stars: {}, skillEvidence: {} };
    const updated = recordSkillEvidence(initial, 'frac.notation', true, true, 'conceptual', 'initial', NOW);
    // 原始对象未被修改
    expect(initial.skillEvidence?.['frac.notation']).toBeUndefined();
    expect(updated.skillEvidence?.['frac.notation']?.attempts).toBe(1);
  });

  it('不正确回答不增加 correct 计数', () => {
    let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
    p = recordSkillEvidence(p, 'frac.notation', false, false, 'conceptual', 'initial', NOW);
    const ev = p.skillEvidence?.['frac.notation'];
    expect(ev?.attempts).toBe(1);
    expect(ev?.correct).toBe(0);
    expect(ev?.conceptual).toBe(0);
  });

  it('needs_remediation: 3 次尝试正确率 < 40% 时返回 needs_remediation', () => {
    let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
    p = recordSkillEvidence(p, 'frac.notation', false, false, 'conceptual', 'initial', NOW);
    p = recordSkillEvidence(p, 'frac.notation', false, false, 'conceptual', 'initial', NOW + 1);
    p = recordSkillEvidence(p, 'frac.notation', false, false, 'conceptual', 'initial', NOW + 2);
    expect(getSkillDisplayStatus(p, 'frac.notation')).toBe('needs_remediation');
  });
});

// ==========================================
// F1: mergeSkillEvidence 幂等性
// ==========================================

describe('F1: mergeSkillEvidence 幂等性', () => {
  const sampleEvidence: SkillEvidenceRecord = {
    attempts: 5,
    correct: 3,
    firstTryCorrect: 2,
    conceptual: 1,
    procedural: 1,
    transfer: 1,
    retention: 0,
    lastAttemptAt: NOW,
    lastMode: 'initial',
  };

  it('mergeSkillEvidence(x, x) === x（自合并幂等）', () => {
    const merged = mergeSkillEvidence(sampleEvidence, sampleEvidence);
    expect(merged).toEqual(sampleEvidence);
  });

  it('连续合并同一远端快照不会增加计数', () => {
    const local = sampleEvidence;
    const remote = sampleEvidence;
    // 模拟登录合并：local + remote → merged1
    const merged1 = mergeSkillEvidence(local, remote);
    // 再次合并同一快照
    const merged2 = mergeSkillEvidence(merged1, remote);
    const merged3 = mergeSkillEvidence(merged2, remote);

    expect(merged1.attempts).toBe(5);
    expect(merged2.attempts).toBe(5);
    expect(merged3.attempts).toBe(5);
    expect(merged1.correct).toBe(3);
    expect(merged2.correct).toBe(3);
    expect(merged3.correct).toBe(3);
  });

  it('合并两个不同快照取 max 而非相加', () => {
    const a: SkillEvidenceRecord = {
      attempts: 3, correct: 2, firstTryCorrect: 1,
      conceptual: 1, procedural: 1, transfer: 0, retention: 0,
      lastAttemptAt: NOW, lastMode: 'initial',
    };
    const b: SkillEvidenceRecord = {
      attempts: 5, correct: 4, firstTryCorrect: 2,
      conceptual: 2, procedural: 1, transfer: 1, retention: 0,
      lastAttemptAt: NOW + 1000, lastMode: 'd1',
    };
    const merged = mergeSkillEvidence(a, b);
    expect(merged.attempts).toBe(5); // max(3, 5)
    expect(merged.correct).toBe(4); // max(2, 4)
    expect(merged.firstTryCorrect).toBe(2); // max(1, 2)
    expect(merged.transfer).toBe(1); // max(0, 1)
    expect(merged.lastMode).toBe('d1'); // 更晚的 mode
  });

  it('合并后不变量正确', () => {
    const a: SkillEvidenceRecord = {
      attempts: 2, correct: 2, firstTryCorrect: 2,
      conceptual: 1, procedural: 1, transfer: 2, retention: 1,
      lastAttemptAt: NOW, lastMode: 'd7',
    };
    const b: SkillEvidenceRecord = {
      attempts: 1, correct: 1, firstTryCorrect: 0,
      conceptual: 0, procedural: 0, transfer: 0, retention: 0,
      lastAttemptAt: NOW + 1000, lastMode: 'initial',
    };
    const merged = mergeSkillEvidence(a, b);
    // transfer = max(2, 0) = 2, firstTryCorrect = max(2, 0) = 2, OK
    expect(merged.transfer).toBeLessThanOrEqual(merged.firstTryCorrect);
    expect(merged.retention).toBeLessThanOrEqual(merged.firstTryCorrect);
    expect(merged.firstTryCorrect).toBeLessThanOrEqual(merged.correct);
    expect(merged.correct).toBeLessThanOrEqual(merged.attempts);
  });
});

// ==========================================
// F2: stable 判定（transfer/retention 只算首次正确）
// ==========================================

describe('F2: stable 判定', () => {
  it('transfer 非首次正确不能 stable', () => {
    let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
    const skillId = 'frac.notation';
    p = recordSkillEvidence(p, skillId, true, true, 'conceptual', 'initial', NOW);
    // transfer 正确但非首次（isFirstTry=false）→ transfer 不计数
    p = recordSkillEvidence(p, skillId, true, false, 'transfer', 'initial', NOW + 1000);
    // retention 首次正确
    p = recordSkillEvidence(p, skillId, true, true, 'retention', 'd7', NOW + 7 * DAY);
    // transfer=0, retention=1 → not stable
    expect(getSkillDisplayStatus(p, skillId, NOW + 7 * DAY)).not.toBe('stable');
  });

  it('retention 非首次正确不能 stable', () => {
    let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
    const skillId = 'frac.notation';
    p = recordSkillEvidence(p, skillId, true, true, 'transfer', 'initial', NOW);
    // retention 正确但非首次 → retention 不计数
    p = recordSkillEvidence(p, skillId, true, false, 'retention', 'd7', NOW + 7 * DAY);
    // transfer=1, retention=0 → not stable
    expect(getSkillDisplayStatus(p, skillId, NOW + 7 * DAY)).not.toBe('stable');
  });

  it('transfer 和 retention 都首次正确才 stable', () => {
    let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
    const skillId = 'frac.notation';
    p = recordSkillEvidence(p, skillId, true, true, 'transfer', 'initial', NOW);
    p = recordSkillEvidence(p, skillId, true, true, 'retention', 'd7', NOW + 7 * DAY);
    expect(getSkillDisplayStatus(p, skillId, NOW + 7 * DAY)).toBe('stable');
  });
});

// ==========================================
// F3: 待复习状态时间语义
// ==========================================

describe('F3: getSkillDisplayStatus 时间语义', () => {
  it('初始正确证据：1 天内为 provisional', () => {
    let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
    p = recordSkillEvidence(p, 'frac.notation', true, true, 'conceptual', 'initial', NOW);
    expect(getSkillDisplayStatus(p, 'frac.notation', NOW)).toBe('provisional');
    expect(getSkillDisplayStatus(p, 'frac.notation', NOW + DAY - 1)).toBe('provisional');
  });

  it('初始正确证据：1 天后为 review_due', () => {
    let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
    p = recordSkillEvidence(p, 'frac.notation', true, true, 'conceptual', 'initial', NOW);
    expect(getSkillDisplayStatus(p, 'frac.notation', NOW + DAY)).toBe('review_due');
  });

  it('D1 正确证据：第 5 天不是 due（provisional）', () => {
    let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
    p = recordSkillEvidence(p, 'frac.notation', true, true, 'conceptual', 'd1', NOW);
    expect(getSkillDisplayStatus(p, 'frac.notation', NOW + 5 * DAY)).toBe('provisional');
  });

  it('D1 正确证据：第 6 天是 due（review_due）', () => {
    let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
    p = recordSkillEvidence(p, 'frac.notation', true, true, 'conceptual', 'd1', NOW);
    expect(getSkillDisplayStatus(p, 'frac.notation', NOW + 6 * DAY)).toBe('review_due');
  });

  it('D7 未满足 stable：review_due', () => {
    let p: ProgressData = { passedKnowledgePoints: [], stars: {} };
    // 只有 transfer，没有 retention → not stable
    p = recordSkillEvidence(p, 'frac.notation', true, true, 'transfer', 'd7', NOW);
    expect(getSkillDisplayStatus(p, 'frac.notation', NOW)).toBe('review_due');
  });
});

// ==========================================
// 辅助：getCourseContext 返回分数课程上下文
// ==========================================

describe('getCourseContext 返回 7 门分数课程的上下文', () => {
  const FRACTION_COURSE_IDS = [
    'g3-fraction-intro',
    'g3-fraction-compare',
    'g3-fraction-add-sub',
    'g5-fraction-meaning',
    'g5-fraction-add-sub',
    'g6-fraction-mult',
    'g6-fraction-div',
  ];

  for (const courseId of FRACTION_COURSE_IDS) {
    it(`${courseId} 有 courseContext（不为 null）`, () => {
      const ctx = getCourseContext(courseId);
      expect(ctx, `getCourseContext(${courseId}) 返回 null`).not.toBeNull();
      expect(ctx!.coreSkills.length).toBeGreaterThan(0);
    });
  }

  it('未映射课程返回 null', () => {
    expect(getCourseContext('g3-rect-area')).toBeNull();
    expect(getCourseContext('unknown-course')).toBeNull();
  });
});

// ==========================================
// F8: 图谱关系边与定义稿一致
// ==========================================

describe('F8: 图谱关系边与定义稿一致', () => {
  function hasEdge(from: string, to: string, type: string): boolean {
    return graph.edges.some(
      (e) => e.from === from && e.to === to && e.type === type && e.status === 'published',
    );
  }

  it('Helpful: frac.representations -> frac.compare_same_denominator 存在', () => {
    expect(hasEdge('frac.representations', 'frac.compare_same_denominator', 'REQUIRES_HELPFUL')).toBe(true);
  });

  it('Helpful: frac.compare_same_denominator -> frac.add_sub_same_denominator 存在', () => {
    expect(hasEdge('frac.compare_same_denominator', 'frac.add_sub_same_denominator', 'REQUIRES_HELPFUL')).toBe(true);
  });

  it('Helpful: frac.representations -> frac.add_sub_same_denominator 不存在（错误边已移除）', () => {
    expect(hasEdge('frac.representations', 'frac.add_sub_same_denominator', 'REQUIRES_HELPFUL')).toBe(false);
  });

  it('Helpful: frac.multiple_units -> frac.multiply_integer 存在', () => {
    expect(hasEdge('frac.multiple_units', 'frac.multiply_integer', 'REQUIRES_HELPFUL')).toBe(true);
  });

  it('Helpful: frac.multiply_integer -> frac.of_quantity 存在', () => {
    expect(hasEdge('frac.multiply_integer', 'frac.of_quantity', 'REQUIRES_HELPFUL')).toBe(true);
  });

  it('Helpful: frac.multiple_units -> frac.of_quantity 不存在（错误边已移除）', () => {
    expect(hasEdge('frac.multiple_units', 'frac.of_quantity', 'REQUIRES_HELPFUL')).toBe(false);
  });

  it('Generalizes: frac.equivalence -> bridge.fraction_decimal 存在', () => {
    expect(hasEdge('frac.equivalence', 'bridge.fraction_decimal', 'GENERALIZES_TO')).toBe(true);
  });

  it('Generalizes: bridge.fraction_decimal -> bridge.fraction_percent 存在', () => {
    expect(hasEdge('bridge.fraction_decimal', 'bridge.fraction_percent', 'GENERALIZES_TO')).toBe(true);
  });

  it('Generalizes: frac.equivalence -> bridge.fraction_percent 不存在（错误边已移除）', () => {
    expect(hasEdge('frac.equivalence', 'bridge.fraction_percent', 'GENERALIZES_TO')).toBe(false);
  });

  it('4 种关系类型仍然各至少有 1 条', () => {
    const types = new Set(graph.edges.map((e) => e.type));
    expect(types.has('REQUIRES_HARD')).toBe(true);
    expect(types.has('REQUIRES_HELPFUL')).toBe(true);
    expect(types.has('GENERALIZES_TO')).toBe(true);
    expect(types.has('CONTRASTS_WITH')).toBe(true);
  });
});

// ==========================================
// F9: 题目与技能的教研映射精确断言
// ==========================================

describe('F9: 题目技能映射精确断言', () => {
  const gameModules = import.meta.glob<{ default: unknown }>(
    '@/content/knowledge-points/*/game.json',
    { eager: true },
  );

  function getGame(courseId: string) {
    const key = Object.keys(gameModules).find((k) => k.includes(`/${courseId}/game.json`));
    return key ? (gameModules[key]?.default as {
      knowledgePointId: string;
      questions: Array<{ id: string; primarySkillId?: string; evidenceType?: string; secondarySkillIds?: string[]; correctAnswer: string | string[]; prompt: string }>;
      reviewSets?: {
        d1?: { questions: Array<{ id: string; primarySkillId?: string; evidenceType?: string; secondarySkillIds?: string[]; correctAnswer: string | string[]; prompt: string }> };
        d7?: { questions: Array<{ id: string; primarySkillId?: string; evidenceType?: string; secondarySkillIds?: string[]; correctAnswer: string | string[]; prompt: string }> };
      };
    }) : null;
  }

  function findQuestion(game: NonNullable<ReturnType<typeof getGame>>, qid: string) {
    const all = [
      ...game.questions,
      ...(game.reviewSets?.d1?.questions ?? []),
      ...(game.reviewSets?.d7?.questions ?? []),
    ];
    return all.find((q) => q.id === qid);
  }

  it('g3-fraction-intro/q6: 主技能 frac.multiple_units，次含 frac.notation', () => {
    const game = getGame('g3-fraction-intro')!;
    const q = findQuestion(game, 'q6')!;
    expect(q.primarySkillId).toBe('frac.multiple_units');
    expect(q.secondarySkillIds).toContain('frac.notation');
  });

  it('g3-fraction-compare/q5: 主技能 frac.compare_same_numerator，次含 frac.same_whole', () => {
    const game = getGame('g3-fraction-compare')!;
    const q = findQuestion(game, 'q5')!;
    expect(q.primarySkillId).toBe('frac.compare_same_numerator');
    expect(q.secondarySkillIds).toContain('frac.same_whole');
  });

  it('g5-fraction-meaning/q1: 主技能 frac.multiple_units', () => {
    const game = getGame('g5-fraction-meaning')!;
    const q = findQuestion(game, 'q1')!;
    expect(q.primarySkillId).toBe('frac.multiple_units');
  });

  it('g6-fraction-mult/q5: 主技能 frac.one_boundary，次含 frac.of_quantity', () => {
    const game = getGame('g6-fraction-mult')!;
    const q = findQuestion(game, 'q5')!;
    expect(q.primarySkillId).toBe('frac.one_boundary');
    expect(q.secondarySkillIds).toContain('frac.of_quantity');
  });

  it('g6-fraction-div/q5: 平均分情境，答案 1/4，主技能 frac.division_sharing', () => {
    const game = getGame('g6-fraction-div')!;
    const q = findQuestion(game, 'q5')!;
    expect(q.primarySkillId).toBe('frac.division_sharing');
    expect(q.prompt).toContain('平均分');
    expect(q.correctAnswer).toBe('1/4');
  });

  it('g6-fraction-div/d7q2: 平均分情境，答案 1/4，主技能 frac.division_sharing', () => {
    const game = getGame('g6-fraction-div')!;
    const q = findQuestion(game, 'd7q2')!;
    expect(q.primarySkillId).toBe('frac.division_sharing');
    expect(q.prompt).toContain('平均分');
    expect(q.correctAnswer).toBe('1/4');
  });

  it('g6-fraction-div/d1q2: 主技能 frac.divide_transform，证据类型 transfer', () => {
    const game = getGame('g6-fraction-div')!;
    const q = findQuestion(game, 'd1q2')!;
    expect(q.primarySkillId).toBe('frac.divide_transform');
    expect(q.evidenceType).toBe('transfer');
  });

  it('g3-fraction-intro/d1-q1: 主技能 frac.notation，证据类型 transfer', () => {
    const game = getGame('g3-fraction-intro')!;
    const q = findQuestion(game, 'd1-q1')!;
    expect(q.primarySkillId).toBe('frac.notation');
    expect(q.evidenceType).toBe('transfer');
  });

  it('7 门分数课总数仍为 70', () => {
    const IDS = [
      'g3-fraction-intro', 'g3-fraction-compare', 'g3-fraction-add-sub',
      'g5-fraction-meaning', 'g5-fraction-add-sub',
      'g6-fraction-mult', 'g6-fraction-div',
    ];
    let total = 0;
    for (const id of IDS) {
      const g = getGame(id)!;
      total += g.questions.length;
      total += g.reviewSets?.d1?.questions.length ?? 0;
      total += g.reviewSets?.d7?.questions.length ?? 0;
    }
    expect(total).toBe(70);
  });
});

// ==========================================
// F10: 目标路径拓扑顺序——教学优先级
// ==========================================

describe('F10: getHardPrerequisitePath 教学优先级', () => {
  it('默认分数除法路径第一步为 frac.whole（最低年级基础）', () => {
    const path = getHardPrerequisitePath('frac.divide_transform', new Set());
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toBe('frac.whole');
  });

  it('G3 基础节点出现在 G6 支线之前', () => {
    const path = getHardPrerequisitePath('frac.divide_transform', new Set());
    const g3Idx = path.indexOf('frac.whole');
    const g6Idx = path.findIndex((id) => {
      const node = graph.nodes.find((n) => n.id === id);
      return node && node.gradeRange[0] === 6;
    });
    expect(g3Idx).toBeGreaterThanOrEqual(0);
    expect(g6Idx).toBeGreaterThan(g3Idx);
  });

  it('拓扑仍然正确：所有硬边 from < to', () => {
    const path = getHardPrerequisitePath('frac.divide_transform', new Set());
    const closureNodes = new Set([...path, 'frac.divide_transform']);
    for (const edge of graph.edges) {
      if (edge.type !== 'REQUIRES_HARD') continue;
      if (!closureNodes.has(edge.from) || !closureNodes.has(edge.to)) continue;
      const fromIdx = path.indexOf(edge.from);
      const toIdx = path.indexOf(edge.to);
      const effectiveToIdx = toIdx === -1 ? path.length : toIdx;
      expect(fromIdx, `边 ${edge.from} → ${edge.to} 中 from 应在 to 之前`).toBeLessThan(effectiveToIdx);
    }
  });
});

// ==========================================
// F12: hasMeaningfulProgress
// ==========================================

describe('F12: hasMeaningfulProgress', () => {
  it('只有 skillEvidence 有内容时为 true', () => {
    const p: ProgressData = {
      passedKnowledgePoints: [],
      stars: {},
      skillEvidence: {
        'frac.notation': {
          attempts: 1, correct: 1, firstTryCorrect: 1,
          conceptual: 1, procedural: 0, transfer: 0, retention: 0,
          lastAttemptAt: 1000, lastMode: 'initial',
        },
      },
    };
    expect(hasMeaningfulProgress(p)).toBe(true);
  });

  it('只有 currentLearning 有内容时为 true', () => {
    const p: ProgressData = {
      passedKnowledgePoints: [],
      stars: {},
      currentLearning: 'g3-fraction-intro',
    };
    expect(hasMeaningfulProgress(p)).toBe(true);
  });

  it('全部为空时为 false', () => {
    const p: ProgressData = {
      passedKnowledgePoints: [],
      stars: {},
    };
    expect(hasMeaningfulProgress(p)).toBe(false);
  });

  it('skillEvidence 有字段但 attempts=0 时为 false', () => {
    const p: ProgressData = {
      passedKnowledgePoints: [],
      stars: {},
      skillEvidence: {
        'frac.notation': {
          attempts: 0, correct: 0, firstTryCorrect: 0,
          conceptual: 0, procedural: 0, transfer: 0, retention: 0,
          lastAttemptAt: 0, lastMode: 'initial',
        },
      },
    };
    expect(hasMeaningfulProgress(p)).toBe(false);
  });
});
