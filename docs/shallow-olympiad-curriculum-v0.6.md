# math-k6 v0.6 浅奥课程树与分批交付矩阵

> 状态：课程树冻结；公共三层体验与批次 A 落地，批次 B/C 仅规划。

## 1. 课程边界

- 总树固定 20 门，G3-G6 每个年级 5 门。
- `track` 只取 `extension` 或 `challenge`；缺省为课内基础。
- `prerequisites` 是课程依赖的唯一事实源，不维护 `baseCourseId`。
- 所有课程复用同一套探索→发现→挑战、progress、session 与 D1/D7。
- 批次 B/C 的 10 门课不创建目录、空元数据或占位题库。

## 2. 全量 20 门课程矩阵

| 年级 | 课程 ID | 层级 | 批次 | 状态 | 核心方法 | 主要课内来源 |
|---|---|---|---|---|---|---|
| G3 | `g3-cycle-pattern` | challenge | v0.5 | 已落地 | 最小周期、余数边界 | 有余数除法、时分秒 |
| G3 | `g3-systematic-enumeration` | extension | v0.5 | 已落地 | 分类、固定顺序、不重不漏 | 万以内加减、多位数乘一位数 |
| G3 | `g3-smart-calculation` | extension | A | 已落地 | 凑整、补偿、拆分、逆向验算 | 加减、乘法、测量 |
| G3 | `g3-perimeter-area-puzzle` | extension | A | 已落地 | 拼接边、切割、消失边、格点 | 测量、周长、面积 |
| G3 | `g3-fraction-visual-reasoning` | extension | A | 已落地 | 同整体、等分、图形与数轴 | 分数认识、比较、同分母加减 |
| G4 | `g4-sum-difference` | extension | v0.5 | 已落地 | 去差平分、线段图 | 加减、除法 |
| G4 | `g4-sum-difference-multiple` | challenge | v0.5 | 已落地 | 一倍量、和倍、差倍 | 和差问题、两位数除法 |
| G4 | `g4-operation-patterns` | challenge | A | 已落地 | 分配、配对、不变量、算式改写 | 大数、乘除、运算定律 |
| G4 | `g4-angle-shape-reasoning` | challenge | A | 已落地 | 角度守恒、分类、剪拼、反例 | 角、平行垂直、四边形、三角形 |
| G4 | `g4-decimal-data-reasoning` | extension | B | 待实施 | 数位不变量、图表读数、近似检查 | 条形图、小数意义/性质/加减 |
| G5 | `g5-chicken-rabbit` | challenge | v0.5 | 已落地 | 列表、假设、替换 | 枚举、和差倍 |
| G5 | `g5-decimal-equation-reasoning` | extension | B | 待实施 | 估算、逆向检查、等量 | 小数乘除、简易方程 |
| G5 | `g5-area-composition` | challenge | B | 待实施 | 分割、补形、等积变形 | 平行四边形、三角形、梯形面积 |
| G5 | `g5-spatial-modeling` | challenge | B | 待实施 | 展开、投影、表面与体积边界 | 位置、长方体表面积/体积 |
| G5 | `g5-interval-counting` | challenge | B | 待实施 | 点-段-次数、端点、封闭周期 | 植树、时分秒、余数、周期 |
| G6 | `g6-fraction-strategy` | extension | C | 待实施 | 表征切换、量与率、逆运算 | 分数意义/加减/乘除 |
| G6 | `g6-ratio-percent-modeling` | extension | C | 待实施 | 同比缩放、百分率、比例不变量 | 比、百分数、比例 |
| G6 | `g6-circle-sector-reasoning` | challenge | C | 待实施 | 剪拼近似、圆与扇形数据 | 圆周长/面积、扇形统计图 |
| G6 | `g6-solid-geometry-reasoning` | challenge | C | 待实施 | 展开、等底等高、体积比 | 圆柱表面积/体积、圆锥体积 |
| G6 | `g6-data-probability-reasoning` | challenge | C | 待实施 | 多表征数据、概率判断、枚举验证 | 条形图、扇形图、百分数、可能性、枚举 |

## 3. 47 门课内基础课逐一去向

| 年级 | 基础课 ID | 进阶去向 |
|---|---|---|
| G3 | `g3-add-sub-10000` | `g3-smart-calculation`, `g3-systematic-enumeration`, `g4-sum-difference` |
| G3 | `g3-mult-1digit` | `g3-smart-calculation`, `g3-systematic-enumeration` |
| G3 | `g3-division-remainder` | `g3-cycle-pattern`, `g4-sum-difference`, `g5-interval-counting` |
| G3 | `g3-time` | `g3-cycle-pattern`, `g5-interval-counting` |
| G3 | `g3-measurement` | `g3-smart-calculation`, `g3-perimeter-area-puzzle` |
| G3 | `g3-rect-area` | `g3-perimeter-area-puzzle` |
| G3 | `g3-rect-perimeter` | `g3-perimeter-area-puzzle` |
| G3 | `g3-fraction-intro` | `g3-fraction-visual-reasoning`, `g6-fraction-strategy` |
| G3 | `g3-fraction-compare` | `g3-fraction-visual-reasoning` |
| G3 | `g3-fraction-add-sub` | `g3-fraction-visual-reasoning` |
| G4 | `g4-large-numbers` | `g4-operation-patterns` |
| G4 | `g4-mult-2digit` | `g4-operation-patterns` |
| G4 | `g4-div-2digit` | `g4-sum-difference-multiple`, `g4-operation-patterns` |
| G4 | `g4-angle-measure` | `g4-angle-shape-reasoning` |
| G4 | `g4-parallel-perpendicular` | `g4-angle-shape-reasoning` |
| G4 | `g4-parallelogram-trapezoid` | `g4-angle-shape-reasoning` |
| G4 | `g4-bar-chart` | `g4-decimal-data-reasoning`, `g6-data-probability-reasoning` |
| G4 | `g4-arith-laws` | `g4-operation-patterns` |
| G4 | `g4-decimal-meaning` | `g4-decimal-data-reasoning` |
| G4 | `g4-decimal-properties` | `g4-decimal-data-reasoning` |
| G4 | `g4-decimal-add-sub` | `g4-decimal-data-reasoning` |
| G4 | `g4-triangle` | `g4-angle-shape-reasoning` |
| G5 | `g5-decimal-mult` | `g5-decimal-equation-reasoning` |
| G5 | `g5-decimal-div` | `g5-decimal-equation-reasoning` |
| G5 | `g5-equation` | `g5-decimal-equation-reasoning` |
| G5 | `g5-parallelogram-area` | `g5-area-composition` |
| G5 | `g5-triangle-area` | `g5-area-composition` |
| G5 | `g5-trapezoid-area` | `g5-area-composition` |
| G5 | `g5-position` | `g5-spatial-modeling` |
| G5 | `g5-possibility` | `g6-data-probability-reasoning` |
| G5 | `g5-tree-planting` | `g5-interval-counting` |
| G5 | `g5-cuboid-surface` | `g5-spatial-modeling` |
| G5 | `g5-cuboid-volume` | `g5-spatial-modeling` |
| G5 | `g5-fraction-meaning` | `g6-fraction-strategy` |
| G5 | `g5-fraction-add-sub` | `g6-fraction-strategy` |
| G6 | `g6-fraction-mult` | `g6-fraction-strategy` |
| G6 | `g6-fraction-div` | `g6-fraction-strategy` |
| G6 | `g6-ratio` | `g6-ratio-percent-modeling` |
| G6 | `g6-circle-perimeter` | `g6-circle-sector-reasoning` |
| G6 | `g6-circle-area` | `g6-circle-sector-reasoning` |
| G6 | `g6-percentage` | `g6-ratio-percent-modeling`, `g6-data-probability-reasoning` |
| G6 | `g6-sector-chart` | `g6-circle-sector-reasoning`, `g6-data-probability-reasoning` |
| G6 | `g6-cylinder-surface` | `g6-solid-geometry-reasoning` |
| G6 | `g6-cylinder-volume` | `g6-solid-geometry-reasoning` |
| G6 | `g6-cone-volume` | `g6-solid-geometry-reasoning` |
| G6 | `g6-proportion` | `g6-ratio-percent-modeling` |
| G6 | `g6-scale` | `g6-ratio-percent-modeling` |

## 4. 分批范围

### 批次 A：公共体验与 5 门首批课

- `g3-smart-calculation`
- `g3-perimeter-area-puzzle`
- `g3-fraction-visual-reasoning`
- `g4-operation-patterns`
- `g4-angle-shape-reasoning`

### 批次 B：G4/G5 进阶补全（仅规划）

- `g4-decimal-data-reasoning`
- `g5-decimal-equation-reasoning`
- `g5-area-composition`
- `g5-spatial-modeling`
- `g5-interval-counting`

### 批次 C：G6 综合迁移（仅规划）

- `g6-fraction-strategy`
- `g6-ratio-percent-modeling`
- `g6-circle-sector-reasoning`
- `g6-solid-geometry-reasoning`
- `g6-data-probability-reasoning`

## 5. 单课内容验收模板

### meta.json

- ID 稳定，年级与层级正确。
- `prerequisites` 全部存在，无环，不得出现高层反向依赖低层。
- 非 base 课程 `textbookRefs=[]`，不伪造教材引用。
- `vizType` 必须直接支持本课核心关系；无关模型宁可不用。

### explain.md

- 至少包含：核心方法、成立原因、分步方法、边界/反例、常见误区。
- 规律必须是课程专属的条件/方法/原因，不得复述 objectives。
- 正文例题的数字和语境不得原样进入主题、D1 或 D7。

### game.json

- 主题恰好 6 道，其中恰好 1 道非选择迁移题。
- 主题至少覆盖概念识别、方法选择、边界、反例/检查、新情境迁移。
- D1/D7 各恰好 2 道：1 选择 + 1 填空。
- D7 必须隐藏关键条件或更换表征，不得只换数字。
- 每个答案必须独立重算，选项唯一，解析能回指方法与边界。

### 交互与可访问性

- 探索任务必须与本课模型一致，至少可改变两个情况后再进入“发现”。
- 390px 无横向溢出，触控目标不小于 44px。
- 三层切换使用 tab 语义，当前层级不只靠颜色表达。
- 非 base 课程不消费、不写入分数 learningGoal。

## 6. 发布边界

- 批次 A 可独立发布，但只声称已上线的 10 门进阶课（v0.5 五门 + A 五门）。
- “20 门全量浅奥树”是内容规划，批次 B/C 未有真实内容前不得在 UI 显示占位课。
- 测试、构建与本地浏览器证据不等于生产验收；合并、部署与生产数据回读需独立授权。
