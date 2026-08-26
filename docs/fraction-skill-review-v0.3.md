# Fraction Skill Review v0.3 — "今天会，明天还会"

> 状态：已验收 · 2026-08-26
> 前置：[fraction-repair-loop-v0.2](./fraction-repair-loop-v0.2.md)

## 目标

关闭技能级 D1/D7 跟踪闭环：学生在微补修中首次通过某技能后，系统在第 1 天和第 7 天自动安排复习，并支持 A/B 双卷与诚实失败补救，确保"今天会，明天还会"。

## 范围

- 9 个已有分数微补修技能（`frac.whole` … `frac.divide_transform`）
- 每个技能：4 道补修题 + D1 A/B 各 2 题 + D7 A/B 各 2 题 = 12 道题
- 合计 **108 道题**（36 补修 + 72 复习 A/B）
- 首页"今日任务"优先级列表
- Supabase `learning_events` 表（fire-and-forget）
- 确定性 50/50 实验分组（`repair` | `course`），fast-pass 自动标记为 `observer`

## 非目标

- 不新增微补修技能
- 不修改认证/鉴权
- 不新增 npm 依赖
- 不部署远端数据库

---

## 数据模型

### `SkillReviewSchedule`

```typescript
interface SkillReviewSchedule {
  skillId: string;          // 被复习的技能
  targetSkillId: string;    // 当前目标路径技能
  stage: 'd1' | 'd7';
  status: 'scheduled' | 'due' | 'passed' | 'failed';
  dueAt: number;            // 到期时间戳（ms）
  updatedAt: number;
  contentVersion: string;   // 内容版本号
  firstExposure: boolean;   // 首次接触本题组时记录证据
  formId: 'a' | 'b';        // 当前题组（questions = A 卷，alternateQuestions = B 卷）
  attemptNo: number;        // >= 1，每次有效尝试递增
}
```

存储于 `ProgressData.skillReviews: Record<string, SkillReviewSchedule>`。

### `CourseIntervention`

```typescript
interface CourseIntervention {
  skillId: string;
  targetSkillId: string;
  courseId: string;
  variant: 'course';
  status: 'active' | 'completed';
  updatedAt: number;
  reviewStage?: 'd1' | 'd7';        // 复习补救目标阶段
  nextForm?: 'a' | 'b';             // 课程完成后安排的题组
  origin?: 'diagnostic' | 'review'; // 触发来源
}
```

### 调度与补救规则

| 事件 | 结果 |
|------|------|
| 微补修通过（fast-pass 或 check-pass） | 调度 D1 form A，dueAt = now + 1 day |
| D1 form A 首次通过 | 调度 D7 form A，dueAt = now + 6 days |
| D1 form A 首次未通过 | 启动 course 干预（origin='review', reviewStage='d1', nextForm='b'），状态保持 `due`；页面提供"再练一次 A 卷（不计分）" |
| 完成匹配 course 干预中的课程 | 触发 `intervention_completed`，并按 `reviewStage`/`nextForm` 调度新题组（默认 D1 form A） |
| D1/D7 非首次练习通过/失败 | 仅产生 `skill_review_finished` 练习事件，不记录新证据、不推进阶段、不调度下一阶段；状态保持 `due` |
| D7 form A/B 首次通过且已有 transfer+retention 证据 | 触发 `stable_achieved` |

### 合并语义（确定性）

两端的 `SkillReviewSchedule` 按以下规则合并：
1. `updatedAt` 较新者胜
2. 只有**更旧或时间戳相同**的 `scheduled` / `due` 不能覆盖**更新或时间戳相同**的 `passed` / `failed`；换言之，较新的 `scheduled` / `due` 可以覆盖较旧的终端状态
3. 时间戳相同时，`passed` > `failed` > `due` > `scheduled`

---

## 复习内容

### JSON 结构

每个 `RepairUnit` 的 `reviewSets` 现在包含 A/B 两套题：

```json
{
  "reviewSets": {
    "d1": {
      "questions": [ /* 2 questions — form A */ ],
      "alternateQuestions": [ /* 2 questions — form B */ ]
    },
    "d7": {
      "questions": [ /* 2 questions — form A */ ],
      "alternateQuestions": [ /* 2 questions — form B */ ]
    }
  }
}
```

### 题目约束

| 阶段 | evidenceType | 题型 | 数量/卷 |
|------|-------------|------|---------|
| D1 | 全部 `transfer` | 至少 1 道 `fill-blank` | 2 |
| D7 | 第 1 题 `transfer`，第 2 题 `retention` | 至少 1 道 `fill-blank` | 2 |

- 108 道题的 ID 全局唯一
- 同一 stage 内 A 卷与 B 卷归一化 prompt 模板不重复
- A/B 卷与现有 `game.json` 题目不重复（prompt+answer 维度）

---

## `SkillRepairPage` 复习模式

### URL

```
/repair/:skillId?target=:targetSkillId&review=d1|d7[&form=a|b]
```

`form` 为可选参数：
- 未指定时，使用 `reviewSchedule.formId`（默认 `a`）
- 指定 `b` 时，若当前调度不是 `b`，页面 fail-closed 显示无效状态，防止误刷证据

### 流程

1. 验证 review schedule 是否到期（`status === 'due'` 或 `scheduled` 且 `dueAt <= now`）
2. 未到期/已完成或参数非法 → 显示"该复习任务尚未到期或已完成"
3. 到期 → 根据 `formId` 加载 A/B 题组，2 道题全部首次答对 = pass
4. Pass:
   - D1 → `resolveSkillReview(passed=true)` → 自动调度 D7 form A
   - D7 → 记录 retention 证据 → 技能可能变为 `stable`
5. Fail:
   - 首次接触（`firstExposure === true`）且 form A：启动 course 干预，提示完成完整课程后解锁 B 卷；可再练 A 卷但不计分
   - 首次接触且 form B：诚实提示"本题组还没通过，没有产生新证据"
   - 非首次接触：练习尝试，不计入新证据，状态保持 `due`

### 证据规则

- 仅在 `reviewSchedule.firstExposure === true` 时记录技能证据
- `transfer` / `retention` 只累计"正确且首次无提示正确"的直接证据
- 非首次练习不会产生新证据，也不会把调度推进到下一阶段

---

## 实验分组

### 分配规则

```typescript
function getExperimentAssignment(userId: string, skillId: string): 'repair' | 'course'
```

基于 `userId:skillId` 的稳定哈希，50/50 分配。

- `repair` 组：进入微补修流程
- `course` 组：显示课程 CTA（引导至完整课程）
- `observer`：fast-pass 用户自动标记

### 存储

`ProgressData.experimentAssignments: Record<string, ExperimentAssignment>`

合并规则：按固定秩 `observer > repair > course` 合并（确定性）；存在记录时取秩较高者。

---

## 首页"今日任务"

### 优先级

1. 到期技能 D1/D7 复习（urgent）
2. 到期课程 D1/D7 复习（urgent）
3. 活跃微补修会话
4. 活跃课程干预
5. 学习目标
6. 当前学习中课程（恢复）
7. 下一新课程（fallback）

### 技能复习任务链接

- form A: `/repair/:skillId?target=:targetSkillId&review=d1|d7`
- form B: `/repair/:skillId?target=:targetSkillId&review=d1|d7&form=b`

`eventCycleId` 格式：

```
sr:{skillId}:{stage}:{formId}:{updatedAt}
```

---

## Learning Events

### Supabase 表

```sql
CREATE TABLE public.learning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_event_id text NOT NULL,
  event_name text NOT NULL CHECK (event_name IN (
    'home_task_viewed', 'home_task_opened',
    'intervention_assigned', 'intervention_completed',
    'skill_review_scheduled', 'skill_review_started',
    'skill_review_finished', 'stable_achieved'
  )),
  skill_id text,
  course_id text,
  mode text,
  variant text,
  passed boolean,
  first_try boolean,
  duration_ms integer CHECK (duration_ms >= 0),
  due_at timestamptz,
  app_version text,
  content_version text,
  properties jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_event_id)
);
```

### RLS

- `anon` / `authenticated`：REVOKE ALL
- GRANT INSERT to `authenticated`（policy: `auth.uid() = user_id`）
- GRANT SELECT to `service_role` only

### 客户端

`logLearningEvent()` — fire-and-forget，不阻塞 UI，不抛异常。

### `properties` 结构化字段（review 相关事件）

```typescript
{
  reviewCycleId: string;   // rc:{skillId}:{stage}:{formId}:{updatedAt}
  attemptNo: number;
  firstExposure: boolean;
  evidenceEligible: boolean;
  formId: 'a' | 'b';
  origin?: string;         // e.g. 'course_intervention'
}
```

### 事件触发时机

| 事件 | 触发时机 |
|------|----------|
| `skill_review_scheduled` | 成功补修后首次安排 D1；D1 首次通过后安排 D7；course 干预完成后安排补救题组 |
| `skill_review_started` | 复习页面首次渲染且 schedule 到期时（首次/重试均触发） |
| `skill_review_finished` | 每次有效尝试结束后（无论是否首次、是否通过） |
| `stable_achieved` | D7 首次通过且技能进入 `stable` 时 |
| `intervention_completed` | 课程干预对应课程首次通过时 |

---

## 验证命令

```bash
npm run test && npm run build && npm run lint && git diff --check
```
