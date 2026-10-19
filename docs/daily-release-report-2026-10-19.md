# math-k6 Daily Release Report

## Version

v2026.10.19 · Timed practice admission

## Today's Release Goal

让尚未完成教学时长审查的三年级进位乘法限时题默认以不限时练习进行；未来已审查题必须由学生主动选择开始限时或不限时练习。

## Why

速度不等于数学掌握。当前唯一限时题是 `g3-mult-1digit` 的 `23 × 4`：它要求处理进位、保留中间结果、读题并定位选项，但仓库没有学生时长校准证据。原组件在挂载时立即以 `timeLimit`（缺省为 30 秒）倒计时，学生不能先选择不限时。

## Evidence

- 课程内容中唯一的 `timed-challenge` 是第 6 题 `q-timed-challenge-1`，历史配置为 15 秒；课程另有不限时填空迁移题。
- 独立质量审查分支已明确该 15 秒仍为待审参数，不应被当作教学标准；本轮采用其中最小的安全结论，而不合并其未审的大范围重构。
- 运行时代码此前使用 `question.timeLimit ?? 30` 并在组件挂载后启动 interval，未检查审查状态。

## Product Spec

### Problem

未经校准的时限会把读题、辅助技术操作或思考速度误作数学能力，并在学生尚未选择前开始倒计时。

### Target User

正在完成三年级多位数乘一位数练习、需要更多思考或键盘辅助操作时间的小学生。

### User Story

作为学生，我希望待验证的速度练习不会自动给我倒计时；如果将来题目经过审查，我仍能自己选择限时或不限时后再看到题目。

### Solution and Scope

- `Question.timing.reviewStatus` 明确标记 `pending` 或 `approved`。
- 仅有效正整数秒且状态为 `approved` 的题目显示“开始 N 秒练习”与“不限时练习”；选择前不显示题干或选项。
- 待审、缺失或无效配置一律直接进入不限时练习，不使用 30 秒默认值。
- 将当前 `23 × 4` 标为 `pending`，保留题目、答案、解析、分值和历史 15 秒候选值。

### Non-goals

不批准 15 秒、不制定年级速度标准、不改变评分、迁移证据、题库内容、进度、认证、API、数据库或历史学习记录；不合并独立质量分支的大范围计时重构。

### Edge Cases and Acceptance Criteria

1. `pending` 题即使带有 1 秒配置也不倒计时、不超时，仍可正常作答。
2. 合格 `approved` 题先聚焦模式选择；学生选择不限时后才显示题面并可作答。
3. 选择开始限时后保留既有倒计时、超时状态播报、键盘作答和答案反馈。
4. 缺失或非法时限不能回退为默认 30 秒。
5. 全量测试、lint、类型检查、生产构建、diff 检查、预提交钩子和本地生产预览均通过。

## Technical Design

- 影响模块：`Question` 内容契约、`TimedChallengeGame`、唯一课程 JSON、限时题状态播报测试、新的准入回归与一条既有异步断言稳定化测试。
- 前端：一个局部三态模式（选择/限时/不限时）；不改 props、调用方、路由或持久化模型。只在限时模式创建 interval，超时 effect 同样受该模式保护。
- Backend / API / database / migration / AI：无变更。
- 安全与兼容：缺失、待审、0、负数或非安全整数时限均安全地降级为不限时；没有网络请求或用户数据写入。
- Rollback：回退代码提交 `58a1291`，或将正式别名恢复到上一已就绪部署 `dpl_FthzdG4gTwuBeX58uvPyz6BYDnQP`（恢复前核验其内容）。

## Product Changes

学生做当前的 `23 × 4` 时会直接看到“不限时练习”，不再被未经验证的 15 秒时钟催促。后续经过审查的限时题会先让学生决定是否进入计时模式，避免在题目尚未展示时消耗时间。

## Implementation

- `src/lib/types.ts`：增加最小 `TimedPracticePolicy` 审查状态。
- `src/components/games/TimedChallengeGame.tsx`：移除 30 秒默认时限，增加审查门槛与学生模式选择，并把超时限制在已开始的限时模式。
- `src/content/knowledge-points/g3-mult-1digit/game.json`：把唯一限时题标记为 `pending`。
- `src/test/timedChallengeTiming.test.tsx`：覆盖待审不限时与已审主动选择；既有状态播报测试覆盖主动开始后超时。
- `src/test/knowledgePointPageGoal.test.tsx`：等待 URL 目标同步 effect，消除预提交中发现的既有异步断言竞态。

## QA

- 缺陷回归：待审 `timeLimit: 1` 经过虚拟 1 秒不触发 `onAnswer`，选择答案后正常回调。
- 模式回归：已审题首焦点在“开始 1 秒练习”；选择“不限时练习”后才显示题干。
- 定向回归：限时准入、键盘、状态播报与快捷键共 4 个文件、19 项通过。
- 全量：`npm run test`，30 个文件、615 项通过；预提交钩子再次运行类型检查与全量测试，同为通过。
- `npm run lint`：退出码 0；仅保留仓库既有 Fast Refresh / `ChoiceGame` hooks 警告。
- `npm run typecheck`、`npm run build`、`git diff --check`：通过。
- 浏览器：本地生产预览的 `/login` 完整渲染，console 为 0 error、1 条缺少本地 Supabase 公共变量 warning；受保护课程 URL 正确跳转登录。没有受控账号与本地 Supabase 公共变量，故未把已登录课程、同步或重登写为已验收。

## Bugs Fixed

- 修复未审查的 `timeLimit` 自动启动倒计时以及无时限配置默认使用 30 秒的学习公平性问题。
- 在实现中发现不限时模式的 `timeLeft=0` 会误触发超时；已将超时 effect 限定为主动开始的限时模式，并由新回归锁定。

## Release Status

`DONE`。

- 代码提交：`58a1291 fix: gate unreviewed timed practice`，已推送至 `release/daily-20261019-keyboard-result-actions`。
- 正式部署命令：`vercel deploy . --prod -y --scope logsail --project math-k6`。
- 正式部署：`dpl_Bc3xHS7v899iRCRSHP6oER5Bo722`，状态 `READY`，地址 <https://math-k6-dtaw1cqy3-logsail.vercel.app>，已别名至 <https://math.logsail.lat>。
- 回滚候选：`dpl_FthzdG4gTwuBeX58uvPyz6BYDnQP`，地址 <https://math-k6-d0jelenh3-logsail.vercel.app>；它仍显示为 `READY`，恢复别名前须核验内容。

## Product Impact

本版本把“速度练习”从默认压力源改为受审且由学生决定的练习选项。math-k6 更能区分数学理解与操作/阅读时间，且没有用生成式 AI 临场决定题目、答案或掌握状态。

## Known Issues

- 当前 15 秒仍没有真实学生校准或教学负责人批准，故继续按不限时练习运行。
- 真实登录后的密码找回、课程作答、云端同步与同账号重登回读仍需要受控账号验收。
- 计时性能不进入本次掌握或证据模型的完整分离方案仍在独立质量分支，未在本版本合并。

## Backlog

- 完成：阻止待审时限自动倒计时，并给已审题提供主动模式选择。
- 保留：受控账号下完成密码找回、登录、课程作答、云端同步和重登回读闭环验收。
- 保留：在有真实分层数据与教学审查后，再决定是否批准该题或设计新的速度练习。

## Next Candidates

1. 用受控账号验收密码找回、登录、课程作答、云端同步与重登回读。
2. 审核独立限时题质量分支，决定是否以完整的速度/掌握分离方案替换本轮最小门槛。
3. 收集真实学习数据后，再确定下一项辅助技术优先级。

## Final Status

`DONE`：唯一目标、准入与模式选择回归、全量工程门禁、浏览器公开入口检查、候选分支推送和正式部署均已完成。认证课程与云端进度仍是明确的受控账号边界。
