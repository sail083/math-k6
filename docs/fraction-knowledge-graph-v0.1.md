# 分数领域知识图谱定义稿 v0.1

> 状态：产品与教研评审稿
> 范围：K9 产品愿景下的 G3—G6 分数纵向知识链
> 本稿只定义产品、图谱和体验，不代表进入开发。

## 1. 产品结论

本版本采用：

> **显式、可审核的有向知识图谱作为教学事实；向量作为语义检索和候选关系发现工具；学生掌握状态由真实题目证据驱动。**

不采用“将课程文本向量化后，按向量距离自动串成学习路线”。

原因：

- 语义相近不等于存在先修关系。
- 向量距离不能可靠表达关系方向、强弱和类型。
- 教材位置、课程相似度、认知依赖和学习迁移是四类不同事实。
- 数学学习路径必须能够说明“缺少 A 时，学习 B 的哪一步会失败”。

## 2. 产品目标

### 2.1 用户问题

当前产品已经有 47 门课程和 D1/D7 复习，但学生看到的仍是课程列表：

- 不知道不同年级的知识如何纵向连接。
- 不知道为什么下一步应该学这门课。
- 某个知识点卡住时，只能重学整门课程。
- 同一数学能力在三套教材和多门课程中重复出现，但没有统一身份。

### 2.2 版本目标

1. 建立“课程之下”的分数微技能图谱。
2. 串起三、五、六年级的分数学习路径。
3. 让学生看懂“以前学过什么、正在学什么、之后可以学什么”。
4. 支持从目标知识反向生成合法学习路径。
5. 支持定位薄弱前置并进行 3—5 分钟补修。
6. 通过向量搜索辅助教研发现相似、重复和遗漏关系。
7. 现在冻结可扩展到一至九年级的图谱契约，避免小学版本形成死结构。

### 2.3 非目标

- 不在 P0 对外宣称已覆盖完整 K9；当前内容只覆盖 G3—G6。
- 不一次拆解全部 47 门课。
- 不改变现有 D1/D7 掌握判定。
- 不建设开放式聊天老师。
- 不使用复杂图数据库、GraphRAG、GNN 或知识追踪模型。

## 3. 角色

| 角色 | 权限与目标 |
|---|---|
| 学生 | 查看自己的路径和状态，进入课程，自由跳学或接受补修建议 |
| 数学内容编辑 | 拆分微技能、提供定义、边界、例题、教材证据和候选关系 |
| 审核教师 | 审核节点粒度、关系类型、方向和教学理由，发布图谱版本 |
| AI 教研助手 | 生成向量、查重、提出候选关系和依据，无发布权限 |
| 系统推荐器 | 只在已发布图谱中计算合法路径，不创建节点和关系 |

P0 不建设家长端和多儿童档案。

## 4. 图谱本体

### 4.1 层级

```text
K9 数学（产品愿景）
├── 小学阶段 G1—G6
│   └── 领域 → 主题 → 课程 → 微技能
└── 初中阶段 G7—G9
    └── 领域 → 主题 → 课程 → 微技能
```

P0 当前只发布小学 G3—G6 已有内容，不展示 G1—G2、G7—G9 空入口。

儿童可见领域：

1. 数字与运算
2. 数量关系
3. 图形与测量
4. 数据与随机

### 4.2 节点类型

| 类型 | 说明 |
|---|---|
| `Course` | 当前 47 门课程容器，不等同于原子知识点 |
| `Skill` | 可在 5—15 分钟内独立教学和验证的微技能 |
| `Question` | 初始、D1、D7、迁移和补修题 |
| `Representation` | 分数条、面积模型、集合模型、数轴、算式等表征 |
| `Misconception` | 教师审核的典型误区 |
| `CurriculumPlacement` | 教材版本、年级、册次、单元落点 |

P0 学生端主要消费 `Course`、`Skill` 和已发布关系。

K9 架构约束：

- `skillId` 不包含年级、教材或课程 ID。
- `schoolStage` 使用 `primary | middle`，年级使用 1—9 的独立字段。
- 同一技能允许映射到多个年级和教材落点，不复制技能节点。
- 小学直观表征与初中符号化学习通过证据层级表达，不为同一数学事实重复建节点。
- 跨学段推荐必须经过审核发布的“升学桥”，不能直接跨阶段跳转。

### 4.3 关系类型

P0 只发布四类技能关系：

| 类型 | 方向 | 用途 |
|---|---|---|
| `REQUIRES_HARD` | 有向 | 缺少前置会显著阻碍后续学习 |
| `REQUIRES_HELPFUL` | 有向 | 掌握前置会降低学习负担，但不是必需 |
| `GENERALIZES_TO` | 有向 | 从特殊情形推广到一般情形 |
| `CONTRASTS_WITH` | 对称 | 用于辨析易混概念，不参与先修排序 |

其他映射关系：

```text
COURSE_TEACHES_SKILL
QUESTION_ASSESSES_SKILL
SKILL_REPRESENTED_BY
WRONG_RESPONSE_INDICATES
COURSE_LOCATED_AT
```

每条正式 `REQUIRES_HARD` 必须包含：

- 方向和强度；
- 教学理由；
- “缺少前置时，后续哪一步会失败”的反事实说明；
- 教材或课程证据；
- 审核人、审核时间和图谱版本。

## 5. 分数微技能节点 v0.1

### 5.1 基础认识

| ID | 微技能 | 主要年级 | 独立验证边界 |
|---|---|---:|---|
| `frac.whole` | 确定单位“1” | G3/G5 | 能指出题目中被看作整体的对象 |
| `frac.equal_partition` | 理解平均分 | G3 | 能区分平均分与任意切分 |
| `frac.need` | 理解分数产生的需要 | G3 | 能说明整数不足以表示剩余部分的情境 |
| `frac.notation` | 分子、分母、分数线 | G3 | 能解释各部分含义，而非只会认名称 |
| `frac.unit_fraction` | 单位分数 | G3 | 能识别若干份中的一份 |
| `frac.multiple_units` | 若干个单位分数 | G3 | 能将 3/5 解释为 3 个 1/5 |
| `frac.representations` | 面积、集合、数轴表征 | G3/G5 | 能在不同表征间识别同一分数 |
| `frac.same_whole` | 比较和运算中的同整体条件 | G3/G5 | 能拒绝直接比较不同单位“1”的份数 |

### 5.2 比较和初步运算

| ID | 微技能 | 主要年级 | 独立验证边界 |
|---|---|---:|---|
| `frac.compare_same_denominator` | 同分母比较 | G3 | 能解释分数单位相同时比较份数 |
| `frac.compare_same_numerator` | 同分子比较 | G3 | 能解释份数相同时每份越大分数越大 |
| `frac.add_sub_same_denominator` | 同分母分数加减 | G3/G5 | 能按相同分数单位合并或移除份数 |
| `frac.one_boundary` | 和整体“1”的关系 | G3/G5 | 能判断结果小于、等于或大于 1 |

### 5.3 意义深化与等值变换

| ID | 微技能 | 主要年级 | 独立验证边界 |
|---|---|---:|---|
| `frac.as_quotient` | 分数表示除法结果 | G5 | 能在 a÷b 与 a/b 间转换 |
| `frac.equivalence` | 识别等值分数 | G5 | 能用表征证明两个分数相等 |
| `frac.basic_property` | 分数基本性质 | G5 | 能说明分子分母同时乘除同一非零数大小不变 |
| `frac.common_factor` | 公因数基础 | G5 | 能找到分子分母的公因数 |
| `frac.reduction` | 约分 | G5 | 能用基本性质将分数化简 |
| `frac.simplest_form` | 最简分数 | G5 | 能判断分子分母是否互质 |
| `frac.common_multiple` | 公倍数基础 | G5 | 能找到分母的公倍数和最小公倍数 |
| `frac.common_denominator` | 通分 | G5 | 能把异分母分数转成同分母等值分数 |
| `frac.add_sub_unlike_denominator` | 异分母分数加减 | G5 | 能先统一分数单位再运算 |
| `frac.number_types` | 真分数、假分数、带分数 | G5 | 能分类并解释与整体“1”的关系 |

### 5.4 乘除法

| ID | 微技能 | 主要年级 | 独立验证边界 |
|---|---|---:|---|
| `frac.multiply_integer` | 分数乘整数 | G6 | 能联系重复相加解释算理 |
| `frac.of_quantity` | 求一个量的几分之几 | G6 | 能识别乘法语义并建立数量关系 |
| `frac.multiply_fraction` | 分数乘分数 | G6 | 能用面积或集合交叠解释乘法 |
| `frac.reduce_before_multiply` | 先约分再乘 | G6 | 能在保持等值的前提下交叉约分 |
| `frac.reciprocal` | 倒数与乘积为 1 | G6 | 能说明倒数条件并处理整数形式 |
| `frac.division_grouping` | 包含除：里面有几个 | G6 | 能用等值细分解释分数除法 |
| `frac.division_sharing` | 平均分：每份多少 | G6 | 能区分包含除和平均分 |
| `frac.divide_transform` | 除以分数转化为乘倒数 | G6 | 能用倒数和乘法验证转化，不只背口诀 |

### 5.5 跨主题桥接节点

| ID | 微技能 | 映射主题 |
|---|---|---|
| `bridge.fraction_decimal` | 分数与小数互化 | 小数、百分数 |
| `bridge.fraction_percent` | 分数与百分数互化 | 百分数 |
| `bridge.fraction_ratio` | 分数、除法与比 | 比 |
| `bridge.ratio_proportion` | 等值比与比例 | 比例 |

P0 合计：30 个分数微技能 + 4 个桥接节点。

## 6. 关系清单 v0.1

### 6.1 已确认硬前置

```text
frac.whole
→ frac.equal_partition
→ frac.notation
→ frac.unit_fraction
→ frac.multiple_units

frac.whole
→ frac.same_whole

frac.multiple_units + frac.same_whole
→ frac.compare_same_denominator

frac.unit_fraction + frac.same_whole
→ frac.compare_same_numerator

frac.multiple_units + frac.same_whole
→ frac.add_sub_same_denominator

frac.notation
→ frac.as_quotient

frac.notation
→ frac.equivalence
→ frac.basic_property

frac.common_factor + frac.basic_property
→ frac.reduction
→ frac.simplest_form

frac.common_multiple + frac.basic_property
→ frac.common_denominator

frac.common_denominator + frac.add_sub_same_denominator
→ frac.add_sub_unlike_denominator

frac.of_quantity
→ frac.multiply_fraction

frac.reduction + frac.multiply_fraction
→ frac.reduce_before_multiply

frac.notation + frac.multiply_fraction
→ frac.reciprocal

frac.reciprocal + frac.multiply_fraction
+ frac.division_grouping + frac.division_sharing
→ frac.divide_transform
```

### 6.2 有帮助但不锁定的前置

以下关系在 P0 标记为 `REQUIRES_HELPFUL`，只影响推荐解释和排序，不阻止学生进入后续节点：

```text
frac.representations
→ frac.compare_same_denominator
→ frac.add_sub_same_denominator

frac.compare_same_denominator
→ frac.common_denominator

frac.multiple_units
→ frac.multiply_integer
→ frac.of_quantity

frac.basic_property
→ frac.reciprocal

frac.equivalence
→ frac.division_grouping

frac.equal_partition
→ frac.division_sharing

frac.add_sub_unlike_denominator
→ frac.multiply_fraction
```

### 6.3 推广关系

```text
frac.add_sub_same_denominator
→ frac.add_sub_unlike_denominator

frac.multiply_integer
→ frac.multiply_fraction

frac.as_quotient
→ bridge.fraction_ratio
→ bridge.ratio_proportion

frac.equivalence
→ bridge.fraction_decimal
→ bridge.fraction_percent
```

### 6.4 易混对比关系

```text
frac.equal_partition ↔ “只数块数，不看是否等份”
frac.compare_same_denominator ↔ frac.compare_same_numerator
frac.reduction ↔ frac.common_denominator
frac.multiply_integer ↔ frac.of_quantity
frac.division_grouping ↔ frac.division_sharing
bridge.fraction_percent ↔ “增长百分比与占整体百分比”
```

误区本身落为 `Misconception` 节点，以上仅表示需要在产品中提供对比入口。

## 7. 现有课程映射

| 课程 | 核心微技能 | 前置/复习微技能 | 迁移微技能 |
|---|---|---|---|
| `g3-fraction-intro` | `frac.whole`、`frac.equal_partition`、`frac.notation`、`frac.unit_fraction`、`frac.multiple_units` | `frac.need` | `frac.representations`、`frac.same_whole` |
| `g3-fraction-compare` | `frac.compare_same_denominator`、`frac.compare_same_numerator` | `frac.whole`、`frac.unit_fraction`、`frac.same_whole` | `frac.one_boundary` |
| `g3-fraction-add-sub` | `frac.add_sub_same_denominator` | `frac.multiple_units`、`frac.same_whole` | `frac.one_boundary` |
| `g5-fraction-meaning` | `frac.as_quotient`、`frac.equivalence`、`frac.basic_property`、`frac.reduction`、`frac.simplest_form`、`frac.common_denominator`、`frac.number_types` | `frac.whole`、`frac.notation`、`frac.common_factor`、`frac.common_multiple` | `bridge.fraction_decimal`、`bridge.fraction_ratio` |
| `g5-fraction-add-sub` | `frac.add_sub_unlike_denominator` | `frac.add_sub_same_denominator`、`frac.common_denominator`、`frac.reduction` | `frac.simplest_form`、`frac.one_boundary` |
| `g6-fraction-mult` | `frac.multiply_integer`、`frac.of_quantity`、`frac.multiply_fraction`、`frac.reduce_before_multiply` | `frac.equivalence`、`frac.reduction` | `frac.one_boundary` |
| `g6-fraction-div` | `frac.reciprocal`、`frac.division_grouping`、`frac.division_sharing`、`frac.divide_transform` | `frac.multiply_fraction`、`frac.equivalence` | `frac.one_boundary` |
| `g6-ratio` | `bridge.fraction_ratio` | `frac.as_quotient`、`frac.basic_property` | `bridge.ratio_proportion` |
| `g6-percentage` | `bridge.fraction_decimal`、`bridge.fraction_percent` | `frac.equivalence` | `frac.one_boundary` |
| `g6-proportion` | `bridge.ratio_proportion` | `bridge.fraction_ratio`、`frac.basic_property` | — |

### 7.1 课程缺口

当前 47 门课中没有独立的“公因数/公倍数”课程，但约分和通分依赖这两项技能。

P0 允许存在“不对应独立课程的基础微技能”，处理方式：

- 映射到现有课程中的短讲解和题目；
- 可作为 3—5 分钟补修节点；
- 不为补齐图谱而机械创建完整课程。

## 8. 学生掌握覆盖

不为每名学生复制图谱。全局共享知识图谱，学生仅保存微技能证据和派生状态。

### 8.1 证据类型

| 类型 | 含义 |
|---|---|
| `conceptual` | 理解意义、条件和边界 |
| `procedural` | 能正确执行计算或操作 |
| `transfer` | 能在新数字、新情境或新表征中使用 |
| `retention` | D1/D7 延迟后仍能首次无提示正确 |

### 8.2 状态

沿用当前状态：

```text
未学习 → 学习中 → 当堂会 → 待复习 → 已稳固
```

`需补修`为运行时派生标签，不新增掌握状态。

### 8.3 派生规则

- 观看讲解或完成课程不自动掌握全部微技能。
- 每道题绑定一个主技能，最多两个次技能。
- 下游成功不能自动点亮前置技能。
- 下游失败只能触发前置诊断，不能直接断言前置失败。
- `已稳固`要求直接证据、延迟证据和无提示迁移证据。
- 原题答案已经显示后，原题重答不计为新掌握证据。

## 9. 推荐路径算法

### 9.1 目标驱动路径

```text
学生选择目标技能
→ 反向计算 REQUIRES_HARD 闭包
→ 移除已稳固且未到期节点
→ 对剩余节点拓扑排序
→ 选择第一个合法节点
→ 返回固定原因码和解释
```

### 9.2 断点补修

```text
当前技能连续失败
→ 找到未有直接证据的最近硬前置
→ 进行 2 分钟诊断
→ 命中则进入 3—5 分钟补修
→ 新题首次无提示通过
→ 返回原课程
```

课程始终允许自由进入，不使用锁头强制阻断。

### 9.3 推荐解释模板

- 前置已稳固：`你已经会“分数基本性质”，现在可以学习“约分”。`
- 断点补修：`刚才两题都卡在“通分”，先补这一小步，再回到分数加法。`
- 教材落点：`这是你所选教材当前单元中的知识。`
- 跨年级连接：`三年级学过同分母加减，现在要把它推广到异分母。`

不显示向量分数、黑盒置信度或“AI 认为”。

## 10. 向量能力

### 10.1 Embedding 文本

只向量化经过审核的节点摘要：

```text
名称 + 定义 + 关键条件 + 典型例题摘要 + 常见误区
```

不直接向量化未经授权的完整教材正文。

### 10.2 P0用途

1. 自然语言查询映射到技能候选。
2. 教研查重和相似节点发现。
3. 提出 `RELATED/CONTRAST/TRANSFER` 候选关系。
4. 检索与技能对应的已审核讲解、题目和表征。

### 10.3 禁止用途

- 不自动生成 `REQUIRES_HARD`。
- 不决定关系方向。
- 不直接生成学生学习路径。
- 不推断学生掌握状态。
- 不自动发布节点和关系。

### 10.4 存储边界

P0 节点规模不足 300，不引入 Neo4j 或独立向量数据库。

- 图谱事实：版本化关系数据。
- 向量：可删除、可重建的派生索引。
- 模型升级后必须重新生成并回归评估。

## 11. Source of Truth 与发布流程

### 11.1 事实源

目标状态：已发布的版本化知识图谱是唯一事实源。

```text
课程与权威来源
→ 拆分微技能
→ AI生成相似节点和候选边
→ 编辑者确定关系类型和方向
→ 审核教师批准
→ 图谱校验
→ 发布不可变版本
→ 编译课程导航快照
```

现有 `meta.json.prerequisites` 作为冷启动种子，未来由已发布图谱编译生成，不允许与图谱长期双向维护。

### 11.2 状态

节点：

```text
draft → reviewed → published → retired
```

关系：

```text
proposed → approved → published
                  ↘ rejected
published → retired
```

图谱版本：

```text
draft → validating → published → superseded
```

## 12. 核心页面线框

### 12.1 首页：今天的一小步

```text
┌─────────────────────────────────────┐
│ 早上好，你正在学习                  │
│ 数字与运算 › 分数 › 分数乘法        │
│                                     │
│ 今天先完成：分数乘分数              │
│ 预计 6 分钟                         │
│                                     │
│ [继续学习]                          │
│ 为什么推荐？你已稳固“求几分之几”    │
├─────────────────────────────────────┤
│ [查看我的知识地图]                  │
│ 年级课程自由浏览                    │
└─────────────────────────────────────┘
```

首页不展示完整图谱。

### 12.2 知识地图：逐层进入

```text
┌─────────────────────────────────────┐
│ 我的知识地图     当前覆盖小学G3—G6    │
│ [我的路径] [全部知识]               │
├─────────────────────────────────────┤
│ 数字与运算      12已稳固 / 3待复习   │
│ 数量关系         4已稳固 / 1学习中   │
│ 图形与测量       7已稳固             │
│ 数据与随机       2已稳固             │
├─────────────────────────────────────┤
│ 当前路径：分数                     ›│
└─────────────────────────────────────┘
```

点击领域后进入主题列表，不在同屏展开所有节点。

### 12.3 分数主题路径

```text
数字与运算 › 分数

✓ 平均分与单位“1”
│
✓ 分子、分母和分数表征
│
✓ 同分母比较与加减
│
◷ 分数基本性质
│   ├─ ✓ 等值分数
│   ├─ ◷ 约分
│   └─ ○ 通分
│
○ 异分母加减
│
○ 分数乘法
│
○ 分数除法

[继续“约分”]
为什么：通分和分数乘法都会用到它
```

移动端使用纵向路径，不提供拖动画布和双指缩放。

### 12.4 课程页局部地图与补修

```text
以前学过            当前            学完可以继续
分数基本性质  →  异分母加减  →  分数乘法
                    │
                    └─ 易混：分子分母分别相加

本课微技能
✓ 通分
◷ 统一分数单位
○ 运算后化简

[继续课程]

—— 连续失败时 ——

补一补：通分（预计3分钟）
刚才两题都没有把分数单位变成相同大小。
[先补通分] [仍然继续本课]
```

## 13. 移动端与无障碍

- 移动端用纵向路径和折叠层级，不使用力导向网络图。
- 任一页面只展开一条主要路径。
- 点击区域不少于 44×44px。
- 节点状态同时使用文字、图标和颜色。
- 键盘可完成展开、返回、查看原因和进入课程。
- 200% 缩放不出现横向滚动。
- 关闭动画和连线样式后，列表顺序仍能表达学习关系。
- 不在公共屏幕展示完整薄弱点、预测文本或个人答案。

## 14. P0范围

### 图谱内容

- 47 个课程节点作为骨架。
- 30 个分数微技能节点。
- 4 个跨主题桥接节点。
- 不少于 35 条审核关系。
- 映射 7 门核心分数课以及比、百分数、比例桥接课程。
- 映射现有分数课程的初始题和 D1/D7 题。

### 学生体验

- 新增知识地图入口。
- 新增分数主题纵向路径。
- 课程页显示前置、当前、后续和易混概念。
- 支持选择目标知识并生成合法路径。
- 支持单技能补修后返回原课程。
- 微技能证据覆盖现有掌握状态。

### 教研体验

- 离线生成节点向量。
- 输出相似节点和候选边清单。
- 教师审核后发布版本化图谱。
- P0 可先使用版本化文件和脚本校验，不建设可视化后台。

## 15. P1

- 将微技能图扩展到小数、整数运算、方程、几何、统计与概率。
- 建设图谱编辑和审核工作台。
- 增加跨主题迁移、题目证据和误区关系。
- 将自然语言搜索接入学生端。
- 有足够学习事件后，再评估图谱知识追踪和自适应路径。
- 获得 G1—G2 与 G7—G9 权威内容并完成分阶段审核后，再对外宣称完整 K9。
- 通过“升学桥”试点后，按数与代数、图形与几何、统计与概率主干逐步扩展 G7—G9。

## 16. 验收标准

### 图谱质量

- 100% 节点包含定义、边界、所属课程和内容版本。
- 100% 正式关系包含类型、方向、来源、审核人和版本。
- `REQUIRES_HARD` 子图无环、无无效引用。
- 每条硬前置均能说明缺失时后续失败的具体环节。
- 三套教材映射到同一技能身份，不复制节点。
- 现有分数题无孤儿映射。

### 教育质量

- 教师独立审核关系方向和强度一致率 ≥90%。
- 每个可判定掌握的技能至少有两道不同题和一种非选择证据。
- 20 组模拟学生画像中，推荐的首个补修技能与教师判断一致率 ≥90%。
- 不允许沿图自动传播“已掌握”。
- 分数除法必须分别覆盖包含除和平均分两种意义。

### 向量效果

- 教师标注查询集的 Top-5 技能召回率 ≥85%。
- AI 候选边自动发布率为 0。
- 所有候选记录模型、向量版本、来源哈希和审核结果。
- 向量不可用时，关键词搜索和图谱路径正常工作。

### 用户体验

- 8/10 学生可在 30 秒内找到下一步学习内容。
- 8/10 学生能说明“为什么先学这个”。
- 80% 学生能从目标知识找到关键前置。
- 补修完成后 80% 学生能无帮助返回原课程。
- 移动端核心路径完成率与桌面端差距不超过 5 个百分点。
- 键盘、屏幕阅读器和 200% 缩放无阻断。

## 17. 评审决策点

进入开发前只需要确认以下四项：

1. 分数微技能是否需要增删、合并或拆分。
2. `REQUIRES_HARD` 的方向和强度是否正确。
3. 当前 7 门分数课到微技能的映射是否符合教材实际。
4. 儿童端是否采用“纵向路径优先、完整图谱隐藏”的交互原则。

四项确认后，再进入数据结构、图谱校验脚本和页面原型设计。

## 18. K9 扩展决策

### 18.1 决策

> **K9 架构现在做，K9 内容后做。**

现在一次性生产 G1—G9 课程，会把尚未验证的节点粒度、关系模型和掌握逻辑放大到九个年级。当前应先证明分数图谱能够正确解释路径、定位前置和提升学习连续性。

### 18.2 现在必须完成的 K9 预留

| 能力 | 现在的要求 |
|---|---|
| 稳定技能 ID | 与年级、教材和课程解耦，例如 `math.ratio.proportion` |
| 学段字段 | `schoolStage = primary | middle`，不从课程 ID 猜测 |
| 年级范围 | 图谱契约允许 1—9，当前前端仍只消费已有 G3—G6 |
| 多对多映射 | Course、Skill、Question 之间均允许多对多 |
| 螺旋上升 | 同一技能支持直观、程序、符号、证明等证据层级 |
| 表征能力 | 支持实物、面积、数轴、表格、算式、坐标、函数图像和几何图形 |
| 跨学段边 | 增加审核型 `BRIDGES_TO_STAGE`，不参与普通自动推荐 |
| 版本迁移 | 图谱、课程映射、题目证据均包含版本，支持升级和回放 |

当前 `Grade = 3 | 4 | 5 | 6` 属于现有应用实现，未来图谱契约不能继续复用这个固定联合类型作为 K9 数据边界。

### 18.3 现在不做的 K9 内容

- 不生产 G7—G9 全量课程。
- 不补齐 G1—G2 空白内容。
- 不建设中考题库、组卷、排名和教师后台。
- 不开发几何证明自动批改、函数图像推理或完整符号计算引擎。
- 不向当前学生展示空的初中地图。
- 不用向量或 LLM 自动补齐缺失学段。

### 18.4 扩展阶段

#### Phase 0：当前定义稿

- 冻结 K9 通用本体、稳定 ID、学段和教材映射。
- 完成 G3—G6 分数纵向切片。
- 不发布初中内容。

#### Phase 1：小学图谱产品化

- 分数试点通过后，映射当前 47 门小学课程。
- 验证目标路径、断点补修、D1/D7 技能证据和儿童地图体验。
- 获得至少一轮真实学习数据。

#### Phase 2：六升七“升学桥”

只试点三条跨学段桥接模块：

```text
分数、小数、比、百分数、比例
→ 负数与有理数
→ 字母表示数
→ 代数式
→ 一元一次方程
→ 正比例与一次函数
```

```text
等号、运算定律、天平模型、简易方程
→ 等式两边同操作
→ 含字母数量关系
→ 一元一次方程
→ 不等式与方程组
```

```text
长度、角、平行垂直、面积守恒、坐标
→ 全等与相似
→ 勾股定理
→ 几何条件、结论和证明
```

学生进入初中主题时只显示：

```text
需要的小学基础 → 2分钟准备度检查 → 初中起点
```

缺口只补对应微技能，不要求重学整门小学课程。

#### Phase 3：按数学主干扩到 K9

不按“填满一个年级”机械扩张，而按能力主干逐条完成：

1. 数与代数
2. 图形与几何
3. 统计与概率
4. 综合应用

每条主干必须完成权威来源、概念拆分、关系审核、题目映射和学习效果验证后才能发布。

### 18.5 K9 用户体验规则

- 一级先区分小学、初中，不在同一画布混画。
- 默认进入账户年级对应学段。
- 未完成学段不展示空入口。
- 小学端使用生活化名称和大卡片；初中端提高信息密度，但保持相同状态和路径逻辑。
- 学生可以主动“提前看初中”或“回顾小学”，但系统不根据做题表现自动跳级。
- 小学和初中完成率、待复习数量分别统计，不合成一个百分比。
- 跨学段关系通过“升学桥”卡片表达，不绘制贯穿全图的长连线。

### 18.6 启动初中内容的门槛

满足以下条件后才进入 Phase 2：

1. 分数域 7 门课程和现有题目完成技能映射。
2. 硬前置子图无环，教师审核一致率 ≥90%。
3. 20 组模拟学生画像的首个补修推荐与教师判断一致率 ≥90%。
4. 当前 47 门小学课程完成图谱映射，无孤立课程、技能和题目。
5. 目标路径和断点补修相对课程列表基线产生可验证提升。
6. 至少积累一轮真实 D1/D7 学习数据。

正式开放 G7 时还必须满足：

- 至少完成一个完整年级或学期，不发布零散初中课程。
- 小学、初中教师共同审核关键跨学段边。
- 六、七年级学生中，90% 能识别当前学段，80% 能说明初中主题需要的小学基础。
- 推荐系统不会向未明确选择七年级的学生主动推荐初中课程。
- 初中即时通过、D1/D7 和补修体验达到小学现有质量门槛。

## 19. 研究依据

- Sentence-BERT：句向量适合语义相似检索，不等同于教学先修关系。
  https://aclanthology.org/D19-1410/
- TransE：多关系知识图谱需要显式建模实体与关系，不能只比较实体间原始距离。
  https://papers.neurips.cc/paper_files/paper/2013/hash/1cecc7a77928ca8133fa24680a88d2f9-Abstract.html
- Graph-based Knowledge Tracing：将技能建成图节点并叠加时间序列掌握证据，可提升可解释性；本项目冷启动阶段先不引入 GNN。
  https://static.aminer.cn/upload/pdf/167/898/1833/5daaecff3a55ac9a1ab216e8_0.pdf
