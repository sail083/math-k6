# math-k6 Daily Release Report

## Version

v2026.09.28 · ordering retry feedback

## Today's Release Goal

让排列题和时间线题在第一次排错后保留可编辑状态，学生可根据解析调整顺序后再次确认；修正后的正确答案计分，但不伪装为首次无提示掌握证据。

## Why

排序是过程性练习。此前学生第一次排错后立即被锁定并只能进入下一题，若想修正只能重开整组；这打断“反馈 → 调整 → 验证”的自主学习闭环，也让可修正答案无法表达 `firstTry=false`。

## Evidence

- 上一轮日报将排序题的首次错误反馈与证据时序审校列为下一候选。
- `DragAssembleGame` 与 `TimelineGame` 在第一次错误时都立即调用 `onAnswer(..., false)` 并锁定调整按钮。
- `GameRunner` 已支持三参 `onAnswer`，并将最终正确性与 `firstTry` 分别用于分数和迁移证据；选择、填空与配对题已有同类两次作答模式。

## Product Spec

### Problem

排列题首次错序后无法在当前题修正，学生必须离开题目；记录也不能区分“修正后正确”和“首次正确”。

### Target User

正在通过步骤排序或时间线理解数学方法的小学学生。

### User Story

作为学生，第一次排序错误后，我希望看见提示和解析、继续调整当前顺序并再次确认，而不是被迫重新开始整组。

### Solution and Scope

复用现有两次作答边界：首次错误不提交证据，显示琥珀色可行动反馈与解析且保持调整按钮可用；第二次提交才结算。修正后正确提交 `correct=true, firstTry=false`，第二次仍错提交 `correct=false, firstTry=false`。本轮仅覆盖 `drag-assemble` 与 `timeline`。

### Non-goals

不增加题型、作答次数、题目内容、进度 schema、服务端接口或 AI 判分；不改变限时题和判断题的现有规则。

### Edge Cases

- 首次即正确：沿用 `firstTry=true` 的既有通过和迁移证据规则。
- 首次错误后修正：记录分数，但不构成首次迁移证据，课程仍按既有门槛判定。
- 第二次仍错：锁定题目、展示正确顺序和解析，并以 `firstTry=false` 记录最终错误。
- 重开整组：沿用 `GameRunner` 的 `run` key，清空本题局部状态。

### Acceptance Criteria

1. 两种排序题第一次错误后仍可使用上下移动按钮并再次确认。
2. 第一次错误不会写入技能证据；修正后正确写入 `correct=true, firstTry=false`。
3. 第二次错误才显示正确顺序并写入 `correct=false, firstTry=false`。
4. 首次即正确、重试重置与既有课程通过逻辑不回归。

## Technical Design

- 影响模块：`DragAssembleGame`、`TimelineGame` 和一条 `GameRunner` 组件级回归。
- 方案：复用现有三参 `onAnswer` 和本地状态；不新增依赖、共享抽象、接口或迁移。
- 兼容与回滚：变更仅位于两种游戏组件的提交时机；回滚目标为上一正式部署 <https://math-k6-5shf3xizu-logsail.vercel.app>。

## Product Changes

学生第一次排错时会看到“还差一点，再调整后确认一次。”和题目解析，当前排序仍可调整。修正成功获得正确分数，但系统诚实地要求后续独立迁移验证，才会计入首次掌握证据。

## Implementation

- 为两种排序组件补充一次重试状态与三参 `onAnswer`。
- 首次错误改为琥珀色反馈，隐藏正确顺序并保持操作可用。
- 最终错误仍展示正确顺序；修正正确与最终错误均携带 `firstTry=false`。
- 新增 `orderingRetryEvidence` 回归，逐一覆盖排列题和时间线题的修正成功及第二次失败路径。

## QA

- 定向回归：`npm run test -- src/test/orderingRetryEvidence.test.tsx`，1 文件 4 项通过。
- 全量单测：21 文件、573 项通过。
- `npm run typecheck`、`npm run build`、`git diff --check`：均通过。
- `npm run lint`：退出码 0；仅保留仓库既有 Fast Refresh/hooks 警告。
- 本地浏览器：未登录根路由跳转 `/login`，登录表单可渲染，未见错误覆盖层。
- 生产浏览器：<https://math.logsail.lat/> 同样跳转 `/login`，登录表单完整，未发现 `undefined` 资源或错误覆盖层。无授权测试账号，故未将公开入口验证表述为真实课程或云端进度验收。

## Bugs Fixed

- 修复两种排序题首次错误即锁定、只能重开整组才能修正的问题。
- 修复排序题修正后无法如实写入非首次正确证据的问题。

## Release Status

- Git：`1a3826b`（`fix: preserve ordering retry evidence`）已创建；本报告提交后将一并推送 `origin/main`。
- 正式部署：`vercel deploy . --prod --yes --scope logsail`；`dpl_6b7UpJBzwX5iSvYbrtNvHdeg5dsm` 为 `READY`，别名 <https://math.logsail.lat>。
- 部署 URL：<https://math-k6-a5p2yc0to-logsail.vercel.app>。
- 回滚目标：<https://math-k6-5shf3xizu-logsail.vercel.app>（2026-09-27 正式部署）。

## Product Impact

排序题从一次性判错变为可完成的学习闭环：学生得到及时解释、可立即验证修改，系统又不把受提示修正误报成独立掌握。这提升了自主学习的恢复能力和进度数据的可信度。

## Known Issues

- 尚无授权测试账号，未执行“登录 → 课程作答 → 云端同步 → 重登回读”验收。
- 限时题与判断题的首次错误反馈和证据时序仍待逐项审校。
- Vercel 仍有 2026-09-27 误建且未别名的独立项目；删除需单独授权。

## Backlog

- 完成：排列题和时间线题的首次错误可修正闭环与证据时序。
- 保留：授权账号下的真实课程进度回读；限时和判断题审校；误建 Vercel 项目的授权清理。

## Next Candidates

1. 使用授权测试账号完成课程作答、云端进度同步和重登回读。
2. 审校限时题和判断题的错误反馈、超时与首次证据边界。
3. 获授权后清理误建的 Vercel 独立项目。

## Final Status

`DONE`。本轮唯一版本目标、回归、工程门禁、公开入口回读与正式部署均已完成；认证态云端进度链路是独立已知问题，未冒充为本轮验收。
