# math-k6 Daily Release Report

## Version

v2026.11.09 · geometry model selection accessibility

## Today's Release Goal

让数学“动手试”几何模型的步骤与三角形分类按钮向辅助技术明确表达当前选中项。

## Why

数学探索是 math-k6 的核心学习路径。此前几何模型控件只通过视觉 `is-active` 样式表达“原图 / 切开 / 补成长方形”和“锐角 / 直角 / 钝角”的当前选项，读屏用户可以操作按钮，却无法确认模型当前处于哪一种演示状态。

## Evidence

- 本轮从最新隔离发布基线 `origin/daily-20261108-language-result-status` / `1745230` 继续，未重复 11 月 7、8 日语言练习无障碍修复。
- `src/components/CourseGeometryModel.tsx` 的 `Segments` 和 `TriangleLab` 仅根据 `is-active` class 切换视觉状态，没有 `aria-pressed`。
- 新增回归在实现前失败：三角形初始分类和面积变换步骤都找不到 `aria-pressed` 状态。
- 主工作区仍有大量未提交在途改动；本轮只使用独立 worktree，未读取、修改或提交主工作区文件。

## Product Spec

### Problem

辅助技术无法从几何模型的分段按钮得知当前演示步骤或三角形分类，用户难以确认自己正在观察哪一种数学关系。

### Target User and User Story

目标用户是使用屏幕阅读器或键盘辅助技术完成三至六年级数学探索的学生。学生希望在切换几何模型步骤或三角形类型后，能直接知道哪一个选项已生效。

### Solution and Scope

- 为几何模型共用 `Segments` 按钮增加动态 `aria-pressed`。
- 为三角形分类按钮增加动态 `aria-pressed`。
- 保留原有视觉样式、SVG 计算、交互回调和课程内容。

### Non-goals

- 不改变几何模型公式、题目内容、学习进度、评分、路由、认证、Supabase、数据库、PWA 或依赖。
- 不扩大到其他尚未审查的数学模型分段控件。
- 不伪造登录或写入真实学习数据。

### Edge Cases and Acceptance Criteria

1. 三角形模型初始“锐角三角形”为 `aria-pressed="true"`，其他分类为 `false`。
2. 切换到任一三角形分类后，旧选项变为 `false`，新选项变为 `true`，角度和图形回归保持正确。
3. 平行四边形面积模型初始“原图”为 `true`；点击“切开”后仅“切开”为 `true`。
4. 定向/全量测试、lint、typecheck、生产构建和 `git diff --check` 通过。
5. 生产部署状态、URL 和回滚目标有真实回执。

## Technical Design and Implementation

- 影响模块：`src/components/CourseGeometryModel.tsx`、`src/test/discoveryTeaching.test.tsx`、`CHANGELOG.md`。
- 复用已有 state 与按钮渲染，仅增加原生布尔 ARIA 属性；不新增组件、依赖、状态、API、持久化字段或迁移。
- 性能、兼容性和安全风险为静态 DOM 语义级别；回滚为还原提交 `972f336`，无需数据库回滚。
- 实际代码提交：`972f336 fix: expose geometry selection state`。

## QA

- Red：新增回归在实现前失败，三角形选项缺少 `aria-pressed`；面积模型测试最初使用了错误知识点 ID，已在实现前修正为真实 `g5-parallelogram-area`。
- 定向回归：`npm run test -- src/test/discoveryTeaching.test.tsx --pool=threads --maxWorkers=1`，9/9 通过。
- 全量单测：`npm run test -- --pool=threads --maxWorkers=1`，65 个文件、822 项通过。
- `npm run lint`：退出码 0；保留仓库既有 Fast Refresh/hooks 警告，未扩大范围。
- `npm run typecheck`：通过。
- `npm run build`：通过，Vite 生成生产构建与 PWA service worker。
- `git diff --check`：通过。
- 本地生产预览 `http://127.0.0.1:4176/math/kp/g4-triangle` 实际跳转 `/login`，console 仅有预期的缺少 Supabase 公共配置警告，无应用错误；未提交登录表单。
- 生产浏览器 `https://math.logsail.lat/math/kp/g4-triangle` 实际跳转 `/login`，页面标题为“语数英综合学习平台”；未使用受控账号，因此未把登录后几何页面浏览写成已验收事实。

## Bugs Fixed

- 几何模型步骤和三角形分类按钮缺少当前选中状态语义，读屏用户无法确认已生效的演示选项。

## Release Status

`PARTIAL`。

- 发布分支：`daily-20261109-geometry-selection-a11y`。
- 生产部署：`dpl_EBKQfXYUEbv5oGULjULXaBhaWYQz`，状态 `READY`。
- 部署 URL：`https://math-k6-67mrgn82c-logsail.vercel.app`。
- 生产别名：`https://math.logsail.lat`；同时回读 `https://math-k6.vercel.app` 与 `https://math-k6-logsail.vercel.app`。
- 部署命令：`CI=1 npx vercel --prod --yes --scope logsail`。
- 生产回读：`npx vercel curl https://math.logsail.lat --scope logsail` 返回应用 HTML；`vercel inspect` 显示目标 `production`、状态 `Ready`。
- 回滚目标：发布前最近一份已验证 READY 的 Vercel 生产部署；恢复前需以 `vercel inspect` 回读实际部署，不执行数据库回滚。
- `PARTIAL` 的唯一原因：没有受控账号，未完成登录后数学课程的真实浏览器交互与跨设备同步验收；工程门禁和部署本身均已完成。

## Product Impact

数学几何探索现在对视觉用户和辅助技术用户表达同一份选择状态。学生切换演示步骤或三角形类型后，可以确认当前生效的数学模型，降低探索过程中的认知不确定性；实现不引入 AI、网络或数据风险。

## Known Issues

- 真实账号下的课程登录、几何交互、学习记录回读与跨设备同步仍需受控验收。
- 其他数学模型和语言课程中的分段按钮仍需按用户价值逐步审查，不能把本轮局部修复泛化为全站完成。
- 移动端语音、PWA/iOS 更新和 Supabase Free 方案的泄露密码保护仍按既有发布边界等待受控验收或明确授权。
- lint 的既有警告未在本轮扩大处理。

## Backlog

1. 完成：几何模型步骤与三角形分类的选中状态语义和回归保护。
2. 保留：受控账号下完成数学/语言课程“登录 → 作答 → 完成 → 重登/跨设备回读”。
3. 保留：继续审查其他高频数学探索控件的辅助技术语义，优先复用本轮原生 `aria-pressed` 模式。

## Next Candidates

1. 受控账号下完成数学和语言课程核心路径与云同步验收。
2. 继续审查其他数学模型（小数、分数、概率）选择控件的选中语义，并保持单一小切片。
3. 在不扩大未验收课程整合的前提下，补齐 PWA/iOS 发布前验收矩阵。

## Final Status

`PARTIAL`
