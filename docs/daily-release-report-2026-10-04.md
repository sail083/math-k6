# math-k6 Daily Release Report

## Version

v2026.10.04 · judgment keyboard answers

## Today's Release Goal

让判断题与已有单选、限时单选一致，支持不用鼠标的键盘作答。

## Why

判断题是课程中的基础交互，但此前只能点击“对 / 错”；学生从带快捷键的选择题切换到判断题时被迫切换输入方式。这个小断点直接增加桌面连续练习的操作成本。

## Evidence

- `ChoiceGame` 和 `TimedChallengeGame` 已支持 `1–4`、`A–D` 键盘作答。
- `TrueFalseGame` 没有键盘监听和快捷键提示，但其两项选项天然可映射到前两位。
- 2026-09-29 已为判断题建立“首错不提交、改正后记为非首次”的反馈与证据规则；本轮必须保持该语义。

## Product Spec

### Problem

判断题缺少现有选择题模式的键盘入口，连续桌面练习不连贯。

### Target User

使用实体键盘完成三至六年级数学课程的学生。

### User Story

作为学生，我希望在判断题中用键盘快速选择“对”或“错”，并清楚知道按键对应关系。

### Solution and Scope

- `1` 或 `A` 选择第一个选项“对”；`2` 或 `B` 选择第二个选项“错”。
- 在题面展示对应快捷键。
- 复用既有判断题的重试、解析、评分和证据逻辑。

### Non-goals

不修改题库、判分、首次证据、进度、认证、接口、数据库、迁移或其他题型。

### Edge Cases and Acceptance Criteria

1. `1/A` 均可一次提交“对”，且只记录一次首次正确证据。
2. `2/B` 首次选错后显示既有“再想想”，不提交证据；随后按 `A` 改正时只记录一次 `firstTry=false` 的正确证据。
3. 已完成后再次按键不能重复提交；鼠标流程与既有判断题重试语义不回归。
4. 未登录公开入口可正常加载；无登录态时不声称课程或云端进度验收。

## Technical Design

- 影响模块：仅 `TrueFalseGame` 与组件级回归。
- 前端：用 `useEffect` 监听现有全局键盘模式，按选项下标映射前两个键；选项与回调使用 memo/callback，避免新增 hooks lint 警告。
- 后端、API、数据库、AI、持久化、迁移：无变更。
- 兼容与安全：仍经过同一 `handleSelect` 的已完成/已错选守卫；无新依赖、无新数据输入或权限。
- 回滚：回退 `abb2911`，或重新部署上一生产版本 `dpl_APo1P6tkgtuTrM82Wb7FYLzGa83h`（<https://math-k6-ugfo5ijne-logsail.vercel.app>）。

## Product Changes

判断题题面现在明确提示“按 1 或 A 选对；按 2 或 B 选错”。学生可在选择题、限时题和判断题之间持续使用键盘完成作答。

## Implementation

- `TrueFalseGame` 新增键盘映射与可见提示。
- 保持首错后可改选、改正后不算首次证据、完成后阻止重复提交的原有流程。
- 新增 `trueFalseKeyboard` 回归，覆盖四个按键、重试与一次性证据记录。

## QA

- 定向：`npm run test -- src/test/trueFalseKeyboard.test.tsx src/test/trueFalseRetryEvidence.test.tsx`，2 个文件、5 项通过。
- 全量：25 个文件、584 项测试通过。
- `npm run lint` 退出码 0；仅剩仓库原有 Fast Refresh 与 `ChoiceGame` hooks 警告，本轮没有新增 lint 警告。
- `npm run typecheck`、`npm run build`、`git diff --check` 通过；提交钩子再次执行类型检查与全量测试，584 项通过。
- 本地浏览器：`http://127.0.0.1:4173/` 显示完整登录表单，页面有内容、无 Vite 错误覆盖层、控制台错误为空。
- 生产浏览器：正式域名返回 Cloudflare 人机验证页，未绕过该保护；因此未将其误记为公开应用页或已认证课程验收。Vercel CLI 实际回读部署为 Ready。

## Bugs Fixed

- 修复判断题相对选择题缺少键盘作答入口的交互不一致。

## Release Status

- Git：`abb2911`（`feat: add judgment keyboard answers`）已推送至 `origin/main`。
- Production：`vercel deploy . --prod --yes --scope logsail` 完成；部署 `dpl_6qw3zTXsEQgPrk58S4kyH4xsPz6B` 为 `READY`。
- URL：<https://math.logsail.lat>；部署 URL：<https://math-k6-j43u98h5c-logsail.vercel.app>。

## Product Impact

学生在连续数学练习中少一次输入方式切换，判断题也遵循可预期的选项键盘模式；同时不牺牲“先思考、再改正”的反馈和掌握证据可信度。

## Known Issues

- 认证态“课程作答 → 云端同步 → 同账号重登回读”仍需用户控制的受控账号。
- 正式域名的自动化浏览器目前受 Cloudflare 人机验证阻挡；Vercel Ready 不是认证课程验收。
- 限时题仍只有一题，扩题前需要单独评审时间压力、反馈与课程价值。
- 2026-09-27 误建且未别名的 Vercel 项目尚未获授权清理。

## Backlog

- 完成：判断题键盘作答一致性。
- 保留：授权账号下课程到云端进度回读；新增限时题前的内容与规则评审。

## Next Candidates

1. 使用已授权账号完成课程作答、云端同步和同账号重登回读。
2. 为新增限时题建立内容与反馈验收，再决定是否扩充题库。
3. 获授权后清理误建的 Vercel 独立项目。

## Final Status

`DONE`：唯一目标、验收标准、定向与全量回归、工程门禁、本地公开入口、提交、推送和正式部署均已完成。受控账号的云端进度回读与 Cloudflare 后的公开页浏览器验收保持为独立边界，未被本轮证据替代。
