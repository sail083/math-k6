# 分数微补修闭环 v0.2 — 产品需求文档

## 1. 背景

小学分数学习存在典型"伪掌握"现象：学生课内通过了课程练习，但遇到新情境的迁移题时仍然失败。知识图谱中的路径准备度（readiness）需要区分"当堂会"（provisional）与"路径已准备好"（ready），以便向学生推荐有效的前置补修而非让其直接学习目标课程。

分数微补修闭环（Repair Loop）是一条约 3–5 分钟的即时诊断-教学-验证闭环，帮助学生快速确认或修复单个微技能的路径准备度，然后带着证据返回目标路径。

## 2. 目标

- 学生能在 3–5 分钟内完成单个微技能的诊断-补修-验证
- 学生始终知道自己处于哪个步骤和为什么
- 通过补修后，产生可追踪的迁移证据（transfer evidence）
- 不对外宣称"掌握"或"稳固"——补修通过仅代表"路径准备度通过 / 当堂会"
- 7 天后复习到期后才可达到 stable 状态

## 3. 涉及角色

| 角色 | 职责 |
|------|------|
| 学生 | 执行补修，做题，查看结果 |
| 系统 | 调度状态机，记录证据，更新进度 |
| 教研（离线） | 编写 RepairUnit 内容，保证质量标准 |

## 4. 功能范围

### 纳入范围

- 路由 `/repair/:skillId?target=<goalSkillId>` 下的补修闭环页面
- 支持的微技能：`frac.whole` / `frac.equal_partition` / `frac.notation` / `frac.of_quantity` / `frac.multiply_fraction` / `frac.reciprocal` / `frac.division_grouping` / `frac.division_sharing` / `frac.divide_transform`（共 9 个，36 道题）
- 知识地图页（`/map`）的"下一小步"区域提供诊断入口
- 首页推荐卡展示进行中的补修会话
- 补修进度持久化（localStorage + Supabase 同步）

### 排除范围

- 教师端或家长端管理功能
- 班级/跨账户数据共享
- v0.1 知识图谱之外的其他学科域

## 5. 状态机流程

```
[进入 /repair/:skillId]
        │
        ▼
  session start（只触发一次）
        │
        ▼
 ┌─── diagnostic ───┐
 │  答 2 道诊断题    │
 │  记录每题反馈     │
 └──────────────────┘
        │
   2/2 全对且 firstTry?
       │YES                │NO
       ▼                   ▼
 record transfer(✓)   record transfer(✗)
 finishRepair          │
 → result (passed)     ▼
                    lesson
                       │
                       ▼
                     check
                  答 2 道验证题
                  记录每题反馈
                       │
                   全部 firstTry?
                  │YES       │NO
                  ▼           ▼
         record transfer(✓)  record transfer(✗)
         finishRepair          finishRepair
         → result (passed)     → result (failed)
```

**关键约束**：
- `diagSummaryRecorded` 与 `checkSummaryRecorded` 相互独立，防止跨阶段重复写入
- `finishCalled` 全局只触发一次，防止重渲染重复结束
- 结果页按钮重复点击不重复写入
- check 失败后无同题重做入口（直接跳转课程或返回地图）

## 6. 功能说明

### 6.1 诊断阶段（diagnostic）

- 展示 2 道诊断题（conceptual + procedural 证据类型）
- 每道题答完后显示反馈，用户点击"下一题"才进入下一道
- 所有诊断题用同一个渲染帧（key=question.id 确保组件重建，防止 answered ref 残留）

### 6.2 讲解阶段（lesson）

- 仅在诊断未全部 firstTry 通过时出现
- 包含：核心解释、2–4 步方法、例题、常见误区纠正

### 6.3 验证阶段（check）

- 展示 2 道验证题（全部 evidenceType=transfer）
- 同诊断阶段的交互模式

### 6.4 结果阶段（result）

- 通过：显示"路径准备度通过 / 当堂会"，不宣称"已掌握"，按钮导向 `/map?target=...&repaired=...`
- 未通过：提供完整课程入口 + 返回地图
- Diagnostic fast pass 不展示讲解/验证步骤条为 done

## 7. 字段与状态语义

### SkillEvidenceRecord 补修相关字段

| 字段 | 含义 |
|------|------|
| `lastMode = 'repair'` | 最后一次证据由补修产生 |
| `transfer` | repair 通过且 firstTry=true 时 +1 |

### 状态跃迁（getSkillDisplayStatus）

| 条件 | 状态 |
|------|------|
| lastMode=repair，elapsed < 1天 | provisional |
| lastMode=repair，elapsed ≥ 1天 | review_due |
| lastMode=repair，任何时间 | **不得** stable（repair 不能直接 stable） |
| transfer>0 且 retention>0 且 lastMode≠repair | stable |

### repairSession 字段

```ts
{
  skillId: string;          // 正在补修的技能
  targetSkillId: string;    // 学习目标
  status: 'active' | 'completed';
  updatedAt: number;        // 时间戳（ms）
}
```

### 合并规则（mergeRepairSession）

1. 比较 updatedAt，更大值胜
2. updatedAt 相等时 completed 胜（防止旧 active 复活）

### 合并规则（mergeLearningGoal）

updatedAt 更大者胜。

## 8. 降级与错误处理

| 场景 | 行为 |
|------|------|
| skillId 不在知识图谱中 | 显示"技能不存在"，返回地图，不 startRepair |
| skillId 合法但无 RepairUnit | 显示"微补修准备中"，可选完整课程，不 startRepair |
| URL `?repaired=` 参数无效 | 不展示 toast，URL 用 replace 清理 |
| URL `?target=` 参数无效 | 回退 learningGoal 或默认值 |
| learningGoal/repairSession 字段格式非法 | parseXxx 返回 undefined，静默降级 |

## 9. 权限

- 所有补修路由为受保护路由（需登录）
- 补修进度存储在用户的 `profiles.progress` 字段，不跨用户共享

## 10. 数据隐私

- 仅存储题目答对/答错的统计计数，不存储学生原始答案文本
- `SkillEvidenceRecord` 内容详见 types.ts
- 本地 localStorage 与 Supabase 同步，合并时使用确定性幂等函数

## 11. 验收标准

| # | 项目 | 标准 |
|---|------|------|
| A1 | 内容完整性 | 9 个 skillId，36 道题，每单元 2 diag + 2 check |
| A2 | Fast pass 路径 | 2/2 firstTry 正确 → 直接 result，不经过 lesson/check |
| A3 | 正常路径 | diag 失败 → lesson → check → result |
| A4 | 证据幂等 | 重渲染/重复点击不重复写入 evidence 或 finish |
| A5 | Repair 不 stable | repair 通过后状态为 provisional，不跳 stable |
| A6 | 第二题可答 | 第 2 道诊断/验证题可以真实作答，不因 ref 残留而无响应 |
| A7 | 文案 | 不出现"已掌握"；不展示 `frac.` 等技术 ID |
| A8 | 合并语义 | active@200 + completed@100 → active；active@100 + completed@200 → completed |
| A9 | 测试通过 | `npm run test` 全部通过，测试数实质增长 |
| A10 | 构建通过 | `npm run build` 无 TypeScript 错误 |

## 12. 未来扩展

- 更多学科域（整数、小数）的 RepairUnit 内容
- 教研后台 CMS 用于编辑 RepairUnit
- 班级维度的补修完成率统计
- 多轮补修（check 失败后仍可再次启动）
- 动态题目生成（不依赖固定 JSON）
