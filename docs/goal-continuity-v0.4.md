# math-k6 v0.4：目标不丢失——目标连续性产品需求与交付文档

> 版本：v0.4  
> 文档状态：发布候选  
> 前置能力：[分数微补修闭环 v0.2](./fraction-repair-loop-v0.2.md)、[分数技能延迟复习 v0.3](./fraction-skill-review-v0.3.md)

## 1. 背景

当前学习体验以单个知识点为中心，学生从首页、知识地图、微补修、完整课程及 D1/D7 复习之间跳转时，容易忘记“我原本想学会什么”。v0.2/v0.3 已具备分数技能图谱、微补修、完整课程干预和 D1/D7 延迟复习，但目标上下文可能在页面跳转、失败分支、重新进入或跨设备同步后丢失，导致学习路径割裂。

v0.4 以“目标不丢失”为核心：不扩大内容规模，先让既有闭环始终围绕同一目标运行，并允许学生一键回到目标路径。

## 2. 目标

建立以下连续闭环：

```text
目标选择 → 目标路径 → 微补修或完整课程 → D1 → D7 → 继续目标
    ↑                                              │
    └────────────── GoalContextBar 一键恢复 ───────┘
```

- 学生在任一闭环页面都知道：我的目标、当前在学/补什么、完成后回到哪里。
- `target` 在目标路径、补修、课程和复习跳转中持续传递。
- 微补修不可用或失败时进入完整课程，但不改变原目标。
- 退出、重新进入或跨设备同步后，可一键恢复目标。
- 用最小事件集观察目标激活、首动作、恢复、开始与完成，不做超出数据证据的效果承诺。

## 3. 角色

| 角色 | 核心需求 |
|---|---|
| 小学生 | 用儿童可懂的目标开始学习；随时看懂当前步骤；中断后快速继续；清楚“今天会”不等于长期稳固。 |
| 家长/老师 | 能理解学习围绕哪个目标推进，以及今天、隔天、一周后的证据层级；不接触学生答案明细。 |
| 产品/教研 | 观察目标闭环是否可进入、可恢复、可完成；依据真实会话数据决定后续技能扩展。 |

## 4. 范围

### 4.1 纳入范围

1. 首页三个快捷目标：
   - `frac.notation`：认识并读懂分数
   - `frac.multiply_fraction`：学会分数乘法
   - `frac.divide_transform`：学会分数除法
2. `GoalContextBar`：展示“我的目标 / 当前在补或学习 / 完成后继续”，主 CTA 为“继续我的目标”。
3. `target` 上下文贯穿知识地图、微补修、完整课程、D1/D7 复习及返回链接。
4. 对合法但无微补修内容的 unsupported 技能，降级到匹配的完整课程；原目标保持不变。
5. `learningGoal` 的本地持久化、登录同步、跨设备确定性合并和 legacy 数据兼容。
6. 八个目标连续性事件及数据库 `CHECK` 白名单扩展。

### 4.2 非范围

- 当前内容基线为 34 个 published 图节点、9 个微补修单元；v0.4 不扩内容覆盖。
- 不做 K9 学段、AI 老师、A/B 实验、学习提醒或运营/教研后台。
- 不新增自由文本采集、答案明细采集、家长/教师管理端或跨账户共享。
- 不以 v0.4 数据宣称学习效果因果关系。

## 5. 业务流程与分支

### 5.1 主流程

```text
[首页]
  ├─ 无有效目标 → 三快捷目标 / 更多目标
  └─ 有有效目标 → GoalContextBar → 一键继续
                                 │
                                 ▼
                         [知识地图目标路径]
                           │             │
                    有 RepairUnit     unsupported
                           │             │
                           ▼             ▼
                        微补修        完整课程
                           │             │
                    ┌──────┴──────┐      │
                    │成功          │失败  │
                    ▼              ▼      ▼
                 当堂会         完整课程通过
                    └──────┬───────┘
                           ▼
                          D1
                           ▼
                          D7
                           ▼
                    继续原目标路径
```

### 5.2 分支规则

| 场景 | 处理规则 |
|---|---|
| 新用户/无目标 | 首页展示三个快捷目标，次级入口为“看看更多目标”；选中后写入目标并进入带 `target` 的地图。 |
| 已有有效目标 | 首页及相关闭环页展示 `GoalContextBar`；点击“继续我的目标”回到 `/map?target=<skillId>`。 |
| unsupported | 技能合法且已发布、但无 RepairUnit：主信息为“通过完整课程学习这项技能”，以“学习完整课程”为主 CTA；若无课程映射则返回目标地图，不启动空补修会话。 |
| invalid target | URL 或持久化目标不是已发布技能：不得据此写目标、启动补修或记录完成；清理非法 URL 参数并回退到有效持久化目标；仍无有效目标时回到目标选择。不得让默认值覆盖用户已有目标。 |
| 补修成功 | 记录“今天会”的合格证据，安排 D1；返回时继续携带原 `target`。 |
| 补修失败 | 保留目标，主 CTA 进入匹配完整课程，次 CTA 返回目标地图；失败不宣称掌握。 |
| 完整课程成功 | 记录课程完成及目标学习完成事件；按既有规则安排/继续证据流程，并回到原目标。 |
| 完整课程失败或加载失败 | 不清除目标、不伪造完成；保留重试与返回目标路径入口。 |
| D1/D7 成功 | 按既有证据状态机推进；完成后继续原目标路径。 |
| D1/D7 失败 | 按既有课程干预/练习规则处理；目标不变，不用练习结果伪造新证据。 |
| 跨设备 legacy merge | 旧 `{skillId, updatedAt}` 补齐 `startedAt=updatedAt`、`source='map'`；同目标保留最早 `startedAt` 和最新 `updatedAt`，`source` 取较新记录；不同目标以较新 `updatedAt` 胜。服务端与本地合并后仍可恢复目标。 |

## 6. 功能设计

### 6.1 信息与 CTA 层级

| 场景 | 核心文案 | 主 CTA | 次 CTA |
|---|---|---|---|
| 首页无目标 | “你想先学会什么？” | 三个快捷目标按钮 | “看看更多目标” |
| 已有目标 | “我的目标：{目标名}” | “继续我的目标” | 无需突出切换；在地图中可选择其他目标 |
| 路径进行中 | “当前在补/当前学习：{技能名}” “完成后继续：{目标名}” | 可执行的下一小步 | 完整课程或返回路径 |
| unsupported | “通过完整课程学习这项技能” | “学习完整课程” | “返回目标路径” |
| 学习失败 | “这次还没通过，目标还在” | “学习完整课程”或“再试一次” | “返回目标路径” |
| 阶段完成 | 明确当前取得的证据，不使用“已掌握” | “继续我的目标” | 查看路径 |

原则：每屏只突出一个主 CTA；按钮文案描述结果而非页面名称；不得向儿童展示 `frac.*` 等技术 ID；移动端触控目标不小于 44px。

### 6.2 GoalContextBar

展示项固定为：

- `我的目标`：持久化目标的儿童可懂名称。
- `当前在补`或`当前学习`：当前路径技能。
- `完成后继续`：原目标名称。
- 主 CTA：`继续我的目标`，跳转 `/map?target=<learningGoal.skillId>`。
- 证据阶梯：`今天会 · 隔天还会 · 一周后还会`。

证据阶梯含义：

| 阶段 | 用户文案 | 证据边界 |
|---|---|---|
| 即时通过 | 今天会 | 仅代表当次路径准备度/当堂会。 |
| D1 通过 | 隔天还会 | 表明隔天迁移检查通过，不等同长期稳固。 |
| D7 通过 | 一周后还会 | 满足既有 transfer + retention 条件后才可进入 stable。 |

### 6.3 页面与数据流

```text
HomePage ──setGoal(source=home)──┐
KnowledgeMapPage ──source=map────┼── ProgressContext
KnowledgePointPage ─source=course┘        │
                                         ├─ localStorage
                                         ├─ authenticated profile sync/merge
                                         └─ fire-and-forget learning_events INSERT

GoalContextBar / Map / Repair / Course / Review
          └──────── target=<skillId> ────────┘
```

模块边界：页面负责校验路由和选择 CTA；`ProgressContext` 负责目标写入、进度合并和事件发射；进度库负责解析、派生和确定性合并；Supabase 仅保存登录用户自身进度及追加式事件。

### 6.4 路由契约

| 路由 | 契约 |
|---|---|
| `/map?target=<publishedSkillId>` | 展示并持久化目标路径；非法 target 清理并安全回退。 |
| `/repair/:skillId?target=<publishedSkillId>` | `skillId` 为当前补修技能，`target` 为不变的最终目标。 |
| `/repair/:skillId?target=<publishedSkillId>&review=d1\|d7[&form=a\|b]` | 复习身份以既有 schedule 校验；target 只承载目标上下文。 |
| `/kp/:courseId?target=<publishedSkillId>` | 课程围绕目标运行；后续课程与返回链接继续携带 target。 |

## 7. 字段与状态

### 7.1 持久化数据模型

```ts
learningGoal?: {
  skillId: string;
  startedAt: number;
  updatedAt: number;
  source: 'home' | 'map' | 'course';
}
```

| 字段 | 语义 |
|---|---|
| `skillId` | 当前最终学习目标，必须对应已发布技能。 |
| `startedAt` | 本轮目标首次建立时间；同一目标重复进入不重置，切换目标时重置。 |
| `updatedAt` | 最近一次有效设置/刷新时间，用于跨设备冲突合并。 |
| `source` | 最近一次有效目标入口：`home`、`map` 或 `course`。 |

### 7.2 派生状态

以下状态从 `learningGoal`、路由、图谱、repair session、course intervention、review schedule 和证据实时派生，禁止新增持久化副本：

- 是否有有效目标。
- 当前处于目标选择、路径、微补修、完整课程、D1 或 D7。
- 当前技能、下一可执行技能、是否 unsupported。
- 是否应展示恢复条，以及恢复链接。
- “今天会 / 隔天还会 / 一周后还会”的当前证据层级。

### 7.3 写入与合并规则

1. 仅接受非空、已发布 `skillId`；时间戳必须为有限非负数。
2. 同一目标再次设置：保留最早 `startedAt`，更新 `updatedAt/source`。
3. 切换目标：`startedAt=updatedAt=now`。
4. 同目标跨设备合并：`startedAt=min`、`updatedAt=max`、`source` 取较新记录；时间相同时使用既有确定性优先规则。
5. 不同目标跨设备合并：较新 `updatedAt` 胜，时间相同时保持确定性，不按设备随机覆盖。
6. legacy 缺少 `startedAt/source` 时分别回填 `updatedAt/'map'`；字段非法则 fail-closed，不阻断其余进度加载。

## 8. 事件设计

v0.4 精确新增以下 8 个事件；事件名必须与客户端类型及数据库 `chk_event_name` 一致。

| 事件 | 触发时机 | 核心属性 |
|---|---|---|
| `goal_entry_viewed` | 登录用户无有效目标且首页目标入口首次可见。 | `properties.surface='home'` |
| `learning_goal_started` | 用户首次建立目标，或有效切换/更新目标来源。 | `skill_id=目标`；`properties.source='home'\|'map'\|'course'` |
| `goal_path_viewed` | 有效持久化目标的路径首次展示。 | `skill_id=目标`；`properties.surface='map'` |
| `target_resume_shown` | 有效 `GoalContextBar` 在某 surface 首次展示。 | `skill_id=目标`；`properties.surface='home'\|'map'\|'repair'\|'review'\|'course'` |
| `target_resume_opened` | 用户点击“继续我的目标”。 | `skill_id=目标`；`properties.surface` 同上 |
| `target_learning_started` | 带有效持久化目标的完整课程首次进入。 | `skill_id=目标`；`course_id=课程`；`properties.surface='course'` |
| `target_learning_completed` | 上述课程首次有效通过。 | `skill_id=目标`；`course_id=课程`；`properties.surface='course'` |
| `repair_unavailable_shown` | 下一技能合法但无 RepairUnit，unsupported 降级首次展示。 | `skill_id=不可补修技能`；`properties.surface='map'\|'repair'`；`properties.targetSkillId=目标` |

通用字段按既有 `learning_events` 契约使用：`user_id`、`client_event_id`、`event_name`、可选 `skill_id/course_id`、`properties`、`app_version/content_version` 和服务端 `created_at`。v0.4 事件版本契约固定为 `app_version='0.4.0'`、`content_version='0.3.0'`；本版不包含题库或内容变更。目标事件不得写入原始答案、自由文本或 PII。

### 8.1 幂等原则

- 所有事件必须有稳定、可解释的 `client_event_id`；数据库以 `(user_id, client_event_id)` 唯一约束兜底。
- “shown/viewed/started”按用户、目标周期、surface/课程等业务身份只记一次；React 重渲染、Strict Mode、返回前台和网络重试不得重复计数。
- `learning_goal_started` 只在有效写入发生时发射；非法 target、无变化的重复渲染不得发射。
- `target_learning_completed` 只由首次有效通过触发；重复点击结果 CTA 不重复写入。
- 客户端事件采用 fire-and-forget；事件写入失败不得阻塞学习，也不得通过生成新 ID 绕过幂等约束。
- 分析以服务端实际落库事件为准，不用 UI 展示次数推测成功写入。

## 9. 权限与隐私

- 只有登录用户写入 `learning_events`；未登录状态不排队补写目标事件。
- 不采集题目原始答案、自由文本、姓名、手机号、邮箱、设备联系人或其他 PII。
- v0.4 migration 仅删除并重建 `chk_event_name`，把上述 8 个事件加入白名单；不新增表或宽化字段。
- 保持既有权限不变：`authenticated` 仅可 `INSERT`，且 RLS policy 要求 `auth.uid() = user_id`；`service_role` 可读用于受控分析。
- `anon` 与 `authenticated` 均无事件 `SELECT/UPDATE/DELETE` 权限；不得放宽 RLS、policy 或 grant。
- 目标进度继续遵循用户自身 profile 的访问边界，不跨账户共享。

## 10. 异常处理

| 异常 | 用户行为与系统约束 |
|---|---|
| URL target 非法、未发布或被删除 | 清理参数；优先回退有效持久化目标，否则进入目标选择；不写目标、不发开始/完成事件。 |
| legacy learningGoal 字段缺失 | 安全回填；若关键字段非法则忽略该目标，其他进度照常加载。 |
| skillId 不存在 | 显示“技能不存在”，返回目标地图；不启动补修。 |
| RepairUnit 缺失 | 显示 unsupported 文案；有映射时主 CTA 进入完整课程，无映射时返回路径；记录一次 unavailable 事件。 |
| 课程映射缺失 | 不构造虚假课程链接；保留目标并返回地图。 |
| 内容或网络加载失败 | 显示重试和返回目标入口；不清除目标、不记录完成。 |
| 事件 INSERT 失败/离线 | UI 和学习状态继续；不得将失败事件当作已落库指标，也不得包含敏感调试数据。 |
| 本地与远端冲突 | 使用确定性 merge；同目标保留最早开始时间，不同目标按更新时间决胜。 |
| D1/D7 参数或 schedule 不匹配 | fail-closed，不产生证据、不推进阶段；返回目标路径。 |
| 重复点击/重渲染 | 业务层 guard 加数据库唯一约束；目标、证据和事件均不得重复推进。 |

## 11. 指标与分析约束

### 11.1 核心指标

所有时间窗口以同一用户、同一目标会话为单位；目标会话由 `learning_goal_started` 的目标及 `startedAt` 语义界定。

| 指标 | 定义 |
|---|---|
| 目标激活率 | 看到 `goal_entry_viewed` 的会话中，产生 `learning_goal_started` 的比例。 |
| 10 分钟内首动作率 | 目标开始后 10 分钟内出现 `goal_path_viewed`、目标相关补修/课程开始或有效任务打开的比例。 |
| 10 分钟内恢复率 | `target_resume_shown` 后 10 分钟内出现对应 `target_resume_opened` 的比例；按目标周期和 surface 去重。 |
| 7 天内目标开始率 | 目标激活后 7 天内至少产生一次目标相关 `target_learning_started` 或目标路径上的有效补修开始的比例。 |
| 7 天内目标完成率 | 目标激活后 7 天内出现目标对应有效完成证据的比例；课程完成事件与技能证据必须按既有规则判定，不以点击代替。 |

### 11.2 Guardrail

- D1 到期后的参与率、首次有效通过率不得因目标恢复链路显著下降。
- D7 到期后的参与率、首次有效通过率及 `stable_achieved` 观察值不得恶化。
- unsupported、invalid target、事件写入失败和重复事件冲突率保持可解释，不能通过隐藏失败改善主指标。
- 目标恢复不得破坏既有课程进度、repair session、review schedule 或跨设备合并。

### 11.3 解释边界

当前样本量小，只做描述性观察，报告计数、比例、分母、时间窗及缺失数据，不做显著性检验，不宣称因果。累计至少 **20 个目标会话且覆盖至少 10 个独立用户** 后，才考虑是否设计实验；达到门槛不代表自动开展 A/B，仍需独立实验方案、样本量评估和风险审查。

## 12. 验收清单

### 12.1 自动化与静态验证

- [ ] 单元测试覆盖：目标解析、legacy 回填、同/异目标 merge、目标切换、target 校验、unsupported 降级、GoalContextBar 展示/点击及八事件幂等。
- [ ] `npm run test` 通过。
- [ ] `npm run typecheck` 通过。
- [ ] `npm run build` 通过。
- [ ] `npm run lint` 通过。
- [ ] 数据库 migration 与客户端事件联合测试确认 8 个新增事件精确匹配 `CHECK`。

### 12.2 端到端产品验收

- [ ] 新用户可从三个快捷目标开始，更多目标入口可用。
- [ ] 有目标用户可在首页、地图、补修、复习、课程看到正确目标上下文并一键恢复。
- [ ] 所有闭环跳转保留 URL 编码后的合法 `target`。
- [ ] unsupported 与失败分支进入完整课程时不丢目标；无映射时安全返回路径。
- [ ] invalid target 被清理且不覆盖有效目标，不产生错误目标事件或证据。
- [ ] legacy 数据与两设备冲突按确定性规则合并。
- [ ] “今天会 / 隔天还会 / 一周后还会”文案与证据状态一致，无“已掌握”等越界承诺。

### 12.3 兼容性与数据库验收

- [ ] 移动端与桌面端布局、键盘焦点、屏幕阅读语义及 44px 触控目标通过。
- [ ] Chrome、Safari、Edge 当前支持版本完成主流程、刷新恢复、离线/恢复网络回归。
- [ ] 在预发布/生产等价数据库验证：登录用户可 INSERT own；伪造其他 `user_id` 被 RLS 拒绝；authenticated/anon 无 SELECT/UPDATE/DELETE；service_role 可受控读取。
- [ ] 验证八事件可落库、非法事件名被 `CHECK` 拒绝、重复 `(user_id, client_event_id)` 被唯一约束拒绝。
- [ ] 验证事件记录不含答案、自由文本或 PII。

## 13. 未来扩展

后续候选是建设**完整 10 技能的分数等值变换链**；这不是当前已有能力。候选方向旨在使目标路径、课程映射、补修和 D1/D7 证据覆盖一致，是否进入实施必须由 v0.4 闭环数据证明主要损失发生在内容覆盖而非入口、恢复或降级链路。

扩展至 25 个技能或 K9 必须由目标激活、首动作、恢复、7 天开始/完成及 D1/D7 guardrail 数据共同驱动，并先完成内容质量、路径依赖、容量和隐私评审；不得仅以页面访问量作为扩展依据。

## 14. 发布门槛与回滚

### 14.1 发布门槛

本地测试、类型检查、构建和 lint 通过只证明代码候选可交付，**不等于生产发布成功**。生产发布必须独立完成并留存结果：

1. 数据库 migration 在目标环境成功执行，确认仅扩展 `chk_event_name`。
2. 前端构建产物部署成功，版本与 migration 兼容。
3. 生产认证、RLS/grant、八事件 INSERT、目标恢复及主/异常流程回归通过。
4. 事件无 PII，监控中无新增高严重度错误，D1/D7 既有链路可用。
5. 产品、教研、开发、测试共同确认文案、证据边界和数据口径。

### 14.2 回滚

- 前端异常：优先回滚前端部署到上一稳定版本；保留已写入的向后兼容 `learningGoal` 字段，不删除用户进度。
- 事件异常：可先关闭客户端新事件发射或回滚前端，不阻塞学习主流程。
- migration 异常：按独立数据库变更流程处置；回退 `CHECK` 前须确认生产中不存在新增事件名记录，避免约束重建失败或数据丢失。
- 不以放宽 RLS/grant、删除学习事件、清空 profile 或覆盖本地进度作为快速回滚手段。
- 回滚后必须重新执行生产目标选择、恢复、unsupported、课程、D1/D7 和权限回归，并记录影响窗口。