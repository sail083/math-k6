# math-k6 Daily Release Report

## Version

v2026.10.18 · Course result focus

## Today's Release Goal

让学生完成最后一题并打开课程结果后，立即把键盘焦点放到结果结论上。

## Why

答题后的“下一题”和“查看结果”已会自动获得焦点，但“查看结果”会卸载该按钮而不把焦点交给结果页。键盘和屏幕阅读器用户会回到页面主体，无法立刻知道是否通过课程。

## Evidence

- `GameRunner` 在作答后为下一步按钮设置了自动焦点，但通过和未通过的结果标题都不可聚焦。
- 新增的结果聚焦回归在修复前失败：焦点落在 `body`，不是“当堂会”标题。
- 现有课程结果会分别呈现通过与未通过结论，因此两条结果路径都必须保留相同焦点语义。

## Product Spec

### Problem

最后一题完成后，结果页没有接管焦点，造成键盘连续操作和读屏反馈断点。

### Target User

用键盘、屏幕阅读器或其他辅助技术完成数学练习的学生。

### User Story

作为完成最后一题的学生，我希望结果结论立刻获得焦点，以便知道我是否通过并选择下一步。

### Solution and Scope

- 在 `GameRunner` 进入通过或未通过结果状态后，聚焦结果标题。
- 标题仅以 `tabIndex={-1}` 参与程序化焦点，不增加额外 Tab 停靠点。
- 回归覆盖“当堂会”和“最后再练一下”两条结果路径。

### Non-goals

不改变得分、星级、掌握线、首次证据、进度写入、路由、认证、题库、API、数据库或限时题质量策略。

### Edge Cases and Acceptance Criteria

1. 最后一题通过后，“当堂会”或对应通过结论获得焦点。
2. 最后一题未通过后，“最后再练一下”或对应未通过结论获得焦点。
3. 结果回顾和操作按钮仍可正常使用，且不改变既有题目切换焦点。
4. 定向回归、全量测试、lint、类型检查、构建和差异检查通过。
5. 未配置本地 Supabase 公共变量时，不把本地登录页视为认证、同步或重登验收。

## Technical Design

- 影响模块：`GameRunner`、既有 `gameRunner-flow` 渲染回归、CHANGELOG 与本报告。
- 实现：用单个标题 ref 和 `gameStatus` effect 在结果页挂载后调用原生 `focus()`；两种结果标题都保持常规 heading 语义。
- 兼容性：不改组件 props、调用方、状态模型或持久化数据。
- 性能与安全：一次状态转换只执行一次本地 DOM focus；无网络、权限或数据访问变更。
- 回滚：回退 `de8987d`，或将正式别名恢复到此前的 `dpl_C5cRFUJ9B12tywrbERnvHDomKFKG`（恢复前核验内容）。

## Product Changes

学生在最后一题点击“查看结果”后，会直接落在课程结论，而不是失去焦点；随后可连续阅读回顾并选择“再试一次”“回看讲解”或下一课。

## Implementation

- `src/components/GameRunner.tsx`：结果标题变为可程序化聚焦，并在进入结果状态时获得焦点。
- `src/test/gameRunner-flow.test.tsx`：锁定通过与未通过路径的结果焦点回归。
- `CHANGELOG.md`：记录用户可见修复与认证验收边界。

## QA

- 缺陷复现：新增定向回归在修复前失败，完成结果后的 active element 是 `body`。
- 定向回归：`npm run test -- src/test/gameRunner-flow.test.tsx`，9 项通过。
- 全量单测：29 个文件、613 项通过。
- `npm run lint`：退出码 0；仅有仓库既有 Fast Refresh/hooks 警告。
- `npm run typecheck`、`npm run build`、`git diff --check`：均通过。
- 浏览器：本地生产预览重定向至完整 `/login` 表单，console 为 0 error、1 条本地缺少 Supabase 公共变量 warning。真实登录、课程作答、云端同步和重登未验收。

## Bugs Fixed

- 修复最终结果页没有接管焦点，导致键盘与屏幕阅读器用户无法连续获知课程结论的问题。

## Release Status

`DONE`。

- 代码提交：`de8987d fix: focus course results`，已推送至 `origin/main` 和 `release/daily-20261018-course-result-focus`。
- 正式部署命令：`vercel deploy . --prod -y --scope logsail --project math-k6`。
- 正式生产部署：`dpl_FthzdG4gTwuBeX58uvPyz6BYDnQP`，状态 `READY`，地址 <https://math-k6-d0jelenh3-logsail.vercel.app>，别名 <https://math.logsail.lat>。
- 回滚候选：`dpl_C5cRFUJ9B12tywrbERnvHDomKFKG`，为上一已就绪正式部署；恢复别名前应核验其内容。

## Product Impact

这次改动补全“作答 → 查看结论 → 选择下一步”的最后一个焦点交接点。math-k6 对键盘和读屏用户的练习闭环更连续，且不需要学习另一套操作方式。

## Known Issues

- 真实登录后的课程作答、云端同步与同账号重登回读仍需要受控账号验收。
- 本地公开入口缺少 Supabase 公共变量，不能验证认证链路。
- 限时题的内容、时限和反馈质量准入已有独立未合并分支；本轮未与其重叠修改。

## Backlog

- 完成：课程结果页焦点交接。
- 保留：受控账号下“密码找回 → 登录 → 课程作答 → 云端同步 → 重登回读”闭环验收。
- 保留：基于独立质量方案决定限时题准入标准后再合并。

## Next Candidates

1. 用受控账号验收密码找回、登录、课程作答、云端同步与重登回读。
2. 审核并缩小限时题质量分支，确认其内容准入与速度/掌握语义。
3. 基于真实学习数据确定下一项辅助技术优先级。

## Final Status

`DONE`：唯一目标、失败复现、通过与未通过回归、全量工程门禁、生产预览检查、提交、推送和正式部署均已完成；认证课程与云端进度仍是独立受控账号边界。
