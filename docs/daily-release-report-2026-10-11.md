# math-k6 Daily Release Report

## Version

v2026.10.11 · 配对题键盘连续操作

## Today's Release Goal

让学生从已完成题目进入配对题后，焦点自动落在第一个待匹配项目上，能够立即通过键盘继续操作。

## Why

上一轮已补齐填空题和“下一题”按钮的焦点连续性，但配对题仍会在切题时让焦点落回页面主体。使用键盘或辅助技术的学生需要重新导航，打断练习节奏。

## Evidence

- `GameRunner` 会卸载已聚焦的“下一题”按钮；配对题未指定新的焦点目标。
- 新增跨题回归在修复前失败：期望“数字 1”项目获得焦点，实际焦点是 `body`。
- 配对题已有语义化项目按钮，最小修复可复用浏览器原生 `autoFocus`，无需新快捷键或状态。

## Product Spec

### Problem

进入配对题后键盘焦点丢失，学生无法无缝继续完成练习。

### Target User

连续使用键盘、开关控制或屏幕阅读器完成题目的小学学习者。

### User Story

作为完成上一题的学生，我希望进入配对题后直接定位到第一个可选项目，以便立即开始匹配。

### Solution and Scope

- 配对题挂载时，让第一个剩余项目按钮获得原生焦点。
- 增加“判断题 → 配对题”的跨题回归。

### Non-goals

不新增键盘快捷键、不更改匹配顺序、计分、首错证据、题目内容、登录或进度同步。

### Edge Cases and Acceptance Criteria

1. 从已作答判断题进入单项目配对题时，第一个项目获得焦点。
2. 既有填空题切换焦点与配对题首错证据回归保持通过。
3. lint、类型检查、全量单元测试、生产构建和 diff 检查通过。
4. 本地生产构建的公开登录入口可打开且无控制台错误；认证课程流程不作未验证声明。

## Technical Design

- 影响模块：`DragMatchGame` 与 `gameRunnerRestart` 跨题回归。
- 仅在既有项目按钮映射中使用首项索引设置 `autoFocus`；不新增依赖、API、数据库、迁移或状态。
- 兼容性：保留鼠标点击、项目随机顺序、配对完成与首次证据语义。
- 回滚：回退本轮提交，或将 Vercel 别名指回上一生产部署；无数据操作。

## Product Changes

学生在完成上一题后进入配对题，可以直接开始键盘匹配，不必重新定位页面焦点。

## Implementation

- `DragMatchGame` 的第一个待匹配项目按钮在挂载时自动聚焦。
- `gameRunnerRestart` 覆盖“判断题 → 配对题”并断言焦点目标。
- `CHANGELOG.md` 记录版本变化。

## QA

- 缺陷复现：新跨题回归在修复前失败，焦点实际落在 `body`。
- 定向回归：`npm run test -- src/test/gameRunnerRestart.test.tsx`，3/3 通过。
- 全量回归：`npm test`，27 个文件、600 项通过。
- `npm run lint`：退出码 0，仅有既有 Fast Refresh 与 ChoiceGame hooks 警告。
- `npm run typecheck`、`npm run build` 与 `git diff --check`：均通过。
- 浏览器：本地生产预览的 `/login` 正常显示，控制台无 error；该路由要求登录，未伪造认证课程验收。

## Bugs Fixed

- 修复切入配对题时焦点回落到页面主体的问题。

## Release Status

`DONE`。

- 代码提交：`d7c62db fix: focus match game entry`，已推送至 `release/daily-20261011-drag-match-focus` 并快进至 `origin/main`。
- 部署命令：`vercel deploy . --prod -y`（先受控链接既有 `logsail/math-k6` 项目）。
- 生产部署：`dpl_4ug57uGxgijpgukz7wMEWiH1u7MZ`，状态 `READY`，地址 <https://math-k6-1ruvb4jcw-logsail.vercel.app>，已别名至 <https://math.logsail.lat>。
- 部署后公共页：`https://math.logsail.lat/login` 正常显示登录表单，控制台无 error。
- 回滚目标：上一生产候选 <https://math-k6-oq9yzv9o8-logsail.vercel.app>；回滚前先复核其部署内容与别名。

## Product Impact

该修复把已有的键盘连续练习体验覆盖到配对题，减少焦点丢失造成的额外导航成本，同时保持确定性的教学证据模型。

## Known Issues

- 真实登录后的课程作答、云端同步与同账号重登回读仍需受控账号验收。
- 其余排序类题型的首次焦点尚未逐一审计，未在本轮扩大范围。

## Backlog

- 完成：配对题进入时的键盘焦点连续性。
- 保留：受控账号下的“课程作答 → 云端同步 → 重登回读”验收。

## Next Candidates

1. 受控账号下验收密码找回邮件、改密、登录及课程同步闭环。
2. 审核排序和时间线题型的首次焦点与键盘操作，选择一个最小独立修复。
3. 审校限时题的题库、时限和反馈质量后再扩充内容。

## Final Status

`DONE`：唯一目标、回归、工程门禁、生产部署与公开入口回读均已完成；认证课程和云端进度验收维持为明确的后续边界。
