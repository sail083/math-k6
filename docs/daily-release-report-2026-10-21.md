# math-k6 Daily Release Report

## Version

v2026.10.21 · Fill-blank retry focus

## Today's Release Goal

让学生在填空题第一次答错后，能不额外找回焦点就直接输入修正答案。

## Why

首次错误后的修正是自主学习的核心闭环。填空题会清空错误答案；但学生通过鼠标点击“确认”时，焦点会留在随即禁用的按钮上，键盘用户需要额外操作才能继续。昨日的选择题和判断题已修复同类焦点断点，本轮以实际组件行为补齐填空题路径。

## Evidence

- `FillBlankGame` 在首次错误时清空输入值且不提交答案，但没有移动焦点。
- 新增回归先让“确认”按钮获得焦点再提交错误答案；修复前断言失败，实际焦点为已禁用的“确认”按钮，而非清空后的输入框。
- `FillBlankGame` 被数学课程、语文/英语学习页及错题修复页复用，因此组件级修复覆盖这些既有路径，不必改变调用方。

## Product Spec

### Problem

首次填错后，输入框已清空但焦点仍可能停在禁用的提交按钮，导致“提示 → 修正输入”的操作链中断。

### Target User

使用键盘、屏幕阅读器或鼠标完成填空练习，并在首次错误后需要修正答案的学生。

### User Story

作为学生，我第一次填错后，希望系统在保留不泄露答案的提示时把输入焦点放回空白处，让我立刻继续思考并重填。

### Solution and Scope

- 首次错误清空输入值后，将焦点交回同一个填空输入框。
- 保留已有“再想想”状态提示、两次作答上限、计分与首次证据规则。

### Non-goals

不改题目、答案、提示、判分、题目数量、进度、认证、API、数据库、迁移或其他题型；不在第二次错误或最终结算后强行移动焦点。

### Edge Cases and Acceptance Criteria

1. 从获得焦点的“确认”按钮提交第一次错误答案后，输入框清空并重新获得焦点，且显示“再想想”。
2. 第一次错误不调用最终 `onAnswer`，不改变首答证据。
3. 第二次错误、正确作答和既有跨题焦点行为不回归。
4. 定向及全量测试、lint、类型检查、生产构建、diff 检查和公开入口浏览器检查通过。

## Technical Design

- 影响模块：`FillBlankGame`、既有 `gameFeedback` 回归。
- 前端：复用组件内输入框，新增一个局部 ref；仅在首次错误分支调用 `focus()`。
- Backend / API / database / migration / AI：无变更。
- Compatibility / performance：无新增依赖、网络请求或持久化写入；焦点操作只发生在首次错误时。
- Rollback：回退本轮代码提交；正式别名恢复前一已就绪部署前先核验内容。

## Product Changes

填错后学生会看到原有提示，输入框自动准备好接收下一次输入，连续键盘操作无需绕过禁用按钮。

## Implementation

- `src/components/games/FillBlankGame.tsx`：保存输入框 ref，并在首次错误清空值后恢复焦点。
- `src/test/gameFeedback.test.tsx`：用真实鼠标焦点前置条件锁定首次错误后的输入焦点与未提交语义。

## QA

- 红灯复现：焦点断言修复前失败；接收焦点的是禁用的“确认”按钮。
- 定向：`npm run test -- src/test/gameFeedback.test.tsx src/test/gameRunnerRestart.test.tsx src/test/gameResultAnnouncements.test.tsx`，3 个文件、15 项通过。
- 全量：`npm run test`，30 个文件、615 项通过。
- `npm run lint`：退出码 0；仅有仓库既有 Fast Refresh / `ChoiceGame` hooks 警告。
- `npm run typecheck`、`npm run build`、`git diff --check`：通过。
- 浏览器：本地生产预览 `/login` 正常渲染，console 0 errors；未登录访问 `/math/kp/g3-mult-1digit` 正确跳转 `/login`。本地缺少 Supabase 公共变量且未提供受控账号，因此不把已登录课程、同步或重登回读写为已验收。

## Bugs Fixed

- 修复填空题首次错误后焦点停在已禁用“确认”按钮，无法直接重填的问题。

## Release Status

`DONE`。

- 代码提交：`d3c47d3 fix: restore fill-blank retry focus`，已推送至 `main` 与 `release/daily-20261021-retry-input-focus`。
- 正式部署命令：`vercel deploy . --prod -y --scope logsail --project math-k6`。
- 正式部署：`dpl_DJdk9mmYRpfqKPtmo614N9Ar2tEk`，状态 `READY`，地址 <https://math-k6-7xd7vbmmc-logsail.vercel.app>，已别名至 <https://math.logsail.lat>。
- 线上公开验收：生产 `/login` 正常渲染；未登录访问 `/math/kp/g3-mult-1digit` 正确跳转 `/login`。未将其表述为已登录课程验收。
- 回滚候选：上一日已就绪生产部署 `dpl_8cK1KPDAmwCGWE9mZYb4TXqYLTmh`（<https://math-k6-22m8e4rpw-logsail.vercel.app>）；恢复别名前须核验其内容。

## Product Impact

本版本让填空题与已修复的选择题、判断题形成一致的错误恢复体验：错误提示不泄露答案，修正动作也不被焦点断点打断。这直接降低已有练习的操作摩擦，而不引入新的教学或数据假设。

## Known Issues

- 真实登录后的密码找回、课程作答、云端同步与同账号重登回读仍需要受控账号验收。
- 当前唯一限时题的时长仍缺少真实学习数据和教学批准，继续按不限时练习运行。
- lint 的既有 Fast Refresh / hooks 警告不在本轮范围。

## Backlog

- 完成：填空题首次错误后的输入焦点连续性。
- 保留：受控账号下的登录、课程作答、进度同步与重登回读闭环。
- 保留：基于真实学习数据和教学审查决定限时题时长与速度证据策略。

## Next Candidates

1. 用受控账号验收密码找回、登录、课程作答、云端同步与重登回读。
2. 在真实分层学习数据和教学审查可用后，决定唯一限时题的教学时长与速度证据策略。
3. 仅在实证存在焦点断点时，审核其他错误恢复流程。

## Final Status

`DONE`：唯一版本目标、红灯复现、定向与全量回归、工程门禁、公开入口浏览器检查、提交、推送与正式部署均已完成。认证课程与云端进度仍保留为受控账号验收边界。
