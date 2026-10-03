# math-k6 Daily Release Report

## Version

v2026.10.03 · transfer-evidence result clarity

## Today's Release Goal

让迁移验证题在重试后才答对时，结果页明确说明为何本次仍未达到首次迁移证据门槛。

## Why

学生可能得到满分并看到绿色正确标记，却因迁移题不是首次独立答对而未通过；原结果页没有给出这个决定性原因。

## Evidence

- `GameRunner` 以 `correct && firstTry` 判定迁移证据，重试答对仍计分但不通过该门槛。
- 回顾此前只显示“迁移验证”和绿色正确，失败文案还将所有迁移题笼统称为“填空题”。
- 2026-09-27 至 10-02 的题型审计已确立：评分、首次迁移证据与展示语义必须保持一致。

## Product Spec

### Problem

重试后答对的迁移题缺少可见状态，学生不知道为什么“答对”却不能过关。

### Target User

完成数学课程后查看答题回顾的学生，尤其是首次答错、第二次修正迁移题的学生。

### User Story

作为学生，我希望结果页说明本题是否是首次独立答对，以便知道下一次该如何通过。

### Solution and Scope

- 为重试后答对的迁移题添加醒目的“本次不计迁移验证”标签。
- 将失败说明统一为“迁移验证题首次独立答对”，不再错误限定为填空题。

### Non-goals

不改题库、评分、重试次数、掌握规则、进度、接口、认证、数据库或迁移。

### Edge Cases and Acceptance Criteria

1. 首次答错、第二次答对的填空迁移题仍得分，但显示“重试后答对 · 本次不计迁移验证”。
2. 此时结果页说明迁移验证需要首次独立答对，并提供“回看讲解”和“再试一次”。
3. 首次答对、错误最终提交、选择题与既有迁移证据规则均不回归。

## Technical Design

- 复用 `AnswerRecord.firstTry` 与 `isTransferQuestion`；只在 `GameRunner` 的既有结果回顾和失败文案中呈现。
- 为新标签复用现有题型标签样式并添加琥珀色状态；无新增依赖、状态、API 或持久化数据。
- 回滚：回退提交 `b37838b`，或重新部署上一生产部署 `dpl_DGA76VsdsgxPcCCB1AznHQ1m51Pe`（<https://math-k6-bvtl7xncz-logsail.vercel.app>）。

## Product Changes

学生现在能区分“答对得分”和“首次独立迁移证据”：重试答对不会再以纯绿色正确状态掩盖未过关原因。

## Implementation

- `GameRunner` 在结果回顾中标记重试后才答对的迁移题。
- 失败提示按所有迁移题和首次作答规则表达。
- 新增 `transferEvidenceFeedback` 组件级回归。

## QA

- 定向：`npm run test -- src/test/transferEvidenceFeedback.test.tsx`，1/1 通过；相关 `GameRunner`/重试回归 30/30 通过。
- 全量：24 个测试文件、580 项测试通过。
- `npm run lint` 退出码 0，仅有既有 Fast Refresh/hooks 警告；`npm run typecheck`、`npm run build`、`git diff --check` 通过。
- 组件核心流程：首次填错 → 重试答对 → 查看结果，已断言显示首次迁移门槛原因与琥珀色标签。
- 本地浏览器：未登录根路径重定向到完整 `/login` 表单，页面有内容、无 Vite 错误覆盖层。隔离工作树没有 Supabase 公共环境变量，未声称已登录课程或云端进度验收。

## Bugs Fixed

- 修复迁移题重试答对后，结果页没有解释其不计首次迁移证据的问题。
- 修复失败提示只提“填空题”、遗漏拖拽和排序迁移题的问题。

## Release Status

- Git：`b37838b`（`fix: explain retried transfer answers`）已推送至 `origin/main`。
- Production：`vercel deploy . --prod --yes --scope logsail`，部署 `dpl_APo1P6tkgtuTrM82Wb7FYLzGa83h` 为 `READY`。
- URL：<https://math.logsail.lat>；部署 URL：<https://math-k6-ugfo5ijne-logsail.vercel.app>。

## Product Impact

学生不再把“分数正确”误解为“学习证据成立”。反馈直接给出下一步：回看讲解后再以首次独立作答完成迁移验证，提升掌握规则的可信度。

## Known Issues

- 认证态“课程作答 → 云端同步 → 同账号重登回读”仍需用户控制的受控账号。
- 限时题当前只有一题；扩题前仍需独立评审时间压力、反馈和课程价值。
- 2026-09-27 误建且未别名的 Vercel 项目未获授权清理。

## Backlog

- 完成：重试迁移题的结果解释链。
- 保留：授权账号下课程到云端进度回读；新增限时题前的内容与规则评审。

## Next Candidates

1. 使用已授权账号完成课程作答、云端同步和同账号重登回读。
2. 为新增限时题建立内容与反馈验收，再决定是否扩充题库。
3. 获授权后清理误建的 Vercel 独立项目。

## Final Status

`DONE`：唯一目标、验收标准、定向与全量回归、工程门禁、本地公开入口、提交、推送与生产部署均已完成。认证态云端回读仍是独立已知边界，未被本轮本地或部署证据替代。
