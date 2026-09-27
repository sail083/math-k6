# math-k6 Daily Release Report

## Version

v2026.09.27 · corrected drag-match evidence

## Today's Release Goal

让学生在配对题中修正错误后获得最终正确答案的分数，同时不把这次作答当作首次无提示掌握证据。

## Why

配对题允许学生从错误尝试中修正。把“最终是否配对完成”和“是否一次完成”混成一个布尔值，会既否认学生完成的正确答案，也无法如实表达其需要过的提示。

## Evidence

- 前一轮已完成全题型重试重置，后续候选是审校错误反馈与证据时序。
- `DragMatchGame` 在所有目标正确放置后，将 `!hadMistake` 同时传给正确性和首次作答语义。
- `GameRunner` 分别使用 `correct` 计算分数，使用 `correct && firstTry` 判断迁移证据；原实现会把“修正后完成”写成 `correct=false, firstTry=true`。

## Product Spec

### Problem

有过一次错误尝试但最终完成配对的学生被记为零分，答题回顾也把已完成的映射标为错误；但若将其记为首次正确，又会虚构掌握证据。

### Target User

通过配对题理解数学对象关系，并根据即时反馈修正操作的小学学生。

### User Story

作为学生，我完成修正后的所有配对时，希望系统认可最终答案正确；同时我知道这不是一次完成，因此仍需要再次独立验证。

### Solution and Scope

配对完成时传递 `correct=true` 与 `firstTry=!hadMistake`；将“过程有错误尝试”的完成反馈改为琥珀色完成态。仅覆盖 `drag-match`，不改变其他题型、题目内容、进度 schema、API 或数据库。

### Non-goals

不改变首次错误的即时红色提示，不新增重试次数、AI 判分、替代题组或远端数据写入。

### Edge Cases

- 无错误完成：保持首次迁移证据与正常过关。
- 有错误后完成：计入正确分数和正确次数，但不计入 `firstTryCorrect`、迁移或保留证据，也不能单独满足课程迁移过关。
- 未完成配对：不触发最终提交，现有交互不变。

### Acceptance Criteria

1. 一次错误匹配后完成全部正确映射，记录为 `correct=true, firstTry=false`。
2. 此路径获得题目分数与正确答题回顾，但课程仍因缺少首次迁移证据而不能通过。
3. 无错误完成仍记录 `correct=true, firstTry=true` 并维持正常过关。

## Technical Design

- 影响模块：`DragMatchGame` 和一条 `GameRunner` 集成回归。
- 复用现有三参 `onAnswer`、`AnswerRecord` 和 `recordSkillEvidence`；无新增依赖、状态字段或迁移。
- 回滚：恢复 `DragMatchGame` 的上一实现，或重新部署上一正式部署 `https://math-k6-7ldix0e4a-logsail.vercel.app`。

## Product Changes

修正后的配对题会明确显示“匹配完成（过程有错误尝试）”，并把最终全对计入得分；学生仍必须在无提示首答完成迁移题，才能获得课程通过和直接技能证据。

## Implementation

- `DragMatchGame` 将最终正确性与首次作答语义分离传入 `GameRunner`。
- 有错误尝试的完成态从红色失败视觉改为琥珀色完成提示。
- 新增 `dragMatchEvidence` 回归，覆盖“修正后完成但不算首次”和“无错误正常通过”两条路径。

## QA

- 定向回归：`npm run test -- src/test/dragMatchEvidence.test.tsx`，2/2 通过。
- 全量单测：20 文件、569 项通过。
- `npm run lint`：退出码 0；仅有既有 Fast Refresh/hooks 警告。
- `npm run typecheck`、`npm run build`、`git diff --check`：均通过。
- 浏览器：本地与正式 `https://math.logsail.lat/login` 均渲染登录表单；未登录根路由跳转 `/login`；未发现错误覆盖层或控制台错误。隔离本地工作树没有 Supabase 环境变量，故本地认证警告不作为生产结论。

## Bugs Fixed

- 修复配对题将“修正后正确”错误记录为“错误但首次作答”的分数和证据语义冲突。

## Release Status

- Git：`49cd6ac`（`fix: preserve corrected drag-match evidence`）已推送 `origin/main`。
- 正式部署：`vercel deploy . --prod --yes --scope logsail`；`dpl_AB5XdCeo7PaFr1fwfWrXmTsRhaY2` 为 `READY`，别名为 <https://math.logsail.lat>。
- 部署 URL：<https://math-k6-5shf3xizu-logsail.vercel.app>。
- 过程记录：隔离工作树初次缺少 Vercel 项目链接，CLI 新建了未别名的 `math-k6-daily-20260927` 项目和部署 `dpl_AMMAhFDHNdHZi4KKRPCJrVJ6MV4m`；它不是正式发布。为避免未经授权的破坏性操作，本轮未删除该项目。

## Product Impact

学生会得到诚实且可行动的结果：完成修正能保留正确分数与正向完成反馈，首次无提示掌握仍须再次证明。这比把修正努力归零或虚报掌握都更可靠。

## Known Issues

- 尚无授权测试账号，未执行真实“登录 → 课程作答 → 远端同步 → 重登回读”验收。
- 仓库保留既有 Fast Refresh/hooks lint 警告，本轮未扩大范围处理。
- Vercel 留有一个未别名的误建独立项目，删除需明确授权。

## Backlog

- 完成：配对题的最终正确性与首次证据时序对齐。
- 保留：其余题型的首次错误反馈与证据时序审校。
- 阻塞：取得授权测试账号后完成远端进度全链路回读。

## Next Candidates

1. 使用授权测试账号完成课程作答、云端进度同步与重登回读。
2. 审校限时、排序与判断题的首次错误反馈是否能指导下一步。
3. 经授权后清理误建的 Vercel 独立项目。

## Final Status

`DONE`。本轮目标、回归、工程门禁、正式部署和公开入口回读均完成；未验证的认证全链路已明确列为独立已知问题，未冒充完成。
