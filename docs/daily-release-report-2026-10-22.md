# math-k6 Daily Release Report

## Version

v2026.10.22 · Ordering retry focus

## Today's Release Goal

让学生在排列题或时间线题第一次排序错误后，无需从“确认”按钮自行找回调整控件，就能立即继续修改顺序。

## Why

自主学习的错误恢复不应把学生留在刚刚失败的提交动作上。两个排序题型都会提示“还差一点，再调整后确认一次”，但鼠标点击“确认”后，键盘焦点实际仍留在该按钮；学生需要反向 Tab 才能开始调整，打断了“提示 → 修正”的连续动作。

## Evidence

- `DragAssembleGame` 与 `TimelineGame` 都在第一次错误时只更新反馈状态，未管理焦点。
- 新回归先固定题目初始乱序状态，再从获得焦点的“确认”按钮提交；修复前两个题型的焦点断言均失败，实际焦点为“确认”。
- 两个组件由 `GameRunner` 分别调度，现有排序重试、结果播报与跨题焦点测试覆盖了它们的调用路径。

## Product Spec

### Problem

首次排序错误后，提示引导学生继续调整，但焦点没有回到任何可用排序按钮。

### Target User

使用键盘、屏幕阅读器或鼠标完成步骤排序、时间线排序练习，并在第一次错误后尝试修正的学生。

### User Story

作为学生，我第一次排错后，希望系统把焦点带到可用的调整按钮，让我可以马上继续修改，而不必重新定位操作入口。

### Solution and Scope

- 在两种排序题型的第一次错误反馈出现后，聚焦第一个可用“下移”按钮。
- 保持现有两次作答上限、首次作答证据、判分、题目顺序与反馈文案不变。

### Non-goals

不改变排序算法、正确答案、题目、得分、进度、认证、API、数据库、迁移或其他题型；不在第二次错误或最终结算后改写结果焦点。

### Edge Cases and Acceptance Criteria

1. 从获得焦点的“确认”按钮提交第一次错误排序后，显示原有“还差一点”提示，焦点落到第一个可用“下移”按钮。
2. 第一次错误不调用最终 `onAnswer`，不改变首答证据。
3. 排列题、时间线题、已有排序重试、结果播报和跨题进入焦点均不回归。
4. 定向与全量测试、lint、类型检查、生产构建、diff 检查和本地公开入口浏览器检查通过。

## Technical Design

- 影响模块：`DragAssembleGame`、`TimelineGame`、既有 `gameFeedback` 回归。
- 前端：每个组件保存已有“下移”按钮的局部 ref；仅在首次错误反馈状态变化后聚焦第一个未禁用按钮。
- Backend / API / database / migration / AI：无变更。
- Compatibility / performance：无新增依赖、网络请求或持久化写入；焦点只在首次错误反馈时移动。
- Rollback：回退代码提交 `98056ce`；正式别名恢复前一已就绪部署前先核验其内容。

## Product Changes

排序第一次错误后，学生在不泄露正确答案的前提下，焦点会直接准备在一个调整控件上；键盘和鼠标流程均可连续完成“反馈 → 调整 → 再确认”。

## Implementation

- `src/components/games/DragAssembleGame.tsx`：首次错误反馈时聚焦首个可用下移按钮。
- `src/components/games/TimelineGame.tsx`：同样恢复可操作的排序焦点。
- `src/test/gameFeedback.test.tsx`：锁定两个题型从“确认”提交首次错误后的焦点与未提交语义。
- `CHANGELOG.md`：新增 v2026.10.22 用户可见改动与已知验收边界。

## QA

- 红灯复现：`npm run test -- src/test/gameFeedback.test.tsx` 在修复前失败 2 项；两个题型焦点均在“确认”按钮。
- 定向：`npm run test -- src/test/gameFeedback.test.tsx src/test/gameRunnerRestart.test.tsx src/test/orderingRetryEvidence.test.tsx src/test/gameResultAnnouncements.test.tsx`，4 个文件、21 项通过。
- 全量：`npm test`，30 个文件、617 项通过；提交钩子再次通过相同的全量测试与类型检查。
- `npm run lint`：退出码 0；仅有既有 Fast Refresh / `ChoiceGame` hooks 警告。
- `npm run typecheck`、`npm run build`、`git diff --check`：通过。
- 浏览器：本地生产预览 `/login` 正常渲染，console 0 errors；未登录访问 `/math/kp/g3-mult-1digit` 正确跳转 `/login`。本地缺少 Supabase 公共变量且没有受控账号，因此不将已登录课程、同步或重登回读写为已验收。

## Bugs Fixed

- 修复排列题和时间线题首次错误后焦点停在“确认”按钮，无法直接键盘调整的问题。

## Release Status

`DONE`。

- 代码提交：`98056ce fix: focus ordering retry controls`，已推送至 `main` 与 `release/daily-20261022-feedback-focus`。
- 正式部署命令：`vercel deploy . --prod -y --scope logsail --project math-k6`。
- 正式部署：`dpl_DijYvXktVtjTaUmg2Do8CdGDYNqR`，状态 `READY`，地址 <https://math-k6-gzuul4x8y-logsail.vercel.app>，已别名至 <https://math.logsail.lat>。
- 部署证据：Vercel CLI 生产构建通过并返回 `readyState: READY`；未用 HTTP 请求把部署状态冒充成已登录课程验收。
- 回滚候选：上一日已就绪生产部署 `dpl_DJdk9mmYRpfqKPtmo614N9Ar2tEk`（<https://math-k6-7xd7vbmmc-logsail.vercel.app>）；恢复别名前须核验其内容。

## Product Impact

本版本补齐了排序练习的错误恢复闭环，使现有的提示、两次作答和证据规则真正能被连续操作。相比只在“确认”处停留，学生能更快回到思考和调整本身，降低了自主学习中的无意义操作成本。

## Known Issues

- 真实登录后的密码找回、课程作答、云端同步与同账号重登回读仍需要受控账号验收。
- 当前唯一限时题的时长仍缺少真实学习数据和教学批准，继续按不限时练习运行。
- lint 的既有 Fast Refresh / hooks 警告不在本轮范围。

## Backlog

- 完成：两种排序题首次错误后的排序焦点连续性。
- 保留：受控账号下的登录、课程作答、进度同步与重登回读闭环。
- 保留：基于真实学习数据和教学审查决定限时题时长与速度证据策略。

## Next Candidates

1. 用受控账号验收密码找回、登录、课程作答、云端同步与重登回读。
2. 在真实分层学习数据和教学审查可用后，决定唯一限时题的教学时长与速度证据策略。
3. 只在可重复证据存在时，再审核其余错误恢复或键盘流程。

## Final Status

`DONE`：唯一版本目标、红灯复现、定向与全量回归、工程门禁、本地公开入口浏览器检查、提交、推送与正式部署均已完成。认证课程与云端进度仍保留为受控账号验收边界。
