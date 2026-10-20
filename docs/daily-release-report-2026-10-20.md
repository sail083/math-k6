# math-k6 Daily Release Report

## Version

v2026.10.20 · Retry focus continuity

## Today's Release Goal

让选择题和判断题的学生在第一次答错后，焦点自动落到仍可作答的答案，连续完成“收到提示 → 修正作答”的学习闭环。

## Why

首次错误不是结束，而是自主学习最关键的修正时刻。若鼠标或辅助技术用户选中的错误答案随即变为禁用，而焦点仍留在该按钮上，下一步操作不清晰；虽可依赖全局快捷键继续，但这不是可发现、可预期的键盘流程。

## Evidence

- 2026-10-16 的首错反馈已提供 `role="status"`，2026-10-15/14 已把初始焦点放到选择/判断的第一个答案，但两项改动都没有处理“当前焦点元素被禁用”的后续状态。
- `ChoiceGame` 与 `TrueFalseGame` 在首次错误时都会禁用错误按钮；真实的聚焦状态回归先在修复前失败：焦点仍是禁用的错误答案。
- 两个组件也复用于课程、语文/英语学习和错题修复入口，因此局部修复覆盖既有练习路径，不需要改进度或内容模型。

## Product Spec

### Problem

首错后页面给出提示，但用户可能停在不可再操作的错误选项，无法自然发现正确的下一步。

### Target User

使用键盘、屏幕阅读器或鼠标完成小学练习，并在首次错误后需要修正答案的学生。

### User Story

作为学生，我第一次选错后，希望系统告诉我可以重试，并把我带到仍可选择的答案，以便不离开当前练习就继续思考。

### Solution and Scope

- 选择题和判断题在恰好一次错误、尚未结算时，将焦点移到第一个未禁用选项。
- 保留现有首错提示、两次作答上限、键盘快捷键、计分和首次证据规则。

### Non-goals

不改变题目、答案、提示文本、题目数量、判分、掌握证据、进度、认证、API、数据库、迁移或全局快捷键设计；不把焦点移动扩展到其他没有禁用当前答案的题型。

### Edge Cases and Acceptance Criteria

1. 鼠标或辅助技术聚焦错误选择题答案后，第一次答错会显示“再想想”，并把焦点移到未禁用答案；不提交最终作答。
2. 判断题具有相同行为。
3. 键盘 `1/A/2/B` 修正作答、首答证据和已存在的快捷键修饰符防护不回归。
4. 全量测试、lint、类型检查、生产构建、diff 检查与本地生产预览通过。

## Technical Design

- 影响模块：`ChoiceGame`、`TrueFalseGame` 与既有首错反馈组件测试。
- 前端：每个组件仅保存自身答案按钮 ref；首错渲染完成后查找第一个未禁用按钮并调用 `focus()`。
- Backend / API / database / migration / AI：无变更。
- Compatibility / performance：只在单次首错状态执行一次小规模 DOM 焦点操作，无网络请求、存储写入或新增依赖。
- Rollback：回退本轮代码提交；正式别名恢复前一已就绪部署前必须核验内容。

## Product Changes

学生第一次选错后，视觉提示保持不泄露答案；键盘焦点会直接停在仍可尝试的答案上，减少卡在“不可用”控件上的中断。

## Implementation

- `src/components/games/ChoiceGame.tsx`：为答案按钮建立局部 ref，并在首错后交接焦点。
- `src/components/games/TrueFalseGame.tsx`：采用相同局部模式。
- `src/test/gameFeedback.test.tsx`：先聚焦将要禁用的错误按钮，锁定两种题型的首错提示、焦点交接与不提交证据行为。

## QA

- 红灯复现：新增两条聚焦断言在修复前均失败，焦点仍停留在禁用错误答案。
- 定向：`npm run test -- src/test/gameFeedback.test.tsx src/test/trueFalseKeyboard.test.tsx src/test/keyboardShortcutModifiers.test.tsx`，3 个文件、19 项通过。
- 全量：`npm run test`，30 个文件、615 项通过。
- `npm run lint`：退出码 0；仅有仓库既有 Fast Refresh / `ChoiceGame` hooks 警告。
- `npm run typecheck`、`npm run build`、`git diff --check`：通过。
- 浏览器：本地生产预览的 `/login` 正常渲染、console 为 0 error 和 1 条缺少本地 Supabase 公共变量 warning；受保护的 `/math/kp/g3-mult-1digit` 正确跳转登录。未提供受控账号，故不把已登录课程或云端同步写为已验收。

## Bugs Fixed

- 修复选择题和判断题首次错误后焦点仍停留在已禁用错误选项的问题。

## Release Status

待完成提交、推送和正式部署后更新；本地工程与公开入口门禁已通过。

## Product Impact

这次迭代补齐了“初始可键盘进入 → 首错有状态提示 → 可继续修正”的最后一段交互。相比只新增更多题目，它让已有练习在错误时更可恢复、也更适合辅助技术用户持续学习。

## Known Issues

- 真实登录后的密码找回、课程作答、云端同步与同账号重登回读仍需要受控账号验收。
- 当前唯一限时题的 15 秒参数仍未取得真实学生校准或教学批准，继续按不限时练习运行。
- lint 仍有既有 Fast Refresh / hooks 警告，本轮未扩大范围处理。

## Backlog

- 完成：选择题与判断题首错后的焦点连续性。
- 保留：受控账号下的登录、课程作答、进度同步与重登回读闭环。
- 保留：以真实学习数据与教学审查为前提，决定限时题的教学时长和完整的速度/掌握分离方案。

## Next Candidates

1. 用受控账号验收密码找回、登录、课程作答、云端同步与重登回读。
2. 在真实分层学习数据和教学审查可用后，决定唯一限时题的时长与速度证据策略。
3. 审核其他首次错误后会禁用控件的学习流程，只有确认存在相同焦点断点时再扩展。

## Final Status

待发布门禁完成后更新。
