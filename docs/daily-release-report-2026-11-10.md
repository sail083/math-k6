# math-k6 Daily Release Report

## Version

v2026.11.10 · math model selection accessibility

## Today's Release Goal

让试商、小数加减和小数除法模型的分段选择按钮向辅助技术明确表达当前选中项。

## Why

11 月 9 日几何模型已经补齐了 `aria-pressed`，但同一数学探索链中的算术模型仍只用视觉 `is-active` 表示当前示例或步骤。键盘和读屏用户可以操作按钮，却无法确认哪个数学模型状态已经生效。

## Evidence

- 从最新独立发布基线 `origin/daily-20261109-geometry-selection-a11y`（`48432c8`）继续，避免重复前两日语言与几何无障碍修复。
- `src/components/CourseMathModel.tsx` 的试商样例、小数加减模式和小数除法缩放按钮原先没有 `aria-pressed`；现有视觉状态由同一份 React state 派生。
- 新增回归覆盖三组控件的初始状态与切换后的状态互斥关系。
- 主工作区仍有大量未提交在途改动；本轮使用独立 worktree，未读取、修改或提交主工作区文件。

## Product Spec

### Problem

辅助技术无法从算术模型的分段按钮得知当前示例、运算模式或缩放步骤。

### Target User and User Story

目标用户是使用屏幕阅读器或键盘辅助技术完成三至六年级数学探索的学生。学生切换模型后，希望能直接确认哪一个状态已生效。

### Solution and Scope

- 为试商的两个示例按钮增加动态 `aria-pressed`。
- 为小数加减和小数除法缩放按钮增加动态 `aria-pressed`。
- 保留现有视觉样式、数学计算、state、交互回调和课程内容。

### Non-goals

- 不改变题目、公式、评分、进度、路由、认证、Supabase、数据库、PWA 或依赖。
- 不泛化为全站所有分段控件已完成审查。
- 不伪造登录、真实学习记录或跨设备同步证据。

### Edge Cases and Acceptance Criteria

1. 三组控件初始各有且仅有一个 `aria-pressed="true"`。
2. 切换任意选项后，旧选项为 `false`、新选项为 `true`，原有模型结果仍正常更新。
3. 定向回归、全量测试、lint、typecheck、生产构建、`git diff --check` 通过。
4. 提交、部署和回滚目标均有真实回执；没有受控账号时明确保留 PARTIAL。

## Technical Design and Implementation

- 影响模块：`src/components/CourseMathModel.tsx`、`src/test/courseMathModel.test.tsx`、`CHANGELOG.md`。
- 复用现有 state 与按钮渲染，仅增加原生布尔 ARIA 属性和三组组件级回归。
- 无新增组件、依赖、状态、API、持久化字段、迁移或权限变化。
- 回滚为还原本轮提交；不需要数据库回滚。

## QA

- 定向回归：`npm run test -- src/test/courseMathModel.test.tsx src/test/discoveryTeaching.test.tsx --pool=threads --maxWorkers=1`，2 个文件、12 项通过。
- 全量单测：`npm run test -- --pool=threads --maxWorkers=1`，66 个文件、825 项通过。
- `npm run typecheck`：通过。
- `npm run build`：通过，Vite 生产构建与 PWA service worker 生成成功。
- `npm run lint`：退出码 0；保留仓库既有 Fast Refresh/hooks 警告，未扩大范围。
- `git diff --check`：通过。
- 本地浏览器实际打开 `http://127.0.0.1:4177/`，应用跳转 `/login`，页面标题“语数英综合学习平台”，console 0 errors、1 warning；未提交凭据，未把受保护课程页交互写成通过。

## Bugs Fixed

- 修复键盘或读屏用户无法确认试商示例、小数加减模式和小数除法缩放步骤的问题。

## Release Status

`PARTIAL`。

- 发布分支：`daily-20261110-math-model-selection-a11y`。
- 实际代码提交：`acec769 fix: expose math model selection state`。
- 发布命令：`CI=1 npx vercel --prod --yes --scope logsail`（先用 `vercel link --project math-k6 --yes --scope logsail` 绑定现有项目）。
- 生产部署：`dpl_4xQrgL8imowbampgH6Ei3U5s215x`，状态 `READY`，绑定 `https://math.logsail.lat`；部署 URL 为 `https://math-k6-msxubr15k-logsail.vercel.app`。
- 生产回读：`npx vercel curl https://math.logsail.lat --scope logsail` 返回应用 HTML；`vercel inspect` 回读目标 `production`、状态 `Ready`。
- 过程中首次未链接 worktree 的命令创建了临时项目 `math-k6-daily-20261110`（`dpl_FxnEatYRvECvbf8bintxPpkgRJnG`，READY），未绑定生产域名、未作为验收依据；随后已改用既有 `math-k6` 项目完成正式部署。
- 回滚目标：部署前最近一份已验证 READY 的 Vercel 生产部署；恢复前需以 `vercel inspect` 回读实际部署，不执行数据库回滚。
- `PARTIAL` 的唯一原因：没有受控账号，未完成登录后课程真实交互与云端/跨设备同步验收；工程门禁不受影响。

## Product Impact

数学探索现在能让视觉用户和辅助技术用户读取同一份当前状态。学生切换示例或运算步骤后，可以确认生效的数学模型，降低探索过程中的不确定性；实现不引入 AI、网络或数据风险。

## Known Issues

- 真实账号下的课程登录、作答、进度回读与跨设备同步仍需受控验收。
- 其他数学模型与语言课程中的分段按钮仍需按用户价值逐步审查，不能把本轮局部修复泛化为全站完成。
- 移动端语音、PWA/iOS 更新和 Supabase Free 方案的泄露密码保护仍按既有发布边界等待受控验收或明确授权。
- lint 的既有警告未在本轮扩大处理。

## Backlog

1. 完成：试商、小数加减、小数除法模型的选中状态语义和回归保护。
2. 保留：受控账号下完成数学/语言课程“登录 → 作答 → 完成 → 重登/跨设备回读”。
3. 保留：继续审查其他高频数学探索控件的辅助技术语义，复用本轮原生 `aria-pressed` 模式。

## Next Candidates

1. 受控账号下完成数学和语言课程核心路径与云同步验收。
2. 继续审查其他数学模型（分数、概率、几何以外）的选择语义，并保持单一小切片。
3. 补齐 PWA/iOS 发布前验收矩阵，不把公开入口或 Preview READY 当成完整生产验收。

## Final Status

`PARTIAL`
