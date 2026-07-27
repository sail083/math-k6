// ===== 基础类型 =====
export type Grade = 3 | 4 | 5 | 6;
export type TextbookVersion = '人教版' | '北师大版' | '苏教版';

// 所有可视化组件类型
export type VizType =
  | 'area-grid'
  | 'fraction-pie'
  | 'number-line'
  | 'shape-transform'
  | 'circle-unroll'
  | 'cuboid-model'
  | 'balance-scale'
  | 'coordinate-grid'
  | 'bar-chart'
  | 'place-value-chart'
  | 'protractor'
  | 'clock-dial'
  | 'probability-model'
  | 'pie-chart'
  | 'cylinder-model'
  | 'cone-model';

// ===== 知识点元数据 =====
export interface TextbookRef {
  version: TextbookVersion;
  grade: Grade;
  chapter: string; // 如 '三下第5单元'
}

export interface KnowledgePointMeta {
  id: string;                    // 如 'g3-rect-area'
  grade: Grade;
  unit: number;                  // 单元序号
  title: string;                 // 如 '长方形面积'
  objectives: string[];          // 学习目标
  prerequisites: string[];       // 前置知识点 ID 列表
  textbookRefs: TextbookRef[];   // 多教材版本映射
  vizType: VizType;              // 使用的可视化组件类型
  hasFormula: boolean;           // 是否有公式推导
  formula?: string;              // 如 'S = a × b'
}

// ===== 推导过程（公式"原理讲解" — 需求3 核心）=====
export interface ShapeSpec {
  id: string;
  type: string;                  // 'rect' | 'triangle' | 'circle' | 'parallelogram' | 'trapezoid' | 'line' | 'arrow' | 'grid' | 'pie' | 'text' | 'cuboid' 等
  // 几何属性
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  // 多边形顶点（三角形、平行四边形、梯形）
  points?: Array<{ x: number; y: number }>;
  // 视觉样式
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;             // 角度（度）
  transform?: string;            // CSS/SVG transform 字符串
  // 文本
  text?: string;
  fontSize?: number;
  textFill?: string;
  // 网格专用（AreaGrid）
  rows?: number;
  cols?: number;
  cellSize?: number;
  highlightCells?: Array<{ row: number; col: number }>;
  showCount?: boolean;
  // 可见性
  visible?: boolean;
  // 各可视化类型的自定义数据
  data?: Record<string, unknown>;
}

export interface LabelSpec {
  id?: string;
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  fill?: string;
  anchor?: 'start' | 'middle' | 'end';
}

export interface AnimationSpec {
  type: 'fade' | 'slide' | 'rotate' | 'scale' | 'transform';
  duration?: number;            // 毫秒
  delay?: number;                // 毫秒
  easing?: string;
  from?: Record<string, unknown>;
  to?: Record<string, unknown>;
}

export interface DerivationScene {
  shapes: ShapeSpec[];
  labels: LabelSpec[];
  formula?: string;              // 当前步骤的公式状态
  highlight?: string[];          // 需要高亮的 shape ID 列表
  animate?: AnimationSpec;
}

export interface DerivationStep {
  title: string;
  narration: string;
  scene: DerivationScene;
  hint?: string;
}

export interface Derivation {
  title: string;
  formula?: string;
  steps: DerivationStep[];
}

// ===== 游戏 / 闯关（需求4: 过关小游戏）=====
export type GameType =
  | 'choice'           // 单选题
  | 'fill-blank'       // 填空题
  | 'drag-match'       // 拖拽匹配（公式 ↔ 图形）
  | 'drag-assemble'    // 拖拽拼装推导步骤
  | 'timeline'         // 排序题（拖拽重排）
  | 'timed-challenge'  // 限时挑战
  | 'true-false';      // 判断题

export interface DragItemSpec {
  id: string;
  label: string;
  target?: string;               // 匹配题的目标槽位 ID
  order?: number;                // 拖拽拼装 / 排序题的顺序
}

export interface Question {
  id: string;
  type: GameType;
  prompt: string;
  options?: string[];            // 选择题 / 判断题选项
  correctAnswer: string | string[];
  explanation: string;
  dragItems?: DragItemSpec[];    // 拖拽匹配 / 拖拽拼装用
  timeLimit?: number;            // 限时挑战（秒）
  points: number;
}

export interface GameConfig {
  knowledgePointId: string;
  passThreshold: number;         // 如 0.8 表示需要 80% 正确率才能过关
  questions: Question[];
}

// ===== 学习进度 =====
export interface ProgressData {
  passedKnowledgePoints: string[];
  stars: Record<string, number>; // 知识点 ID -> 1-3 星
}

// ===== 组合知识点（从内容文件加载）=====
export interface KnowledgePoint {
  meta: KnowledgePointMeta;
  explanation: string;           // 来自 explain.md 的 Markdown 文本
  derivation?: Derivation;        // 可选（并非所有知识点都有公式推导）
  game?: GameConfig;              // 可选（并非所有知识点都有游戏）
}
