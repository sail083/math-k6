# math-k6 Daily Release Report

## Version

v2026.10.05 · modified shortcut guard

## Today's Release Goal

防止选择题快捷键把系统组合键误当作作答。

## Why

学生在练习页按 `Ctrl/⌘ + A` 全选文字时，原来的全局键盘监听会把 `A` 当作第一个选项并提交，可能污染一次作答、得分和学习证据。

## Evidence

- `ChoiceGame`、`TimedChallengeGame`、`TrueFalseGame` 都在 `window` 上监听字母/数字选项键，且都没有检查 `altKey`、`ctrlKey` 或 `metaKey`。
- 新增回归在修复前 12 项中有 9 项失败：三种题型的 `Ctrl/⌘/Alt + A` 均会提交第一个选项；普通 `A` 已有可用路径。
- 当前题库没有超过四个选项的题目，限时题也只有一题，因此未扩充键位或题库。

## Product Spec

### Problem

系统组合键与答题快捷键冲突，会让非作答操作意外变成答题提交。

### Target User

在桌面浏览器使用键盘完成数学练习、并使用常用系统快捷键的学生。

### User Story

作为学生，我希望单独按 `A` 仍能快速选择第一个选项，但按 `Ctrl/⌘/Alt + A` 不会误答题。

### Solution and Scope

- 在三种已有全局选项键处理器中，带 `Alt`、`Ctrl` 或 `⌘` 的按键直接忽略。
- 保留未带修饰键的 `1–4`、`A–D` 与判断题 `1/2`、`A/B`。

### Non-goals

不改题库、快捷键文案、计时、评分、首次作答证据、进度、认证、API、数据库或迁移。

### Edge Cases and Acceptance Criteria

1. 三种题型中，未修饰的 `A` 仍只提交一次。
2. 三种题型中，`Ctrl/⌘/Alt + A` 都不提交答案，也不阻止浏览器原有快捷键。
3. 既有判断题重试、限时题和选择题回归保持通过。
4. 本地公开入口正常显示登录页；不将未取得的认证课程和云端回读说成已验收。

## Technical Design

- 影响模块：`ChoiceGame`、`TimedChallengeGame`、`TrueFalseGame` 与一份组件级回归。
- 前端：在已有 `keydown` 守卫中增加原生修饰键判断；不引入依赖或新状态。
- 后端、API、数据库、AI、持久化、迁移：无变更。
- 兼容与安全：不调用 `preventDefault`，因此原生组合键仍可执行；实际作答继续经过既有同一 `handleSelect` 路径。
- 回滚：回退 `6beeafa`，或重新部署前一生产版本 `dpl_6qw3zTXsEQgPrk58S4kyH4xsPz6B`。

## Product Changes

选择题、限时选择题和判断题保留单键作答速度，同时不会再把常用组合键误记成一次答案。

## Implementation

- 三个全局选项键处理器均忽略 `altKey`、`ctrlKey`、`metaKey`。
- 新增 `keyboardShortcutModifiers` 回归，覆盖三种题型的普通 `A` 与九种修饰键组合。

## QA

- 定向：`npm run test -- src/test/keyboardShortcutModifiers.test.tsx src/test/trueFalseKeyboard.test.tsx src/test/timedChallengeKeyboard.test.tsx`，3 个文件、19 项通过。
- 全量：`npm run test`，26 个文件、596 项通过。
- `npm run lint` 退出码 0；只保留仓库既有 Fast Refresh 与 `ChoiceGame` hooks 警告，本轮未新增警告。
- `npm run typecheck`、`npm run build`、`git diff --check` 均通过；提交钩子再次运行类型检查与全量 596 项测试。
- 本地浏览器：`http://127.0.0.1:4173/` 重定向至完整登录表单，控制台 0 errors；无受控账号，未尝试认证课程或云端进度。

## Bugs Fixed

- 修复 `Ctrl/⌘/Alt + A` 被误映射为第一个答案的跨题型键盘冲突。

## Release Status

- Git：`6beeafa`（`fix: prevent modified shortcut answers`）已推送至 `origin/main`。
- Production：`vercel deploy . --prod --yes --scope logsail` 成功；部署 `dpl_2nEn84qLwVzEFBzpvvX5s1kmnXpS` 为 `READY` 并已别名到 <https://math.logsail.lat>。
- 部署 URL：<https://math-k6-lc65enrxx-logsail.vercel.app>。

## Product Impact

学生可以继续依赖一致的键盘答题方式，而不必担心常用浏览器和系统快捷键悄悄消耗一次作答机会；这直接保护了成绩反馈和掌握证据的可信度。

## Known Issues

- 认证态“课程作答 → 云端同步 → 同账号重登回读”仍需用户控制的受控账号。
- 正式域名自动化浏览器曾受 Cloudflare 人机验证阻挡；本轮未把部署 Ready 误作认证课程验收。
- 限时题仍只有一题，扩题前需要独立评审时间压力、反馈与课程价值。
- 2026-09-27 误建且未别名的 Vercel 项目尚未获授权清理。

## Backlog

- 完成：组合键误作答保护。
- 保留：授权账号下课程到云端进度回读；新增限时题前的内容与反馈评审。

## Next Candidates

1. 使用已授权账号完成课程作答、云端同步和同账号重登回读。
2. 为新增限时题建立内容与反馈验收，再决定是否扩充题库。
3. 获授权后清理误建的 Vercel 独立项目。

## Final Status

`DONE`：唯一目标、验收标准、定向与全量回归、工程门禁、本地公开入口、提交、推送与生产部署均已完成。认证课程与云端回读是独立的受控账号验收边界，未被本轮证据替代。
