# math-k6 Daily Release Report

## Version

v2026.09.30 · timed challenge keyboard answers

## Today's Release Goal

让已上线的限时选择题可用数字或字母键快速作答，减少倒计时中的指针操作成本。

## Why

三年级“多位数乘一位数”课程已实际使用 15 秒限时题；常规选择题已有键盘入口，限时题却只能点击，造成相同行为在时间压力下不一致。

## Evidence

- `g3-mult-1digit/game.json` 包含 15 秒的 `timed-challenge` 题 `23 × 4`。
- `ChoiceGame` 支持 `1–4` / `A–D`，`TimedChallengeGame` 此前没有 `keydown` 路径。
- 上一日报将限时题列为后续候选；当前题库已证明其不是预备组件。

## Product Spec

### Problem

限时题不能用键盘提交，与其他选择题不一致，学生需在倒计时内移动指针点击答案。

### Target User

正在完成三年级乘法限时挑战、习惯键盘操作的学生。

### User Story

作为学生，我希望在限时题中按答案的序号或字母立即作答，而不必切换到鼠标。

### Solution and Scope

复用选择题的 `1–4` / `A–D` 映射，为限时题增加全局键盘监听和可见提示；保留现有四项选项、计时、判分、超时和证据协议。

### Non-goals

不改变题库、重试规则、时间限制、进度模型、服务端接口或认证流程。

### Edge Cases

- 字母与数字都映射到当前选项。
- 作答后继续按键不会再次提交。
- 非映射按键无影响；超时仍走既有结算。

### Acceptance Criteria

1. `B` 与 `2` 均可提交第二项答案。
2. 键盘提交保持既有首次作答证据语义，且仅结算一次。
3. 全量测试、类型检查、构建、lint、差异检查与公开入口不回归。

## Technical Design

- 影响：`TimedChallengeGame`、一条组件级回归、CHANGELOG 和日报。
- 复用：既有 `GameRunner` 结算和选择题按键映射；没有新增依赖、状态持久化、API、迁移或 AI 逻辑。
- 回滚：将生产别名切回 2026-09-29 的已就绪部署 `https://math-k6-e8my4dqvw-logsail.vercel.app`，再回退提交 `555f397`。

## Product Changes

限时题面会明确提示“按 1–4 或 A–D 作答”；学生可直接按键完成对应选择。

## Implementation

- 为限时题选项和答案校验使用稳定回调，注册并在卸载时清理键盘监听。
- 新增 `timedChallengeKeyboard` 回归，覆盖字母、数字和提交去重。

## QA

- 定向回归：`npm run test -- src/test/timedChallengeKeyboard.test.tsx`，2/2 通过。
- 全量：23 个测试文件、576 项测试通过。
- `npm run typecheck`、`npm run build`、`git diff --check` 均通过。
- `npm run lint` 退出码 0；仅有既有 Fast Refresh/hooks 警告，本轮未增加警告。
- 本地浏览器：根路径重定向 `/login`，登录表单完整、内容非空、无 Vite 错误覆盖层；无受控认证会话，未声称已登录课程或生产交互验收。

## Bugs Fixed

- 修正限时题缺少键盘作答入口的交互不一致。
- 修正新增参数化回归的 mock 隔离，避免跨案例计数污染。

## Release Status

- Git：`555f397`（`feat: add timed challenge keyboard answers`）已推送至 `origin/main`。
- 生产：`vercel deploy . --prod --yes --scope logsail`；`dpl_BEDX6SCPwpGw4vhVz5nAirxQb4kz` 为 `READY`，别名 <https://math.logsail.lat>。
- 部署 URL：<https://math-k6-kca9ettif-logsail.vercel.app>。

## Product Impact

math-k6 的实际限时题现在与普通选择题共享低摩擦输入方式：学生能将有限时间用于心算与判断，而不是完成点击操作。

## Known Issues

- 认证态“课程作答 → 云端同步 → 重登回读”仍需用户控制的授权账号。
- 限时题当前仅有一题；未来扩充题库前需单独评审限时目标、超时与学习反馈是否仍合适。
- 2026-09-27 误建且未别名的 Vercel 项目未获授权清理。

## Backlog

- 完成：实际限时题的键盘作答闭环。
- 保留：授权账号下的进度同步回读；限时题扩充前的内容与规则评审。

## Next Candidates

1. 使用已授权账号完成课程作答、云端同步和同账号重登回读。
2. 在新增限时题前评审时间压力是否服务于学习目标，并补齐内容质量验收。
3. 获授权后清理误建的 Vercel 独立项目。

## Final Status

`DONE`：目标、验收、工程门禁、公开入口检查、提交、推送与正式部署均已完成；认证态云端链路是独立已知问题，未被冒充为本轮验收。
