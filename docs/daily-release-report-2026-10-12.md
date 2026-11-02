# math-k6 Daily Release Report

## Version

v2026.10.12 · 排序题键盘连续操作

## Today's Release Goal

让学生从上一题进入步骤排序或时间线题后，焦点落在第一个可用的排序操作上；若题目只有一项，则落在“确认”。

## Why

10 月 11 日已修复配对题进入时的焦点丢失，但剩余两种排序类题型仍会在切题后把焦点交还给页面主体。键盘、开关控制和屏幕阅读器用户需要重新定位，打断连续练习。

## Evidence

- 当前数学内容各有一节 `drag-assemble`（步骤排序）和 `timeline`（时间线）题，两个组件都提供上移/下移按钮但没有挂载焦点。
- 新增真实 `GameRunner` 跨题回归在修复前 4/7 失败：两个题型在“可排序”及“单项无需排序”场景中，焦点均回落至 `body`。
- 该路径已有语义化按钮；原生 `autoFocus` 足以修复，无需新增快捷键、状态或依赖。

## Product Spec

### Problem

从已完成题推进到排序类题型时，已卸载的“下一题”按钮使焦点落回页面主体，学生不能立即继续调整顺序或确认答案。

### Target User

连续用键盘、开关控制或屏幕阅读器完成小学数学练习的学生。

### User Story

作为完成上一题的学生，我希望进入排序题后直接定位到下一步可执行的排序操作，以便不重新导航就能继续练习。

### Solution and Scope

- 步骤排序和时间线题在有多项时自动聚焦第一个“下移”按钮。
- 只有一项、没有可排序操作时自动聚焦“确认”。
- 增加两种题型的真实跨题焦点回归。

### Non-goals

不改变题目随机顺序、上移/下移逻辑、计分、首错证据、重试反馈、内容、进度、认证、API、数据库或迁移；不扩展其他题型或新增全局快捷键。

### Edge Cases and Acceptance Criteria

1. 判断题推进到有两项的步骤排序和时间线题时，第一个“下移”按钮获得焦点。
2. 单项排序题不会把焦点放在禁用按钮，而是聚焦“确认”。
3. 既有填空、配对和排序重试/证据回归保持通过。
4. lint、类型检查、全量单元测试、生产构建、diff 检查和本地公开入口核验通过。
5. 未提供受控登录账号或本地 Supabase 公共变量时，不宣称认证课程、云端同步或重登回读已验收。

## Technical Design

- 影响模块：`DragAssembleGame`、`TimelineGame` 和 `gameRunnerRestart`。
- 前端：复用原生 `autoFocus`；以题目项数区分可排序操作与唯一可执行的确认操作。
- 后端、API、数据库、AI、持久化、安全、性能和迁移：无变更。
- 回滚：回退本轮提交，或将 Vercel 别名指回上一生产部署；没有数据操作。

## Product Changes

学生从任意已完成题进入步骤排序或时间线题后，可以直接按键继续调整顺序；没有可调整项时则可立即确认，避免焦点落空。

## Implementation

- 两种排序组件均在多项题中聚焦第一个可用的“下移”按钮。
- 两种排序组件均在单项题中聚焦“确认”。
- `gameRunnerRestart` 覆盖两个题型、两项与单项边界。
- 更新 `CHANGELOG.md`。

## QA

- 缺陷复现：修复前定向回归 7 项中 4 项失败，预期控件焦点实际为 `body`。
- 定向回归：`npm run test -- src/test/gameRunnerRestart.test.tsx`，7/7 通过。
- 全量回归：`npm test`，27 个文件、604 项通过。
- `npm run lint`：退出码 0，仅有既有 Fast Refresh 和 `ChoiceGame` hooks 警告。
- `npm run typecheck`、`npm run build` 和 `git diff --check`：均通过。
- 浏览器：本地生产预览的 `/login` 正常显示登录表单，控制台 0 error；仅报告隔离工作树缺少 Supabase 公共变量的已知 warning。焦点核心流由真实组件跨题回归验证。

## Bugs Fixed

- 修复进入步骤排序和时间线题后焦点回落至页面主体、无法连续键盘操作的问题。

## Release Status

`DONE`。

- 代码提交：`f0b1ff8 fix: focus ordering game entry`，已推送至 `release/daily-20261012-ordering-focus` 并快进至 `origin/main`。
- 部署命令：`vercel deploy . --prod -y`，使用已链接的 `logsail/math-k6` 项目。
- 生产部署：`dpl_Hu6H7kG3W5D5rcLx5aX1yFP7Bw9U`，状态 `READY`，地址 <https://math-k6-2q0kuan6t-logsail.vercel.app>，已别名至 <https://math.logsail.lat>。
- 回滚目标：上一生产候选 <https://math-k6-1ruvb4jcw-logsail.vercel.app>；回滚前应先核验其部署内容与别名。

## Product Impact

该版本将既有的“作答 → 推进 → 继续操作”键盘体验补齐到全部排序类数学题，减少辅助技术用户在题型切换时的额外导航成本，同时保持确定性的教学证据模型。

## Known Issues

- 真实登录后的课程作答、云端同步与同账号重登回读仍需受控账号验收。
- 本地隔离工作树没有 Supabase 公共变量，故本轮不验证认证链路。

## Backlog

- 完成：排序和时间线题进入时的键盘焦点连续性。
- 保留：受控账号下的“课程作答 → 云端同步 → 重登回读”验收。

## Next Candidates

1. 使用受控账号验收密码找回、登录、课程作答、云端同步和重登回读闭环。
2. 审校限时题的题库、时限和反馈质量，再决定是否扩充内容。
3. 根据真实学习数据评估后续键盘和辅助技术改进的优先级。

## Final Status

`DONE`：唯一目标、失败复现、定向与全量回归、工程门禁、公开入口核验、提交、推送和生产部署均已完成。认证课程和云端进度仍是受控账号边界，未被本轮证据替代。
