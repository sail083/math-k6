# math-k6 Daily Release Report

## Version

v2026.11.05 / v2026.11.05.1 · score accessibility and production security release

## Product Discovery

- **Target user:** 完成数学练习、使用屏幕阅读器或键盘辅助技术的三至六年级学生。
- **Core scenario:** 学生提交最后一题，系统显示通过/待复习结论和“得分 X / Y”。
- **Observed bottleneck:** 结果标题会获得焦点，星级也有文本替代；但得分徽章只是视觉文本，不是命名状态。读屏学生无法可靠获知实际得分及总分。
- **Candidate directions:** 为得分摘要补足动态语义（高价值、低风险、复用既有结果流）；受控账号下的认证/跨设备同步验收（依赖账号与环境）；PWA/课程整合的生产前验收（范围过大，不适合作为当天切片）。

## Today's Release Goal

让练习结束页无论通过还是需要再练，都会向辅助技术清楚提供“本次得分 X 分，满分 Y 分”。

## Why

得分是练习结束时判断下一步的核心信息。当前产品已能宣布答题结果、聚焦结果标题和说明题目进度；补齐最终成绩能让读屏学生不依赖视觉排版完成完整的“作答 → 结果 → 决策”路径。

## Evidence

- `origin/main` 的 `GameRunner` 已将结果标题聚焦并为星级提供可访问名称，但“得分 X / Y”容器没有角色或名称。
- 前一日候选在 Backlog 中明确提出“为课程内得分摘要补充可访问名称”，需要先从当前隔离基线复核；本轮确认该能力尚未存在。
- 新增回归先在未修改实现时失败：找不到名称为“本次得分：20 分，满分 20 分”的 `status`；实施后通过。

## Product Spec

### Problem

屏幕阅读器用户完成最后一题后只能可靠获知通过/未通过标题，不能从得分徽章获知本次分数与满分。

### Target User and User Story

作为完成数学练习的学生，我希望结果页直接告诉我本次得分和满分，以便判断自己是否需要复习或可以继续下一课。

### Solution and Scope

- 将现有得分摘要标记为命名的 `status`，名称动态使用既有 `score` 与 `maxScore`：`本次得分：X 分，满分 Y 分`。
- 增加通过（20/20）和未通过（10/20）两种结果路径的组件回归。

### Non-goals

- 不改变题目、评分、星级、掌握判定、课程进度、路由、认证、Supabase、数据库或 PWA。
- 不处理当前远端整合的生产验收、跨设备同步或密码恢复邮件。

### Edge Cases and Acceptance Criteria

1. 全部答对后，结果页存在名称为“本次得分：20 分，满分 20 分”的状态。
2. 未达标后，结果页仍存在对应实际得分和满分的状态（回归覆盖 10/20）。
3. 可视化“得分 X / Y”、得分计算和原有结果操作不变。
4. 定向/全量测试、lint、typecheck、生产构建和 `git diff --check` 均通过。

## Technical Design and Implementation

- 影响模块：`src/components/GameRunner.tsx` 与 `src/test/gameRunner-flow.test.tsx`。
- 前端：复用结果页已有的 `score`、`maxScore`；不新增组件、状态、依赖、请求或持久化。
- 可访问性：`role="status"` 配合动态 `aria-label`，保留原有可视得分内容与结果标题焦点。
- Compatibility / performance / security：仅增加静态语义属性；没有网络、权限、数据或迁移影响。
- Rollback：还原代码提交 `ecaaeb0` 即可；不需要数据库回滚。

## QA

- Red：`npm run test -- src/test/gameRunner-flow.test.tsx` 在实现前失败，错误为找不到命名得分状态。
- 定向回归：实现后同一命令 12/12 通过。
- 全量：`npm run test`，63 个文件、814 项通过。
- 工程门禁：`npm run lint` 退出 0（保留仓库既有 29 条 Fast Refresh/hooks 警告）；`npm run typecheck`、`npm run build`、`git diff --check` 全部通过。
- 浏览器：本地生产预览 `http://127.0.0.1:4175/math/kp/g3-mult-1digit` 实测按保护路由跳转 `/login`，页面可见、console 0 error。环境缺少 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`，因此没有伪造登录或写入学习数据；受保护课程的真实浏览器答题不作为本轮已验收证据，结果流程以组件回归覆盖。

## Bugs Fixed

- 练习结束页的得分摘要缺少可访问名称与状态语义，读屏用户无法可靠获取分数和满分。

## Owner-directed Production Risk Remediation

用户在初始候选完成后明确要求“解决风险，发布生产”。本节记录随后的独立安全发布；它不把此前的候选状态倒写为已验收。

### Risk and Decision

- Supabase Security Advisor 发现 `public.get_email_by_login_identifier(text)` 是可由 `anon` 调用的 `SECURITY DEFINER` 函数，会把用户名或手机号解析为 Auth 邮箱。
- 保留用户名/手机号登录体验，同时把解析和 password grant 移至 `login-with-identifier` Edge Function；浏览器只接收短期会话 token。
- 先部署函数与新前端，成功验证生产错误凭据路径后，才撤销旧 RPC 权限，避免在切换窗口中中断新登录路径。

### Implementation and Evidence

- `589e2a1 fix: secure identifier login`：新增 Edge Function、前端会话接收和 2 条回归；远端函数已部署。
- 生产函数 `OPTIONS` CORS 预检返回 200；错误凭据返回统一的 `401 {"error":"invalid_credentials"}`，不包含邮箱。
- 迁移 `20261105035033_secure_identifier_login_resolver` 已应用；生产查询确认 `anon_can_lookup_phone=false`、`anon_can_lookup_identifier=false`、`authenticated_can_lookup_identifier=false`。
- Security Advisor 已不再报告匿名 SECURITY DEFINER 函数；仅保留 Free 方案无法启用的“泄露密码保护”提示。
- `e37918b fix: align password policy`：注册最小长度提高到 8 位并增加回归；生产 Auth 控制台已保存最低密码长度 8。
- 两次生产部署均 Ready：`dpl_9QJmujKjGUneTqPUc3r24h8LsYGM`（安全登录）与 `dpl_9GueLJ9Vzu7MPv9Qi2y78YitmvHi`（密码策略），最终 alias 为 `https://math.logsail.lat`、`https://math-k6.vercel.app`。

### Production QA and Rollback

- 本地全量门禁：`npm run lint` 退出 0（29 条既有 warning）、`npm run typecheck`、`npm run build`、`git diff --check` 通过；最终全量 64 个文件、817 项测试通过。
- 浏览器生产登录页实际提交无效用户名/密码，界面显示统一错误“用户名、手机号或密码不正确，请重试。”；网络 401 是预期的拒绝结果，不是应用异常。
- 未使用或记录真实账号密码；因此真实成功登录、跨设备同步和 PWA/iOS 更新仍不是本次验收结论。
- 回滚：将 Vercel alias 恢复到 `dpl_9QJmujKjGUneTqPUc3r24h8LsYGM` 前的 Ready 部署；如需临时恢复旧登录客户端，重新授予两个 RPC 的 `anon` 执行权限后再恢复旧前端，且必须记录该临时邮箱暴露风险。

## Release Status

`PARTIAL`。

- 已推送 `main`：`589e2a1`、`e37918b`，并由 Git 自动创建生产部署。
- 最终生产部署：`dpl_9GueLJ9Vzu7MPv9Qi2y78YitmvHi` / `https://math-k6-3e4oustu0-logsail.vercel.app`，状态 Ready，alias 已指向 `https://math.logsail.lat` 和 `https://math-k6.vercel.app`。
- `PARTIAL` 的唯一原因：泄露密码库检查需升级到 Supabase Pro；本轮不包含付费授权。邮箱解析暴露、迁移对齐、PWA 构建与无效凭据路径风险均已在本轮处理或验证。

## Product Impact

结果页现在对视觉和辅助技术用户表达同一份完整信息：结论、星级与具体得分。更关键的是，用户名/手机号登录不再暴露内部邮箱；学生注册和重置密码也开始遵循同一最低 8 位策略。生产版本已发布并可回滚。

## Known Issues

- Supabase Free 方案的泄露密码库检查不可用；启用它需要用户明确授权升级 Pro。
- 跨浏览器/跨设备云端同步、密码恢复邮件回跳仍需要受控账号验收。
- PWA 双版本/iOS 真机和课程内容准确性未以本次生产发布为已验收结论。
- lint 的 29 条既有警告不属于本切片，未扩大处理范围。

## Backlog

1. 完成：练习结果页得分的读屏语义与通过/未通过回归保护。
2. 完成：生产数据库的语言课程迁移历史和核心 RLS/RPC 权限复核。
3. 保留：若用户授权 Supabase Pro，开启泄露密码保护并回读 Security Advisor。
4. 保留：受控账号下验收认证、课程作答、云端同步与跨设备/重登回读。

## Next Candidates

1. 用户授权后升级 Supabase Pro 并开启泄露密码保护。
2. 在有授权受控账号和确认回调白名单时，验收密码恢复 → 登录 → 课程 → 进度回读。
3. 完成 PWA 更新与精选字笔顺课程的生产前验收矩阵。

## Final Status

`PARTIAL`：生产已发布，匿名邮箱解析风险已消除，密码最低长度已加固；泄露密码库检查因 Supabase Free 方案限制尚未可用，未执行付费升级。
