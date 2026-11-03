# math-k6 Daily Release Report

## Version

v2026.11.03 · practice progress accessibility · unreleased candidate

## Today's Release Goal

让使用屏幕阅读器的学生在数学练习过程中明确知道进度条对应当前第几题。

## Why

练习是 math-k6 的核心学习路径。当前视觉界面已经显示“第 N / M 题”，但同一条 `progressbar` 只有百分比、没有可访问名称；读屏用户无法从控件本身判断这个百分比表示什么。

## Evidence

- `origin/main` 的 `GameRunner` 在本轮开始时为进度条设置了 `aria-valuenow/min/max`，但没有 `aria-label` 或关联标签。
- 已有学习中心进度条测试使用命名 `progressbar`，说明仓库采用命名进度控件的无障碍模式。
- 当前主工作区有大量在途修改；本轮从干净的 `origin/main`（`d563d1e`）隔离工作树实施，未混入主工作区内容。

## Product Spec

### Problem

读屏用户只能听到百分比，无法判断它对应练习题目进度。

### Target User

使用屏幕阅读器或依赖辅助技术完成数学练习的三至六年级学生。

### User Story

作为学生，我希望进度控件说清当前第几题，以便在连续练习时确认自己所处位置。

### Solution and Scope

- 为 `GameRunner` 的练习进度条提供动态名称：`练习进度：第 N / M 题`。
- 添加回归测试，覆盖首题与点击“下一题”后的末题名称和百分比。

### Non-goals

- 不改变题目、得分、首次证据、课程进度、路由、认证、Supabase、数据库或 PWA 行为。
- 不修改未发布的大型课程/PWA 整合内容。

### Edge Cases and Acceptance Criteria

1. 首题的进度条可被按名称找到，名称为“练习进度：第 1 / 总题数 题”，百分比保持原值。
2. 正常作答并进入下一题后，名称和百分比同步更新。
3. 所有既有练习流程、类型检查、全量测试、构建、lint 和 diff 检查通过。

## Technical Design and Implementation

- 影响模块：仅 `src/components/GameRunner.tsx` 和其渲染流程回归测试。
- 前端：复用现有题号和题目总数状态；不新增组件、依赖、状态、API 或数据写入。
- 性能/兼容性：字符串随既有渲染更新，无网络请求或持久化影响。
- 安全/迁移/回滚：无安全、数据库或迁移变更；回退代码提交 `fd509fb` 即可移除该标签。

## Product Changes

读屏用户现在会得到“练习进度：第 1 / 2 题”或“练习进度：第 2 / 2 题”的明确上下文，而不只是 50% 或 100%。

## Implementation

- `src/components/GameRunner.tsx`：为核心练习进度条添加动态 `aria-label`。
- `src/test/gameRunner-flow.test.tsx`：覆盖初始题与下一题的可访问名称和 `aria-valuenow`。
- 代码提交：`fd509fb fix: label practice progress`。

## QA

- 定向：`npm run test -- src/test/gameRunner-flow.test.tsx`，1 个文件、11 项通过。
- 全量：`npm run test`，63 个文件、813 项通过。
- 工程门禁：`npm run lint`（退出 0，保留仓库既有 31 条 Fast Refresh/hooks 警告）、`npm run typecheck`、`npm run build`、`git diff --check` 均通过。
- 浏览器：本地生产预览 `http://127.0.0.1:4174/math/kp/g3-mult-1digit` 实测正确重定向到 `/login`，页面完整、console 0 error。由于本地没有受控 Supabase 公共配置或测试账号，未执行受保护课程的真实浏览器作答，也不将该项写为已验收。

## Bugs Fixed

- 练习进度条缺少可访问名称，导致其百分比缺少题目进度上下文。

## Release Status

`PARTIAL`。

- 已提交并推送隔离候选分支：`daily-20261103-practice-progress-a11y`；代码提交为 `fd509fb`，本报告及 CHANGELOG 随后也在同一分支留档。
- 未创建 PR、未部署生产。
- 部署暂停原因：当前 `origin/main` 还包含前一轮未发布的大型课程/PWA 整合；其 Supabase 白名单核对因认证错误未完成，且 PWA 双版本/iOS 与真实账号验收仍缺失。将本提交直接生产部署会把这些未验证内容一起发布，属于高风险操作。
- 回滚：丢弃该隔离分支，或在未来安全部署后将生产别名恢复到部署前的已验证 READY 版本（恢复前须复核实际内容）。

## Product Impact

这是对所有数学练习题型共享入口的低风险改善。它降低读屏学生的学习位置不确定性，不依赖生成式 AI，也不改变掌握判定。

## Known Issues

- 真实登录、云端同步、密码恢复邮件回跳和跨设备重登仍需要受控账号验收。
- 前一轮整合中的数据库白名单、PWA 版本切换/iOS 真机和精选字笔顺教学准确性仍未完成生产前验收。

## Backlog

1. 完成：练习进度条的读屏题号语义与回归保护。
2. 保留：在受控账号与已确认 URL allow-list 下验收密码恢复、登录、课程作答、同步与重登。
3. 保留：在隔离候选中完成 PWA 双版本/iOS、Supabase 白名单和课程教学内容验收后，再安排包含该整合的生产发布。

## Next Candidates

1. 为课程内得分摘要补充可访问名称，前提是先从当前隔离基线复核重复性。
2. 授权受控账号下的认证与云端进度端到端验收。
3. 前一轮 PWA 更新与三年级笔顺课程的生产前验收闭环。

## Final Status

`PARTIAL`：产品代码、测试和本地预览检查完成，生产部署因会携带未验收的大型远端整合而安全暂停。
