# math-k6 Daily Release Report

## Version

v2026.10.14 · 真伪题键盘连续操作

## Today's Release Goal

让学生从已完成题推进到真伪判断题时，第一个答案选项自动获得焦点，可立即用键盘继续作答。

## Why

连续练习时，“下一题”按钮会被卸载。真伪判断题已有 `1/A` 和 `2/B` 快捷键，但此前没有自己的入场焦点；焦点会回到页面主体，键盘、开关控制和屏幕阅读器用户需要额外重新定位才能继续。

## Evidence

- 10 月 8—13 日已分别为填空、配对、排序和限时题补齐跨题入场焦点；`TrueFalseGame` 是现有题型中唯一仍缺少该保障的组件。
- 现有数学内容中有多道真伪题，覆盖三至六年级；这是一项可立即改善的共用交互路径。
- 新增真实 `GameRunner` 跨题回归在修复前失败：从选择题推进到真伪题后，期望的“对”按钮实际焦点为 `body`。

## Product Spec

### Problem

上一题完成后进入真伪判断题，学生无法立即连续键盘作答，打断了自主练习流程。

### Target User

连续使用键盘、开关控制或屏幕阅读器完成小学数学练习的学生。

### User Story

作为刚完成上一题的学生，我希望进入判断题时已经定位在第一个可选答案上，以便立即使用题面已支持的 `1/A` 或 `2/B` 快捷键继续作答。

### Solution and Scope

- 真伪题首次挂载时，为第一个答案按钮使用原生 `autoFocus`。
- 覆盖“选择题 → 真伪题”的真实 `GameRunner` 跨题焦点回归。
- 更新变更日志和本日报。

### Non-goals

不改变快捷键、选项顺序、判分、首错反馈、重试、题库、进度、认证、API、数据库或迁移；不扩展为新的无障碍配置系统。

### Edge Cases and Acceptance Criteria

1. 从已结算选择题推进到真伪题后，第一个答案按钮获得焦点。
2. 真伪题原有 `1/A`、`2/B` 快捷作答、首错提示、改选和计分行为不回归。
3. 题库、反馈、进度和证据语义保持不变。
4. 定向与全量测试、lint、类型检查、生产构建、差异检查和本地公开入口均通过。
5. 没有受控登录会话或 Supabase 公共变量时，不宣称已验收认证课程、云端同步或重登回读。

## Technical Design

- 影响模块：`TrueFalseGame`、`gameRunnerRestart`、CHANGELOG 和本报告。
- 前端：复用其他题型的原生 `autoFocus` 模式；不新增状态、监听器、依赖或抽象层。
- 后端、API、数据库、AI、持久化、安全、性能和迁移：无变更。
- 回滚：回退本轮提交，或将生产别名恢复至上一就绪部署；没有数据回滚操作。

## Product Changes

从普通选择题进入判断题后，学生可直接继续键盘操作，不再因焦点回落到页面主体而中断。

## Implementation

- 为 `TrueFalseGame` 的首个答案按钮增加 `autoFocus`。
- 新增选择题推进到真伪题后的焦点回归；修复前失败，修复后通过。
- 更新 `CHANGELOG.md`。

## QA

- 缺陷复现：定向 `gameRunnerRestart` 新案例在修复前失败，实际焦点为 `body`。
- 定向回归：`npm run test -- src/test/gameRunnerRestart.test.tsx`，9/9 通过。
- 全量单元测试：27 个文件、606 项通过。
- `npm run lint`：退出码 0，仅有既有 Fast Refresh/hooks warning。
- `npm run typecheck`、`npm run build`、`git diff --check`：均通过。
- 浏览器：本地生产预览入口实际重定向至完整 `/login` 表单，console 0 error；隔离环境仅出现缺少 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 的已知 warning。真伪题核心流由真实组件跨题回归覆盖，未将公开登录页冒充为认证课程验收。

## Bugs Fixed

- 修复从上一题进入判断题时焦点回落至页面主体、无法连续键盘操作的问题。

## Release Status

`DONE`。

- 代码提交：`e2cf732 fix: focus true-false answers`，已推送至 `origin/main` 和 `release/daily-20261014-true-false-focus`。
- 部署命令：`vercel deploy . --prod -y`，使用已链接的 `logsail/math-k6` 项目。
- 生产部署：`dpl_GuBtbKcTrjCDLjunG7f2f386gsMZ`，状态 `READY`，地址 <https://math-k6-mv9mlgqj7-logsail.vercel.app>，已绑定 <https://math.logsail.lat>。
- 回滚候选：`dpl_Fs61Cti18eYR3CfMXHMkDn7sBEXg` 为 `READY`；恢复别名前应核验其内容。

## Product Impact

math-k6 的全部已上线交互题型现在具备“作答 → 推进 → 下一步可操作”的键盘起点。它将注意力留给数学判断而非页面重新定位，提升独立练习的一致性。

## Known Issues

- 真实登录后的课程作答、云端同步与同账号重登回读仍需要受控账号验收。
- 本地公开入口缺少 Supabase 公共变量，不能验证认证链路。

## Backlog

- 完成：真伪题进入时的键盘焦点连续性。
- 保留：受控账号下“密码找回 → 登录 → 课程作答 → 云端同步 → 重登回读”验收。
- 保留：以真实学习数据评估后续辅助技术改进的优先级。

## Next Candidates

1. 在受控账号下验收密码找回、登录、课程作答、云端同步和重登回读闭环。
2. 为限时题建立内容、时限和反馈质量准入标准，再决定是否扩题。
3. 基于真实学习数据评估下一步辅助技术改进的优先级。

## Final Status

`DONE`：唯一目标、失败复现、定向与全量回归、工程门禁、本地公开入口核验、提交、推送和生产部署均已完成。认证课程与云端进度仍是独立的受控账号边界，未被本轮证据替代。
