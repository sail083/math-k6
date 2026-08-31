// ===== 基础类型 =====
export type Grade = 3 | 4 | 5 | 6;
export type TextbookVersion = '人教版' | '北师大版' | '苏教版';
export type TextbookFilter = '全部' | TextbookVersion;
export type Semester = '上册' | '下册';
export type CourseTrack = 'base' | 'extension' | 'challenge';

// 所有可视化组件类型
export type VizType =
  | 'column-arithmetic'
  | 'remainder-groups'
  | 'trial-division'
  | 'decimal-place-value'
  | 'decimal-product'
  | 'decimal-quotient'
  | 'fraction-product'
  | 'fraction-quotient'
  | 'measurement-lab'
  | 'fraction-compare-model'
  | 'fraction-equivalence'
  | 'decimal-equivalence'
  | 'line-relations'
  | 'quadrilateral-constraints'
  | 'probability-experiment'
  | 'percent-grid'
  | 'ratio-mixture'
  | 'proportion-table'
  | 'coordinate-scale'
  | 'place-value-product'
  | 'perimeter-walk'
  | 'operation-laws'
  | 'partial-products'
  | 'fraction-common-parts'
  | 'circle-roll'
  | 'cylinder-layers'
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
  track?: Exclude<CourseTrack, 'base'>; // 缺省为课内基础；非 base 不参与教材编排
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

export type EvidenceType = 'conceptual' | 'procedural' | 'transfer' | 'retention';

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
  // ===== 知识图谱技能映射（向后兼容可选字段）=====
  primarySkillId?: string;       // 主技能 ID（如 'frac.notation'）
  secondarySkillIds?: string[];  // 次技能 ID（最多 2 个）
  evidenceType?: EvidenceType;   // 证据类型
}

export interface ReviewSet {
  questions: Question[];              // form A (backward-compatible)
}

/** Skill-repair review set: extends ReviewSet with a required form-B alternate set */
export interface SkillReviewSet extends ReviewSet {
  alternateQuestions: Question[];     // form B (fresh evidence opportunity)
}

export interface GameConfig {
  knowledgePointId: string;
  passThreshold: number;         // 如 0.8 表示需要 80% 正确率才能过关
  questions: Question[];
  reviewSets?: {                 // 可选：延迟复习题集（仅试点课程有）
    d1?: ReviewSet;              // D1 复习：初次通过后 1 天
    d7?: ReviewSet;              // D7 复习：D1 通过后 6 天
  };
}

// ===== 语文 / 英语顺序课程（独立于数学知识点内容模型）=====
export type LanguageSubject = 'chinese' | 'english';

export type LanguageQuestion = Question & {
  type: 'choice' | 'fill-blank';
};

export interface LanguageLesson {
  id: string;
  title: string;
  summary: string;
  body: string;
  speakable?: boolean;
  questions: LanguageQuestion[];
}

// ===== 学习进度 =====

/** 掌握状态：learning(学习中) / provisional(当堂会) / review_due(待复习) / stable(已稳固) */
export type MasteryStatus = 'learning' | 'provisional' | 'review_due' | 'stable';

/** 单个知识点的掌握记录 */
export interface MasteryRecord {
  status: MasteryStatus;
  lastAttemptAt: number;         // 上次答题时间戳
  nextReviewAt: number;          // 下次复习到期时间戳（0 表示不需要复习）
  delayedReviewCount: number;    // 已完成的延迟复习次数（0/1/2）
}

/** v0.3：单个技能的复习调度记录 */
export interface SkillReviewSchedule {
  skillId: string;
  targetSkillId: string;
  stage: 'd1' | 'd7';
  status: 'scheduled' | 'due' | 'passed' | 'failed';
  dueAt: number;
  updatedAt: number;
  contentVersion: string;
  firstExposure: boolean;
  formId: 'a' | 'b';                // current review form (default/backward-compatible = 'a')
  attemptNo: number;                // >= 1, increments on each valid attempt
}

/** v0.3 实验分组：repair=补修路径, course=完整课程路径, observer=快速通过观察 */
export type ExperimentAssignment = 'repair' | 'course' | 'observer';

/** v0.3：课程干预会话（诊断失败或复习失败后分配 course 组的持续跟踪标记） */
export interface CourseIntervention {
  skillId: string;
  targetSkillId: string;
  courseId: string;
  variant: 'course';
  status: 'active' | 'completed';
  updatedAt: number;
  reviewStage?: 'd1' | 'd7';        // target review stage after course completion (for review remediation)
  nextForm?: 'a' | 'b';             // form to schedule after course completion
  origin?: 'diagnostic' | 'review'; // whether intervention came from diagnostic or review-form failure
}

export interface LanguageLessonProgress {
  completedLessonIds: string[];
  currentLessonId: string | null;
  updatedAt: number;
}

export interface ProgressData {
  passedKnowledgePoints: string[];
  stars: Record<string, number>; // 知识点 ID -> 1-3 星
  mastery?: Record<string, MasteryRecord>; // 知识点 ID -> 掌握记录（仅含复习题集的课程）
  currentLearning?: string | null;          // 当前学习中课程 ID（用于恢复）
  // ===== 知识图谱技能证据（向后兼容可选字段）=====
  skillEvidence?: Record<string, SkillEvidenceRecord>;
  // ===== v0.2：学习目标与补修会话 =====
  learningGoal?: {
    skillId: string;
    startedAt: number;
    updatedAt: number;
    source: LearningGoalSource;
  };
  repairSession?: {
    skillId: string;
    targetSkillId: string;
    status: 'active' | 'completed';
    updatedAt: number;
  };
  // ===== v0.3：技能复习调度 =====
  skillReviews?: Record<string, SkillReviewSchedule>;
  // ===== v0.3：实验分组 =====
  experimentAssignments?: Record<string, ExperimentAssignment>;
  // ===== v0.3：课程干预 =====
  courseIntervention?: CourseIntervention;
  // ===== 综合学习平台：语文 / 英语顺序课程 =====
  languageLessons?: Partial<Record<LanguageSubject, LanguageLessonProgress>>;
}

/** 技能证据模式 */
export type SkillEvidenceMode = 'initial' | 'd1' | 'd7' | 'repair';

/** 学习目标来源：home=首页快捷目标, map=知识地图选择, course=课程页面进入 */
export type LearningGoalSource = 'home' | 'map' | 'course';

/** 学习事件名：v0.3 基础 8 项 + v0.4 新增 8 项，共 16 项，必须与 DB chk_event_name 一致 */
export type LearningEventName =
  | 'home_task_viewed'
  | 'home_task_opened'
  | 'intervention_assigned'
  | 'intervention_completed'
  | 'skill_review_scheduled'
  | 'skill_review_started'
  | 'skill_review_finished'
  | 'stable_achieved'
  // v0.4: goal continuity
  | 'goal_entry_viewed'
  | 'learning_goal_started'
  | 'goal_path_viewed'
  | 'target_resume_shown'
  | 'target_resume_opened'
  | 'target_learning_started'
  | 'target_learning_completed'
  | 'repair_unavailable_shown';

/** 单个微技能的题目证据 */
export interface SkillEvidenceRecord {
  attempts: number;              // 总提交次数
  correct: number;               // 正确次数
  firstTryCorrect: number;       // 首次无提示正确次数
  conceptual: number;            // conceptual 类型正确次数
  procedural: number;            // procedural 类型正确次数
  transfer: number;              // transfer 类型正确次数
  retention: number;             // retention 类型正确次数（D7 首次正确）
  lastAttemptAt: number;         // 最后一次提交时间戳
  lastMode: SkillEvidenceMode;   // 最后一次提交的模式
}

// ===== 组合知识点（从内容文件加载）=====
export interface KnowledgePoint {
  meta: KnowledgePointMeta;
  explanation: string;           // 来自 explain.md 的 Markdown 文本
  derivation?: Derivation;        // 可选（并非所有知识点都有公式推导）
  game?: GameConfig;              // 可选（并非所有知识点都有游戏）
}

// ===== v0.2：微补修单元 =====

export interface RepairLesson {
  /** 一句儿童可懂的核心解释 */
  coreExplanation: string;
  /** 2-4 个短步骤 */
  steps: string[];
  /** 与诊断/验证题数字不同的 worked example */
  workedExample: {
    question: string;
    steps: string[];
    answer: string;
  };
  /** 典型误区和纠正说明 */
  misconception: {
    mistake: string;
    correction: string;
  };
}

export interface RepairUnit {
  skillId: string;
  estimatedMinutes: number;           // 3-5
  courseId: string;
  diagnosticQuestions: Question[];    // 恰好 2 道
  lesson: RepairLesson;
  checkQuestions: Question[];         // 恰好 2 道，evidenceType=transfer
  reviewSets?: {                      // v0.3：技能延迟复习题集
    d1?: SkillReviewSet;              // D1 复习：补修通过后 1 天
    d7?: SkillReviewSet;              // D7 复习：D1 通过后 6 天
  };
}
