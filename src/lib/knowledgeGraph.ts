/**
 * 分数领域知识图谱 — 纯函数库
 *
 * 规则：
 * - 路径只由 REQUIRES_HARD 边计算，不使用向量距离
 * - 不调用网络，不产生副作用
 * - 所有函数无状态
 */

import graphData from '@/content/knowledge-graph/fraction-graph-v0.1.json';

// ===== 类型定义 =====

export type RelationType =
  | 'REQUIRES_HARD'
  | 'REQUIRES_HELPFUL'
  | 'GENERALIZES_TO'
  | 'CONTRASTS_WITH';

export interface SkillNode {
  id: string;
  name: string;
  definition: string;
  boundary: string;
  gradeRange: [number, number];
  schoolStage: 'primary' | 'middle';
  misconceptions: string[];
  status: 'draft' | 'reviewed' | 'published' | 'retired';
}

export interface GraphEdge {
  from: string;
  to: string;
  type: RelationType;
  reason: string;
  failurePoint?: string;
  evidence?: string;
  version: string;
  status: 'proposed' | 'approved' | 'published' | 'retired';
}

export interface CourseMapping {
  courseId: string;
  coreSkills: string[];
  reviewSkills: string[];
  transferSkills: string[];
}

export interface KnowledgeGraph {
  version: string;
  nodes: SkillNode[];
  edges: GraphEdge[];
  courseMappings: CourseMapping[];
}

// ===== 图谱数据 =====

export const graph: KnowledgeGraph = graphData as unknown as KnowledgeGraph;

// ===== 校验函数 =====

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 校验图谱完整性：
 * 1. 节点 ID 唯一
 * 2. 边引用的节点存在
 * 3. 课程映射引用的节点和课程存在
 * 4. REQUIRES_HARD 子图无环
 */
export function validateGraph(g: KnowledgeGraph = graph): ValidationResult {
  const errors: string[] = [];
  const nodeIds = new Set<string>();

  // 1. 节点唯一性
  for (const node of g.nodes) {
    if (nodeIds.has(node.id)) {
      errors.push(`重复节点 ID: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  // 2. 边引用合法
  for (const edge of g.edges) {
    if (!nodeIds.has(edge.from)) {
      errors.push(`边 ${edge.from} -> ${edge.to} 中 from 节点不存在`);
    }
    if (!nodeIds.has(edge.to)) {
      errors.push(`边 ${edge.from} -> ${edge.to} 中 to 节点不存在`);
    }
  }

  // 3. 课程映射引用合法
  for (const cm of g.courseMappings) {
    const allSkills = [...cm.coreSkills, ...cm.reviewSkills, ...cm.transferSkills];
    for (const skillId of allSkills) {
      if (!nodeIds.has(skillId)) {
        errors.push(`课程映射 ${cm.courseId} 引用了不存在的技能 ${skillId}`);
      }
    }
  }

  // 4. REQUIRES_HARD 无环（DFS 检测）
  const hardEdges = g.edges.filter((e) => e.type === 'REQUIRES_HARD');
  const adj = new Map<string, string[]>();
  for (const id of nodeIds) {
    adj.set(id, []);
  }
  for (const e of hardEdges) {
    if (adj.has(e.from)) {
      adj.get(e.from)!.push(e.to);
    }
  }

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  for (const id of nodeIds) color.set(id, WHITE);

  function dfs(node: string): boolean {
    color.set(node, GRAY);
    for (const next of adj.get(node) ?? []) {
      if (color.get(next) === GRAY) {
        errors.push(`REQUIRES_HARD 图中存在环：${node} -> ${next}`);
        return true;
      }
      if (color.get(next) === WHITE && dfs(next)) {
        return true;
      }
    }
    color.set(node, BLACK);
    return false;
  }

  for (const id of nodeIds) {
    if (color.get(id) === WHITE) {
      dfs(id);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ===== 路径算法 =====

/**
 * 计算目标技能的所有硬前置（REQUIRES_HARD 反向闭包），并做拓扑排序。
 * 已稳固技能（stableSkillIds）可以从结果中移除，但不破坏剩余节点的拓扑顺序。
 *
 * @param targetSkillId 目标技能 ID
 * @param stableSkillIds 已稳固技能 ID 集合（可安全跳过）
 * @param g 知识图谱数据（默认使用全局 graph）
 * @returns 拓扑排序后的技能 ID 数组（不含目标本身）
 */
export function getHardPrerequisitePath(
  targetSkillId: string,
  stableSkillIds: Set<string> = new Set(),
  g: KnowledgeGraph = graph,
): string[] {
  const hardEdges = g.edges.filter((e) => e.type === 'REQUIRES_HARD');

  // 反向图：target <- from（"target 需要 from"）
  const reverseAdj = new Map<string, string[]>();
  for (const e of hardEdges) {
    if (!reverseAdj.has(e.to)) reverseAdj.set(e.to, []);
    reverseAdj.get(e.to)!.push(e.from);
  }

  // BFS 收集所有前置
  const visited = new Set<string>();
  const queue: string[] = [targetSkillId];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);
    for (const prereq of reverseAdj.get(curr) ?? []) {
      if (!visited.has(prereq)) {
        queue.push(prereq);
      }
    }
  }

  // 移除目标本身
  visited.delete(targetSkillId);

  // 在收集到的节点集合中，按 REQUIRES_HARD 边做拓扑排序
  const nodeSet = visited;
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const id of nodeSet) {
    adj.set(id, []);
    inDegree.set(id, 0);
  }
  for (const e of hardEdges) {
    if (nodeSet.has(e.from) && nodeSet.has(e.to)) {
      adj.get(e.from)!.push(e.to);
      inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
    }
  }

  // Build node publication order and grade maps for stable teaching priority
  const nodeOrder = new Map<string, number>();
  const nodeGrade = new Map<string, number>();
  for (let i = 0; i < g.nodes.length; i++) {
    nodeOrder.set(g.nodes[i].id, i);
    nodeGrade.set(g.nodes[i].id, g.nodes[i].gradeRange[0]);
  }

  function compareTeachingPriority(a: string, b: string): number {
    const ga = nodeGrade.get(a) ?? 99;
    const gb = nodeGrade.get(b) ?? 99;
    if (ga !== gb) return ga - gb;
    return (nodeOrder.get(a) ?? 0) - (nodeOrder.get(b) ?? 0);
  }

  // Kahn's algorithm with stable teaching priority:
  // Among zero-indegree nodes, pick lowest grade first, then earliest published.
  const topoResult: string[] = [];
  const startNodes = [...nodeSet].filter((id) => (inDegree.get(id) ?? 0) === 0);
  const topoQueue: string[] = [...startNodes].sort(compareTeachingPriority);

  while (topoQueue.length > 0) {
    const curr = topoQueue.shift()!;
    topoResult.push(curr);
    const newlyAvailable: string[] = [];
    for (const next of adj.get(curr) ?? []) {
      const deg = (inDegree.get(next) ?? 0) - 1;
      inDegree.set(next, deg);
      if (deg === 0) newlyAvailable.push(next);
    }
    if (newlyAvailable.length > 0) {
      topoQueue.push(...newlyAvailable);
      topoQueue.sort(compareTeachingPriority);
    }
  }

  // 移除已稳固节点，保持剩余节点相对顺序
  return topoResult.filter((id) => !stableSkillIds.has(id));
}

// ===== 局部上下文 =====

export interface SkillContext {
  /** 当前技能节点 */
  skill: SkillNode | null;
  /** 直接硬前置技能 */
  hardPrerequisites: SkillNode[];
  /** 有帮助前置技能 */
  helpfulPrerequisites: SkillNode[];
  /** 以此技能为前置的下游技能（REQUIRES_HARD） */
  nextSkills: SkillNode[];
  /** 易混对比技能 */
  contrastSkills: SkillNode[];
  /** 映射到此技能的课程 */
  mappedCourses: Array<{ courseId: string; role: 'core' | 'review' | 'transfer' }>;
}

function findNode(id: string, g: KnowledgeGraph): SkillNode | null {
  return g.nodes.find((n) => n.id === id) ?? null;
}

/**
 * 获取技能的局部上下文：前置、下游、对比、映射课程。
 */
export function getSkillContext(skillId: string, g: KnowledgeGraph = graph): SkillContext {
  const skill = findNode(skillId, g);
  const hardPrerequisites: SkillNode[] = [];
  const helpfulPrerequisites: SkillNode[] = [];
  const nextSkills: SkillNode[] = [];
  const contrastSkills: SkillNode[] = [];

  for (const e of g.edges) {
    if (e.to === skillId && e.type === 'REQUIRES_HARD') {
      const node = findNode(e.from, g);
      if (node) hardPrerequisites.push(node);
    }
    if (e.to === skillId && e.type === 'REQUIRES_HELPFUL') {
      const node = findNode(e.from, g);
      if (node) helpfulPrerequisites.push(node);
    }
    if (e.from === skillId && e.type === 'REQUIRES_HARD') {
      const node = findNode(e.to, g);
      if (node) nextSkills.push(node);
    }
    if (e.type === 'CONTRASTS_WITH') {
      if (e.from === skillId) {
        const node = findNode(e.to, g);
        if (node) contrastSkills.push(node);
      } else if (e.to === skillId) {
        const node = findNode(e.from, g);
        if (node) contrastSkills.push(node);
      }
    }
  }

  const mappedCourses: SkillContext['mappedCourses'] = [];
  for (const cm of g.courseMappings) {
    if (cm.coreSkills.includes(skillId)) {
      mappedCourses.push({ courseId: cm.courseId, role: 'core' });
    } else if (cm.reviewSkills.includes(skillId)) {
      mappedCourses.push({ courseId: cm.courseId, role: 'review' });
    } else if (cm.transferSkills.includes(skillId)) {
      mappedCourses.push({ courseId: cm.courseId, role: 'transfer' });
    }
  }

  return { skill, hardPrerequisites, helpfulPrerequisites, nextSkills, contrastSkills, mappedCourses };
}

/**
 * 获取课程的局部知识链：前置课程技能、核心技能、下游技能、对比技能。
 * 对未映射课程返回 null（不报错）。
 */
export interface CourseContext {
  coreSkills: SkillNode[];
  reviewSkills: SkillNode[];
  transferSkills: SkillNode[];
  /** 下游课程（以核心技能为前置的技能所属课程） */
  nextCourseIds: string[];
  /** 易混对比技能 */
  contrastSkills: SkillNode[];
}

export function getCourseContext(courseId: string, g: KnowledgeGraph = graph): CourseContext | null {
  const cm = g.courseMappings.find((m) => m.courseId === courseId);
  if (!cm) return null;

  const toNodes = (ids: string[]) =>
    ids.map((id) => findNode(id, g)).filter(Boolean) as SkillNode[];

  const coreSkills = toNodes(cm.coreSkills);
  const reviewSkills = toNodes(cm.reviewSkills);
  const transferSkills = toNodes(cm.transferSkills);

  // 找下游课程：以核心技能为硬前置的技能 -> 其所属课程
  const nextCourseIdSet = new Set<string>();
  for (const skillId of cm.coreSkills) {
    for (const e of g.edges) {
      if (e.from === skillId && e.type === 'REQUIRES_HARD') {
        // 找哪些课程的 coreSkills 包含 e.to
        for (const otherCm of g.courseMappings) {
          if (otherCm.courseId !== courseId && otherCm.coreSkills.includes(e.to)) {
            nextCourseIdSet.add(otherCm.courseId);
          }
        }
      }
    }
  }

  // 对比技能：课程核心技能的 CONTRASTS_WITH 关系
  const contrastSkillSet = new Set<string>();
  for (const skillId of cm.coreSkills) {
    for (const e of g.edges) {
      if (e.type === 'CONTRASTS_WITH') {
        if (e.from === skillId && e.to !== skillId) contrastSkillSet.add(e.to);
        if (e.to === skillId && e.from !== skillId) contrastSkillSet.add(e.from);
      }
    }
  }
  const contrastSkills = [...contrastSkillSet]
    .map((id) => findNode(id, g))
    .filter(Boolean) as SkillNode[];

  return {
    coreSkills,
    reviewSkills,
    transferSkills,
    nextCourseIds: [...nextCourseIdSet],
    contrastSkills,
  };
}

// ===== 补修建议 =====

export interface RemediationSuggestion {
  skillId: string;
  skillName: string;
  reason: string;
  /** 映射到此技能的课程 ID（可直接跳转） */
  courseId?: string;
}

/**
 * 找到最近的、尚无直接证据的硬前置，生成补修建议。
 *
 * @param currentSkillId 当前失败的技能 ID
 * @param hasEvidence 技能 ID -> 是否有直接证据（由调用方传入）
 */
export function getRemediationSuggestion(
  currentSkillId: string,
  hasEvidence: (skillId: string) => boolean,
  g: KnowledgeGraph = graph,
): RemediationSuggestion | null {
  // 找直接硬前置中无证据的最近节点（BFS，浅层优先）
  const hardEdges = g.edges.filter((e) => e.type === 'REQUIRES_HARD');
  const reverseAdj = new Map<string, string[]>();
  for (const e of hardEdges) {
    if (!reverseAdj.has(e.to)) reverseAdj.set(e.to, []);
    reverseAdj.get(e.to)!.push(e.from);
  }

  const visited = new Set<string>([currentSkillId]);
  const queue: string[] = [currentSkillId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const prereq of reverseAdj.get(curr) ?? []) {
      if (visited.has(prereq)) continue;
      visited.add(prereq);
      if (!hasEvidence(prereq)) {
        const node = findNode(prereq, g);
        if (!node) continue;
        // 找映射课程
        let courseId: string | undefined;
        for (const cm of g.courseMappings) {
          if (cm.coreSkills.includes(prereq)) {
            courseId = cm.courseId;
            break;
          }
        }
        return {
          skillId: prereq,
          skillName: node.name,
          reason: `"${node.name}"是学习当前内容的必要前置，尚无直接证据。`,
          courseId,
        };
      }
      queue.push(prereq);
    }
  }
  return null;
}

// ===== 向量审核文本 =====

/**
 * 导出每个节点的审核 embedding 文本（只返回文本，不调用网络）。
 */
export function getNodeAuditTexts(g: KnowledgeGraph = graph): Record<string, string> {
  const result: Record<string, string> = {};
  for (const node of g.nodes) {
    const misconceptionText = node.misconceptions.length > 0
      ? `常见误区：${node.misconceptions.join('；')}。`
      : '';
    result[node.id] = `技能名称：${node.name}。定义：${node.definition} 独立验证边界：${node.boundary} ${misconceptionText}`.trim();
  }
  return result;
}

// ===== 便捷查询 =====

/** 根据 ID 查找技能节点 */
export function getSkillById(skillId: string, g: KnowledgeGraph = graph): SkillNode | null {
  return findNode(skillId, g);
}

/** 获取所有已发布技能节点 */
export function getAllPublishedSkills(g: KnowledgeGraph = graph): SkillNode[] {
  return g.nodes.filter((n) => n.status === 'published');
}

/** 获取课程映射 */
export function getCourseMapping(courseId: string, g: KnowledgeGraph = graph): CourseMapping | null {
  return g.courseMappings.find((cm) => cm.courseId === courseId) ?? null;
}

/** 获取技能的所有核心课程 ID */
export function getSkillCourseIds(skillId: string, g: KnowledgeGraph = graph): string[] {
  return g.courseMappings
    .filter((cm) => cm.coreSkills.includes(skillId))
    .map((cm) => cm.courseId);
}
