# math-k6 Daily Release Report

## Version

v2026.10.02 · timed-choice result clarity

## Today's Release Goal

让限时单选在答题回顾中按真实学习语义显示为“选择题”，与它不作为迁移证据门槛的规则一致。

## Why

学生需要能看懂每一题在学习评估中承担的角色。若限时单选已不再决定迁移证据，却在结果页仍被标为“迁移验证”，会造成“本题是否要求独立产出答案”的错误理解。

## Evidence

- `q-timed-challenge-1` 是四项限时单选；2026-10-01 已确认其不应构成迁移门槛。
- `GameRunner` 的过关逻辑排除了 `timed-challenge`，但答题回顾仍只把 `choice` 和 `true-false` 显示为“选择题”。
- 自主学习基线要求非选择式作答承载迁移证据，反馈标签应与该规则保持一致。

## Product Spec

### Problem

同一题型在过关计算与结果回顾中被赋予相互矛盾的学习标签。

### Target User

完成含限时单选的数学课程并查看答题回顾的学生。

### User Story

作为学生，我希望回顾页面准确告诉我限时单选是选择题，而不是误导我它是迁移验证。

### Solution and Scope

复用一个共享题型判断：只有填空、匹配、拼装和排序等非选择式题显示为“迁移验证”；限时单选、普通选择和判断都显示为“选择题”。

### Non-goals

不改题库、计时、评分、重试、技能证据、进度、接口、认证、数据库或迁移。

### Edge Cases

- 限时单选答对或答错，结果回顾均显示“选择题”。
- 填空题仍显示“迁移验证”。
- 共享判断同时继续服务初次挑战和 D1/D7 复习的过关规则，避免两处语义再次漂移。

### Acceptance Criteria

1. 限时单选在答题回顾中显示“选择题”，不显示“迁移验证”。
2. 非选择式填空题仍显示“迁移验证”。
3. 限时单选不重新成为迁移证据门槛。
4. 定向与全量测试、lint、类型检查、构建、差异检查和公开本地入口通过。

## Technical Design

- 影响模块：`GameRunner` 及其既有单元/组件回归测试。
- 方案：提取 `isTransferQuestion`，由迁移证据筛选和回顾标签共用；不新增依赖、状态、API 或持久化数据。
- 安全与兼容：只改变已完成题目的展示分类；评分、计时、认证和数据写入保持不变。
- Rollback：重新部署上一已就绪生产部署 `dpl_ArLYB1DRyXwxkTck3ZFmc4v5oPXa`（<https://math-k6-rbr67zxv3-logsail.vercel.app>）。

## Product Changes

答题回顾现在准确区分选择题和真正的迁移验证题，学生看到的反馈与实际过关规则一致。

## Implementation

- `GameRunner` 新增共享的 `isTransferQuestion` 判断。
- `hasTransferEvidence` 和答题回顾标签共用该判断，排除 `timed-challenge`。
- 新增纯逻辑回归及限时题作答后进入结果回顾的组件级回归。

## QA

- 定向：`npm run test -- src/test/gameRunner.test.ts src/test/timedChallengeKeyboard.test.tsx`，21/21 通过。
- 全量：23 个测试文件、579 项测试通过；提交钩子的重复全量运行曾出现一次既有 `knowledgePointPageGoal` 异步事件断言失败，单文件重跑 8/8 通过，最终全量复跑 579/579 通过。
- `npm run lint` 退出码 0，仅有既有 Fast Refresh/hooks 警告；`npm run typecheck`、`npm run build`、`git diff --check` 均通过。
- 组件级核心流程：限时题键盘作答 → 查看结果 → 显示“选择题”、不显示“迁移验证”已自动验证。
- 本地浏览器：未登录根路径重定向到完整 `/login` 表单；无受控认证会话，未宣称已登录课程或云端进度验收。

## Bugs Fixed

- 修复限时单选的结果标签与迁移证据规则不一致的问题。

## Release Status

- Git：`343a463`（`fix: clarify timed choice results`）已推送至 `origin/main`。
- Production：`vercel deploy . --prod --yes --scope logsail`，部署 `dpl_DGA76VsdsgxPcCCB1AznHQ1m51Pe` 为 `Ready`。
- URL：<https://math.logsail.lat>；部署 URL：<https://math-k6-bvtl7xncz-logsail.vercel.app>。

## Product Impact

math-k6 不仅用正确规则判断掌握，也把规则如实呈现给学生；减少“明明是选择题却被说成迁移验证”的困惑，使学习反馈更可信。

## Known Issues

- 认证态“课程作答 → 云端同步 → 同账号重登回读”仍需用户控制的受控账号。
- 限时题当前仅一题；扩题前仍需独立评审时间压力、反馈和课程价值。
- 2026-09-27 误建且未别名的 Vercel 项目未获授权清理。

## Backlog

- 完成：限时单选的回顾标签与掌握证据语义对齐。
- 保留：授权账号下课程到云端进度回读；新增限时题前的内容与规则评审。

## Next Candidates

1. 使用已授权账号完成课程作答、云端同步和同账号重登回读。
2. 为新增限时题建立内容与反馈验收，再决定是否扩充题库。
3. 获授权后清理误建的 Vercel 独立项目。

## Final Status

`DONE`：唯一目标、验收标准、定向与全量回归、工程门禁、本地公开入口、提交、推送与生产部署均已完成。认证态云端回读仍作为独立已知边界，不被本轮本地或部署证据替代。
