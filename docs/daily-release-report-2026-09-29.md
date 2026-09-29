# math-k6 Daily Release Report

## Version

v2026.09.29 · judgment retry feedback

## Today's Release Goal

让判断题第一次误判后先获得不泄露答案的反馈并可修正；修正答案应计分，但不得冒充首次独立完成。

## Why

判断题是课程中已实际使用的轻量检索练习。此前一次误判会立即作为最终错误提交，学生不能在当前题完成“提示 → 修正 → 验证”的闭环；这与选择、填空、配对和排序题已建立的反馈边界不一致。

## Evidence

- 2026-09-28 日报把判断题与限时题的反馈/证据时序审校列为最高后续候选。
- `TrueFalseGame` 首次点击就调用 `onAnswer(option, correct)` 并锁定两项；`GameRunner` 因而立即写入分数和技能证据。
- `ChoiceGame`、`FillBlankGame`、`DragMatchGame`、`DragAssembleGame` 和 `TimelineGame` 已验证“首错不提交、修正为 `firstTry=false`”模式。
- 代码检索未发现任何 `timed-challenge` 题目内容；为避免凭空改变限时挑战语义，本轮不修改该未投产题型。

## Product Spec

### Problem

判断题的第一次误判被最终结算，学生无法修正，且数据不能区分首次正确与提示后修正。

### Target User

正在完成小学数学课程中对/错判断练习的学生。

### User Story

作为学生，第一次判断错误后，我希望得到简短提示、改选另一项并完成本题，而不是立刻被判定失败。

### Solution and Scope

首次误判仅显示琥珀色“再想想”提示，隐藏解析且不调用 `onAnswer`；改选正确后以 `correct=true, firstTry=false` 最终结算。首次即正确仍为 `firstTry=true`。本轮仅修改 `true-false` 题型及其回归。

### Non-goals

不改变题目内容、通过门槛、限时挑战、进度 schema、服务端接口、AI 判分或认证流程。

### Edge Cases

- 首次正确：正常计分并保持 `firstTry=true`。
- 首次错误：错误选项禁用、另一判断可用，不显示答案或解析，也不写入证据。
- 修正正确：正常计分，写入 `firstTry=false`；判断题仍不作为迁移题门槛。
- 重开整组：沿用 `GameRunner` 的 `run` key，判断题局部状态重新挂载。

### Acceptance Criteria

1. 判断题首次误判后显示提示，学生可以选择另一项。
2. 首次误判不会调用技能证据记录；修正正确写入 `correct=true, firstTry=false`。
3. 首次正确仍写入 `firstTry=true`，既有组重开正常重置。
4. 现有全量单测、类型检查、lint、构建和公开入口不回归。

## Technical Design

- 影响模块：`TrueFalseGame`、`gameRunnerRestart`、新增一条 `trueFalseRetryEvidence` 组件级回归。
- 复用现有：Choice/Fill 已有的“首错不提交、最终正确携带 firstTry”协议与 GameRunner 的统一结算。
- 未新增：依赖、抽象、接口、迁移或存储。
- 回滚：恢复本次代码提交；正式部署完成后在本节补充上一部署作为回滚目标。

## Product Changes

学生第一次判断错误会得到可行动提示，仍能改选完成本题；系统会承认修正后的得分，但要求后续独立题目来证明首次掌握。

## Implementation

- 判断题采用现有两阶段作答边界，错误选项被禁用、另一选项保持可用。
- 首错提示不展示答案或解析；最终正确后再展示解析。
- 更新整组重开回归，覆盖判断题经修正后、组失败再重开的状态重置。
- 新增修正后证据回归。

## QA

- 定向：`npm run test -- src/test/trueFalseRetryEvidence.test.tsx src/test/gameRunnerRestart.test.tsx`，2/2 通过。
- 全量：22 个测试文件、574 项测试通过。
- `npm run typecheck`、`npm run build`、`git diff --check` 均通过。
- `npm run lint` 退出码 0；仅有仓库既有 Fast Refresh/hooks 警告。
- Playwright 本地浏览器：未登录根路径跳转 `/login`，登录表单可用，0 console error；未以此冒充认证态课程验收。

## Bugs Fixed

- 修复判断题首错即最终结算、不能在当前题修正的问题。
- 修复判断题提示后修正会丢失非首次作答语义的问题。

## Release Status

- Git：`be3697f`（`fix: preserve judgment retry evidence`）已推送至 `origin/main`。
- 正式部署：`vercel deploy . --prod --yes --scope logsail`；`dpl_5EWkp1EVaYAX2tJvDc5YSFq4G5fR` 为 `READY`，别名 <https://math.logsail.lat>。
- 部署 URL：<https://math-k6-e8my4dqvw-logsail.vercel.app>。
- 回滚目标：<https://math-k6-a5p2yc0to-logsail.vercel.app>（2026-09-28 正式部署）。

## Product Impact

判断题现在与其他核心练习题型遵循相同的学习恢复和证据诚实性：学生能完成一次有效修正，而学习档案不会把提示后的答案误认为独立掌握。

## Known Issues

- 认证态“课程作答 → 云端同步 → 重登回读”仍待用户提供授权会话。
- `timed-challenge` 目前无题库引用；需要真实课程采用后，再单独定义其限时失败与证据规则。
- 2026-09-27 误建且未别名的 Vercel 项目仍需单独授权清理。

## Backlog

- 完成：判断题的首错反馈、修正结算及证据边界。
- 保留：授权账号下的真实进度回读、限时题型投产前的规则定义、误建 Vercel 项目的授权清理。

## Next Candidates

1. 使用授权账号完成课程作答、云端同步和重登回读。
2. 在真实限时题型进入题库前，定义超时、错误与首次证据规则并补齐内容验收。
3. 获授权后清理误建的 Vercel 独立项目。

## Final Status

`DONE`：本轮唯一版本目标、定向/全量回归、工程门禁、本地公开入口检查、提交、推送和正式部署均已完成。认证态云端进度链路是独立已知问题，未冒充为本轮验收。
