# math-k6 Daily Release Report

## Version

v2026.10.01 · timed-choice mastery fairness

## Today's Release Goal

让限时单选题只影响本题分数，不会错误变成学生必须首答正确的迁移验证门槛。

## Why

迁移验证应证明学生能独立产出答案，而不是在单选题中识别正确选项。把限时单选误作迁移门槛，会让已完成填空迁移题、且总分达标的学生被不公平地挡在课程通过状态外。

## Evidence

- `g3-mult-1digit` 的 `q-timed-challenge-1` 是四项单选，`q6` 才是填空迁移题。
- `hasTransferEvidence` 只排除了 `choice` 和 `true-false`，因此把 `timed-challenge` 错列为必需的首答迁移证据。
- 自主学习基线规定非选择式迁移题必须独立完成；它不要求单选题承担迁移证据。

## Product Spec

### Problem

限时单选答错会使学生即使完成了真正的非选择式迁移题、也无法满足过关证据条件。

### Target User

正在完成三年级多位数乘一位数课程、已能独立填写迁移答案的学生。

### User Story

作为学生，我希望限时单选按分数规则结算，而真正的填空迁移题才决定我是否展示出独立应用能力。

### Solution and Scope

在统一的 `hasTransferEvidence` 规则中排除 `timed-challenge`；保留其计分、15 秒计时、键盘作答、答错反馈和技能记录行为。

### Non-goals

不改题库、通过分数线、计时规则、重试规则、进度数据、接口、认证或数据库。

### Edge Cases

- 限时单选答错且填空迁移题首答正确：迁移证据成立，分数仍按限时题错误计算。
- 填空迁移题答错或经重试才正确：迁移证据仍不成立。
- 普通选择题与判断题继续不作为迁移门槛；排序、拼装、匹配等非选择式题仍必须首答正确。

### Acceptance Criteria

1. 已首答正确的填空迁移题不会因一题答错的限时单选而失去迁移证据。
2. 填空迁移题错误或非首答正确时仍拒绝迁移证据。
3. 全量测试、类型检查、构建、lint、差异检查和本地公开入口均通过。

## Technical Design

- 影响：`GameRunner` 的共享迁移证据筛选和既有纯逻辑回归测试。
- 方案：在已有题型筛选上增加一项排除；两个调用路径（初次挑战与复习）继续复用同一规则。
- 数据与安全：无 API、数据库、迁移、外部服务或依赖变更。
- Rollback：回退本次功能提交；生产别名可切回本次部署前的已就绪部署。

## Product Changes

学生的“是否独立迁移”只由真正需要产出答案的题型决定；限时选择仍考查速度和正确率，但不会承担不相符的掌握证明责任。

## Implementation

- `hasTransferEvidence` 排除 `timed-challenge`。
- 在 `gameRunner.test.ts` 覆盖“限时单选错、填空迁移首答对”仍具有迁移证据的回归。

## QA

- 定向回归：`npm run test -- src/test/gameRunner.test.ts`，17/17 通过。
- 全量：23 个测试文件、577 项测试通过。
- `npm run lint` 退出码 0；仅保留既有 Fast Refresh/hooks 警告，未新增警告。
- `npm run typecheck`、`npm run build`、`git diff --check` 均通过。
- 本地浏览器：未登录根路径定向到完整 `/login` 表单，无错误覆盖层。没有受控认证会话，因此未将此证据表述为已登录课程或生产验收。

## Bugs Fixed

- 修复 `timed-challenge` 被错误归入“非选择迁移题”的掌握门槛分类。

## Release Status

待提交、推送和正式部署。本报告将在这些动作完成后补入实际提交、部署和回滚信息。

## Product Impact

math-k6 现在把“速度型单选表现”和“独立迁移能力”正确分开：学生不会因一道限时选择失误而被错误否定已经完成的迁移证明，学习状态更可信也更容易理解。

## Known Issues

- 认证态“课程作答 → 云端同步 → 同账号重登回读”仍需用户控制的授权账号。
- 限时题当前仅有一题；扩充前仍需单独评审时间压力与学习反馈是否匹配。
- 2026-09-27 误建且未别名的 Vercel 项目未获授权清理。

## Backlog

- 完成：限时单选不再伪装为迁移证据。
- 保留：授权账号下的课程到云端进度回读；新增限时题前的内容与规则评审。

## Next Candidates

1. 使用已授权账号完成课程作答、云端同步和同账号重登回读。
2. 为新增限时题建立内容与反馈验收，再决定是否扩充题库。
3. 获授权后清理误建的 Vercel 独立项目。

## Final Status

`PARTIAL`：实现和本地门禁完成，尚未执行本轮提交和生产部署。
