# math-k6 Daily Release Report

## Version

v2026.10.13 · 限时题键盘连续操作

## Today's Release Goal

让学生从已完成题推进到 15 秒限时选择题时，第一个答案选项自动获得焦点，可立即用键盘继续作答。

## Why

连续练习时，“下一题”按钮会被卸载。限时题此前没有自己的入场焦点，焦点会回到页面主体；对键盘、开关控制和屏幕阅读器用户而言，这会额外消耗本应用于心算的 15 秒。

## Evidence

- 当前已发布数学内容只有一题 `timed-challenge`：三年级“多位数乘一位数”中的 `23 × 4`，时限 15 秒。
- 10 月 8—12 日已分别补齐填空、配对和两种排序题的跨题焦点；限时选择是唯一仍缺少该连续性保障的已上线题型。
- 新增真实 `GameRunner` 跨题回归在修复前失败：推进到限时题后，期望的首个答案按钮实际焦点为 `body`。

## Product Spec

### Problem

上一题完成后进入限时题，学生不能立即开始键盘作答，造成同一条练习路径在时间压力下中断。

### Target User

连续使用键盘、开关控制或屏幕阅读器完成小学数学练习的学生。

### User Story

作为刚完成上一题的学生，我希望进入限时选择题就位于第一个可选答案上，以便马上用方向键或题面已支持的 `1–4` / `A–D` 快捷键继续作答。

### Solution and Scope

- 限时题首次挂载时，首个答案按钮使用原生 `autoFocus`。
- 覆盖“判断题 → 限时题”的真实 `GameRunner` 跨题焦点回归。
- 更新变更日志和本日报。

### Non-goals

不扩充题库，不改变唯一题目的 15 秒时限，不调整快捷键、判分、超时、首次证据、重试、进度、认证、API、数据库或迁移。

### Edge Cases and Acceptance Criteria

1. 从已结算判断题推进到限时题后，首个答案按钮获得焦点。
2. 限时题原有 `1–4` / `A–D` 作答与仅结算一次的行为不回归。
3. 题库、时限、计分、反馈和证据语义保持不变。
4. 定向与全量测试、lint、类型检查、生产构建、差异检查和本地公开入口均通过。
5. 没有受控登录会话或 Supabase 公共变量时，不宣称已验收认证课程、云端同步或重登回读。

## Technical Design

- 影响模块：`TimedChallengeGame`、`gameRunnerRestart`、CHANGELOG 和本报告。
- 前端：复用其他已发布题型采用的原生 `autoFocus`，不新增状态、快捷键监听、依赖或抽象层。
- 后端、API、数据库、AI、持久化、安全、性能和迁移：无变更。
- 回滚：回退提交 `dd5c796`，或将生产别名指回上一就绪生产部署 `dpl_Hu6H7kG3W5D5rcLx5aX1yFP7Bw9U`（<https://math-k6-2q0kuan6t-logsail.vercel.app>）；没有数据回滚操作。

## Product Changes

从普通题进入 15 秒限时题后，学生可直接继续键盘操作，不再因焦点回落到页面主体而浪费作答时间。

## Implementation

- 为 `TimedChallengeGame` 的首个答案按钮增加 `autoFocus`。
- 新增判断题推进到限时题后的焦点回归；修复前失败，修复后通过。
- 更新 `CHANGELOG.md`。

## QA

- 缺陷复现：定向 `gameRunnerRestart` 新案例在修复前失败，实际焦点为 `body`。
- 定向回归：`npm run test -- src/test/gameRunnerRestart.test.tsx`，8/8 通过。
- 全量单元测试：27 个文件、605 项通过。
- `npm run lint`：退出码 0，仅有既有 Fast Refresh/hooks warning。
- `npm run typecheck`、`npm run build`、`git diff --check`：均通过。
- 浏览器：本地 Vite `/login` 实际渲染完整登录表单，console 0 error；隔离环境仅出现缺少 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 的已知 warning。限时核心流由真实组件跨题回归覆盖，未将公开登录页冒充为认证课程验收。

## Bugs Fixed

- 修复从上一题进入限时选择题时焦点回落至页面主体、无法连续键盘操作的问题。

## Release Status

`DONE`。

- 代码提交：`dd5c796 fix: focus timed challenge entry`，已推送至 `origin/main` 和 `release/daily-20261013-timed-focus`。
- 部署命令：`vercel deploy . --prod -y`，使用已链接的 `logsail/math-k6` 项目。
- 生产部署：`dpl_Fs61Cti18eYR3CfMXHMkDn7sBEXg`，状态 `Ready`，地址 <https://math-k6-5ljaotn1o-logsail.vercel.app>，已绑定 <https://math.logsail.lat>、<https://math-k6.vercel.app> 和 <https://math-k6-logsail.vercel.app>。
- 回滚候选：`dpl_Hu6H7kG3W5D5rcLx5aX1yFP7Bw9U` 为 `Ready`；恢复别名前应核验其内容。

## Product Impact

math-k6 的已上线交互题型现在都具备“作答 → 推进 → 下一步可操作”的键盘起点。它让有限时间真正用于数学判断而非重新定位，形成比堆叠新题更可靠的自主练习体验。

## Known Issues

- 真实登录后的课程作答、云端同步与同账号重登回读仍需要受控账号验收。
- 限时题目前仅有一道。新增题目或调整时限前，需单独审查时间压力是否服务课程目标与反馈质量。
- 本地公开入口缺少 Supabase 公共变量，不能验证认证链路。

## Backlog

- 完成：限时题进入时的键盘焦点连续性。
- 保留：受控账号下“密码找回 → 登录 → 课程作答 → 云端同步 → 重登回读”验收。
- 保留：以真实学习数据和内容审校决定限时题是否扩题、如何设定时限与反馈。

## Next Candidates

1. 在受控账号下验收密码找回、登录、课程作答、云端同步和重登回读闭环。
2. 为限时题建立内容、时限和反馈质量准入标准，再决定是否扩题。
3. 基于真实学习数据评估下一步辅助技术改进的优先级。

## Final Status

`DONE`：唯一目标、失败复现、定向与全量回归、工程门禁、本地公开入口核验、提交、推送和生产部署均已完成。认证课程与云端进度仍是独立的受控账号边界，未被本轮证据替代。
