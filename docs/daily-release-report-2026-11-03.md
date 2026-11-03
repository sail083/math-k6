# math-k6 Daily Release Report

## Version

v2026.11.03 · practice progress accessibility · production / user acceptance pending

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
- 生产真实账号验收（2026-11-03）：在 <https://math.logsail.lat> 已登录账号完成 `确定单位“1”` 的第 7 天 A 卷，两题均首次答对，页面显示“已记录第7天保持证据”。学习看板由 `3 待复习` 更新为 `2 待复习`。退出并使用浏览器保存凭据重新登录后，仍回读 `2 待复习`，真实登录、作答与同机重登进度保留通过。未清除本地站点数据、未读取或记录账号密码；同机重登不能单独证明跨设备云端一致性。

## Bugs Fixed

- 练习进度条缺少可访问名称，导致其百分比缺少题目进度上下文。

## Release Status

`PARTIAL`。

- 已提交并推送隔离候选分支：`daily-20261103-practice-progress-a11y`；代码提交为 `fd509fb`，本报告及 CHANGELOG 随后也在同一分支留档。
- 用户随后明确要求“我去生产测试给你反馈，你先发布”，本轮按此授权完成生产部署；未创建 PR、未合并主工作区、未执行数据库迁移。
- 发布源码：`b28d181770623f5112b47be29068441fc2c0d7f6`。使用新的干净 detached 工作树 `/Users/saillaw/.codex/worktrees/math-k6-production-20261103`，只上传该提交中的文件，无浏览器临时产物或主工作区 WIP。
- 发布前重新运行 lint、typecheck、全量 63 文件/813 测试、build 与 diff 检查，全部通过（lint 保留既有警告）。
- 目标：Vercel `logsail/math-k6`，项目 `prj_52X35DDW2EFnoxy5dOnFRNtOxi1b`，production 环境。连接器缺少团队权限，改用本机已登录的官方 CLI。
- 实际命令：`node /Users/saillaw/.npm/_npx/67eb4586ca667318/node_modules/vercel/dist/index.js deploy . --prod -y --scope logsail --project math-k6`（CLI 65.10.0）。
- 正式部署：`dpl_EavX4VVDkUfLyYFPfHGDc9jg7b95`，`READY`；部署地址 <https://math-k6-oofgrtm63-logsail.vercel.app>，已别名至 <https://math.logsail.lat>。
- 发布前实时回读的回滚目标：`dpl_GBeYPhnjC3xJSw3UVGLDYUAb4h4r`，`READY`，<https://math-k6-queodomn1-logsail.vercel.app>。需要回滚时可用官方 CLI `rollback https://math-k6-queodomn1-logsail.vercel.app --scope logsail`；本轮未执行回滚。
- 生产真实用户验收由用户接续；Ready 和域名切换回执不等同课程、云同步、笔顺和 iOS 全流程验收。

## Product Impact

这是对所有数学练习题型共享入口的低风险改善。它降低读屏学生的学习位置不确定性，不依赖生成式 AI，也不改变掌握判定。

## Known Issues

- 已完成生产真实登录、课程作答和同机重登进度回读；跨浏览器/跨设备云端一致性、密码恢复邮件回跳仍需要受控验收。
- 前一轮整合中的数据库白名单、PWA 版本切换/iOS 真机和精选字笔顺教学准确性仍未完成生产前验收。

## Backlog

1. 完成：练习进度条的读屏题号语义与回归保护。
2. 保留：在受控账号与已确认 URL allow-list 下验收密码恢复、登录、课程作答、同步与重登。
3. 已按授权发布前端；继续完成 PWA 双版本/iOS、Supabase 白名单及课程教学内容验收，接收生产测试反馈。

## Next Candidates

1. 为课程内得分摘要补充可访问名称，前提是先从当前隔离基线复核重复性。
2. 授权受控账号下的认证与云端进度端到端验收。
3. 前一轮 PWA 更新与三年级笔顺课程的生产前验收闭环。

## Final Status

`PARTIAL`：产品代码、工程门禁和正式部署均完成；用户接续生产测试，新课程数据库、PWA/iOS 等未验证项继续保留。
