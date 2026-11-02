# math-k6 Daily Release Report

## Version

v2026.10.08 · fill-blank keyboard continuation

## Today's Release Goal

让键盘学生从已完成题目进入填空题时，可以立即输入答案，无需再定位输入框。

## Why

v2026.10.06 已让作答后的“下一题/查看结果”自动获得焦点，但点击或按 Enter 进入下一道填空题后，已卸载的推进按钮会让焦点回到 `body`。连续练习仍在题型切换处中断。

## Evidence

- `FillBlankGame` 的唯一答案入口是文本输入框，原实现没有挂载时焦点管理。
- 新增真实 `GameRunner` 回归在修复前失败：从已聚焦的“下一题”进入填空题后，`document.activeElement` 是 `body`，不是答案输入框。
- 10 月 6 日已在相邻流程采用原生 `autoFocus` 管理唯一推进动作；填空题复用同一浏览器能力即可闭合该键盘路径。

## Product Spec

### Problem

键盘作答可到达“下一题”，但下一题是填空题时不能直接继续输入，造成一次不必要的重新定位。

### Target User

使用键盘连续完成小学数学练习、尤其需要在选择和填空题之间切换的学生。

### User Story

作为学生，我完成上一题后进入填空题时，希望光标已在答案框内，能立刻键入答案。

### Solution and Scope

- 为既有 `FillBlankGame` 的答案输入框添加原生 `autoFocus`。
- 新增一条真实 `GameRunner` 回归，覆盖“判断题完成 → 下一题 → 填空输入框获得焦点”。

### Non-goals

不新增快捷键、题型、状态、依赖、题库、评分、首次作答证据、进度、认证、API、数据库或迁移。

### Edge Cases and Acceptance Criteria

1. 填空题首次挂载时，答案输入框获得焦点。
2. 从已聚焦的“下一题”推进到填空题后，焦点不落回页面 `body`。
3. 填空题既有空值禁用、首次错误后重试、最终反馈和分数语义不变。
4. 全量回归、类型检查、构建和 diff 检查通过；本地公开入口可加载且没有错误覆盖层。

## Technical Design

- 影响模块：`FillBlankGame`、`GameRunner` 的真实交互回归。
- 前端：复用浏览器原生 `autoFocus`，不增加 React 状态、全局键盘监听或依赖。
- 调用面：数学课程、语言课程与技能补修页面均复用同一 `FillBlankGame`，因此在组件根因处修复。
- 后端、API、数据库、AI、持久化、安全、性能和迁移：无变更。
- 回滚：移除该原生属性即可；发布后以前一生产部署为回滚目标。

## Product Changes

学生从选择或判断题推进到填空题后，可直接键入答案。键盘学习路径覆盖“作答 → 反馈 → 推进 → 输入”的连续节奏。

## Implementation

- 在 `src/components/games/FillBlankGame.tsx` 的答案输入框添加 `autoFocus`。
- 在 `src/test/gameRunnerRestart.test.tsx` 增加焦点断言；修复前失败，修复后通过。
- 更新 `CHANGELOG.md`。

## QA

- 失败复现：`npm run test -- src/test/gameRunnerRestart.test.tsx` 在改动前 1/2 失败，明确显示焦点落在 `body`。
- 定向回归：同一命令在改动后 2/2 通过。
- 全量回归：`npm run test`，26 个文件、598 项通过。
- `npm run lint`：退出码 0；仅有既有 Fast Refresh 与 `ChoiceGame` hooks 警告。
- `npm run typecheck`、`npm run build`、`git diff --check`：均通过。
- 浏览器：本地 Vite 入口在 `http://127.0.0.1:5174/` 重定向至完整登录表单，无错误覆盖层。该隔离工作树没有 Supabase 环境变量且没有受控账号，故认证课程与云端进度没有冒充为已验收；核心焦点流由真实组件回归验证。

## Bugs Fixed

- 修复从推进按钮进入填空题后焦点丢失到页面 `body` 的键盘连续作答中断。

## Release Status

`DONE`。

- Git：`1675594`（`fix: focus fill-blank answers`）已推送至 `origin/main`。
- Production：`vercel deploy /private/tmp/math-k6-deploy-20261008-clean.hTH6rC --prod --yes --scope logsail --project math-k6 --non-interactive` 成功；部署 `dpl_67LQmh2KuCGe4i8s96HwWAvKc9AN` 为 `READY`，别名为 <https://math.logsail.lat>。
- 部署 URL：<https://math-k6-hx92s0nyx-logsail.vercel.app>。
- 回滚目标：紧邻的前一生产部署 <https://math-k6-k00gbktxt-logsail.vercel.app>；若需回退，应先检查其变更范围后使用受控 Vercel rollback。

## Product Impact

本版延续既有键盘答题和答案后推进能力，消除题型切换中的一次手动定位；不改变学习证据或掌握判断，只降低真实连续练习的操作摩擦。

## Known Issues

- 认证态“课程作答 → 云端同步 → 同账号重登回读”仍需用户控制的受控账号。
- 本地隔离工作树未注入 Supabase 环境变量；该警告不等同生产配置故障。
- 限时题扩题仍需独立的内容、时间压力与反馈评审。

## Backlog

- 完成：填空题进入时的键盘焦点连续性。
- 保留：授权账号下课程到云端进度回读；限时题扩题前的内容与反馈审校。

## Next Candidates

1. 使用已授权账号完成课程作答、云端同步和同账号重登回读。
2. 审核其他非键盘题型的进入焦点与无障碍操作，再选择一个有证据的小切片。
3. 为限时题扩题建立内容与反馈验收，再决定是否增加题库。

## Final Status

`DONE`：唯一目标、失败复现、定向与全量回归、工程门禁、公开入口核查、提交、推送和生产部署均已完成。认证课程与云端回读仍是受控账号边界，未被本轮证据替代。
