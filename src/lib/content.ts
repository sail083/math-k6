import type { KnowledgePoint, KnowledgePointMeta, Derivation, GameConfig, Grade } from './types';

// 元数据：eager 加载（用于列表展示，体积小）
const metaModules = import.meta.glob('/src/content/knowledge-points/*/meta.json', {
  eager: true,
  import: 'default',
}) as Record<string, KnowledgePointMeta>;

// 讲解 / 推导 / 游戏：lazy 加载（体积大，按需请求）
const explainLoader = import.meta.glob('/src/content/knowledge-points/*/explain.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

const derivationLoader = import.meta.glob('/src/content/knowledge-points/*/derivation.json', {
  import: 'default',
}) as Record<string, () => Promise<Derivation>>;

const gameLoader = import.meta.glob('/src/content/knowledge-points/*/game.json', {
  import: 'default',
}) as Record<string, () => Promise<GameConfig>>;

// 从路径中提取知识点 ID：'/src/content/knowledge-points/g3-rect-area/meta.json' -> 'g3-rect-area'
function extractId(path: string): string {
  const match = path.match(/\/knowledge-points\/([^/]+)\//);
  return match ? match[1] : '';
}

// 构建"仅元数据"的知识点映射（同步函数使用，不包含 explanation/derivation/game）
const knowledgePoints: Record<string, KnowledgePoint> = {};

for (const [path, meta] of Object.entries(metaModules)) {
  const id = extractId(path);
  if (!id) continue;

  knowledgePoints[id] = {
    meta,
    explanation: '',
    derivation: undefined,
    game: undefined,
  };
}

/** 获取所有知识点，按年级和单元排序（仅元数据） */
export function getAllKnowledgePoints(): KnowledgePoint[] {
  return Object.values(knowledgePoints).sort((a, b) => {
    if (a.meta.grade !== b.meta.grade) return a.meta.grade - b.meta.grade;
    return a.meta.unit - b.meta.unit;
  });
}

/** 根据 ID 获取单个知识点（仅元数据，不含讲解/推导/游戏） */
export function getKnowledgePointById(id: string): KnowledgePoint | undefined {
  return knowledgePoints[id];
}

/** 获取指定年级的所有知识点（仅元数据） */
export function getKnowledgePointsByGrade(grade: Grade): KnowledgePoint[] {
  return Object.values(knowledgePoints)
    .filter((kp) => kp.meta.grade === grade)
    .sort((a, b) => a.meta.unit - b.meta.unit);
}

/** 获取所有支持的年级 */
export function getGrades(): Grade[] {
  return [3, 4, 5, 6];
}

/** 异步加载知识点完整详情（元数据 + 讲解 + 推导 + 游戏） */
export async function loadKnowledgePointDetail(id: string): Promise<KnowledgePoint | undefined> {
  const meta = knowledgePoints[id]?.meta;
  if (!meta) return undefined;

  const explainPath = `/src/content/knowledge-points/${id}/explain.md`;
  const derivPath = `/src/content/knowledge-points/${id}/derivation.json`;
  const gamePath = `/src/content/knowledge-points/${id}/game.json`;

  const [explain, derivation, game] = await Promise.all([
    explainLoader[explainPath]?.().catch((e) => {
      console.error(`[content] Failed to load explain.md for ${id}:`, e);
      return '';
    }),
    derivationLoader[derivPath]?.().catch((e) => {
      console.error(`[content] Failed to load derivation.json for ${id}:`, e);
      return undefined;
    }),
    gameLoader[gamePath]?.().catch((e) => {
      console.error(`[content] Failed to load game.json for ${id}:`, e);
      return undefined;
    }),
  ]);

  return {
    meta,
    explanation: explain ?? '',
    derivation,
    game,
  };
}
