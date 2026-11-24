# math-k6 Daily Release Report

## Version

v2026.11.16 · circle area selection accessibility

## Product Discovery

- **Target user:** 使用键盘或读屏完成三至六年级数学探索的学生。
- **Core scenario:** 学生进入圆面积模型，在“8 / 16 / 32 / 64 等分”之间切换，观察扇形重排如何逼近长方形。
- **Observed bottleneck:** `CourseMasteryModelC` 的圆面积模型已有 `index` 状态和视觉高亮，但等分按钮没有向辅助技术声明当前选项。
- **Evidence:** 2026-11-15 日报把圆面积等分控件列为下一候选；当前四个原生按钮只通过 `is-active` class 表达状态。
- **Candidate directions:** 补齐圆面积等分选中语义（高价值、低风险、可独立发布）；继续扩展同组件其他选择控件；使用受控账号验收登录后同步。

## Today's Release Goal

让圆面积模型的当前等分份数对辅助技术可读，并保持扇形重排、公式展示和教学交互不变。

## Why

这是上一轮明确的未完成无障碍缺口，复用已有 `index` 状态即可形成当天可完成的 vertical slice，不引入新的业务状态或数据依赖。

## Product Spec

### Problem

模型当前使用多少等分只通过视觉样式表达，键盘或读屏学生无法确认正在观察哪种重排精度。

### Target User and User Story

作为使用键盘或读屏学习圆面积的学生，我希望切换等分份数后能确认当前生效选项，从而把扇形数量和近似长方形对应起来。

### Solution and Scope

- 为“8 / 16 / 32 / 64 等分”按钮绑定由现有 `index` state 派生的动态 `aria-pressed`。
- 增加组件级回归，覆盖默认 16 等分与切换到 64 等分后的互斥状态。
- 更新 CHANGELOG 和本日报，保留现有视觉 class、扇形路径、结果文本与 `onInteract` 回调。

### Non-goals

- 不修改数学公式、扇形重排算法、题目、评分、进度、路由、认证、Supabase、数据库、PWA 或依赖。
- 不扩展到 `CourseMasteryModelC` 的扇形统计图阶段、天平步骤或其他模型。
- 不创建测试账号、不写入真实学习记录，不把公开入口或部署 Ready 当作登录后验收。

### Edge Cases and Acceptance Criteria

1. 初始 16 等分唯一为 `aria-pressed="true"`，其他三项为 `false`。
2. 点击任一其他等分后，四项状态互斥更新，现有结果文本与 SVG 仍由同一 `index` state 驱动。
3. 定向回归、全量测试、lint、typecheck、生产构建和 `git diff --check` 全部通过。
4. 本地生产预览的受保护课程入口仍跳转 `/login`，无新增 console error。
5. 代码提交、分支推送和 canonical Vercel 生产部署均有实际 readback；没有受控账号时，登录后课程、进度写入/回读、重登和跨设备同步保持未验收。

## Technical Design

- **Affected modules:** `src/components/CourseMasteryModelC.tsx`、`src/test/courseMasteryModelC.test.tsx`、`CHANGELOG.md`。
- **Approach:** 直接复用既有 `index` state，为映射出的四个原生按钮增加布尔 `aria-pressed`；不新增抽象、依赖、API、持久化字段或迁移。
- **Compatibility:** 视觉 class、按钮文案、扇形数量、结果文本、SVG aria-label 和交互回调保持不变。
- **Security / data:** 仅暴露当前本地 UI 状态，不写入账号或敏感数据。
- **Performance:** 常数级属性读取，无新增渲染循环或网络请求。
- **Rollback:** 回滚代码提交 `aa2654e`；上一份 canonical Ready 部署 `dpl_Fa1ENzL4HrJQ6JtB6MwGTz7dh9Px`，无数据库或不可逆数据变更。

## Implementation and Bugs Fixed

- 修复圆面积模型等分份数只对视觉用户可见的问题。
- 新增 `courseMasteryModelC.test.tsx` 回归，验证默认 16 等分和切换 64 等分后的互斥选中语义。

## QA Evidence

- 定向回归：`npm run test -- src/test/courseMasteryModelC.test.tsx`，2 项通过。
- 全量单测：71 个文件、835 项通过。
- `npm run lint`：退出码 0；仅保留仓库既有 Fast Refresh / hooks warnings。
- `npm run typecheck`：通过。
- `npm run build`：通过，Vite 生产构建和 PWA precache 生成完成。
- `git diff --check`：通过。
- 浏览器 QA：本地生产预览访问 `/math/kp/g6-circle-area` 实际跳转 `/login`，标题为“语数英综合学习平台”，console 0 errors、1 个已知缺少 Supabase 配置 warning；组件交互由定向回归覆盖。
- 生产域名 readback：`curl -I -L https://math.logsail.lat/math/kp/g6-circle-area` 返回 Cloudflare 403 challenge，未将保护页当作业务页面验收。

## Release Status

`PARTIAL`：代码、工程门禁、分支推送和 canonical 生产部署已完成；受控账号验收和生产业务页面访问仍缺失。

- **发布分支：** `daily-20261116-circle-area-selection-a11y`
- **代码提交：** `aa2654e fix: expose circle area selection state`
- **远端状态：** 已推送，远端分支与提交一致。
- **部署命令：** `npx --yes vercel link --project math-k6 --scope logsail --yes`；`npx --yes vercel --yes --prod`
- **canonical 部署：** `dpl_7PteBWo7bKsZQEt5Q5AYjDGTWRxZ`，target `production`、状态 `Ready`；部署 URL `https://math-k6-894qzafrw-logsail.vercel.app`，生产别名 `https://math.logsail.lat`、`https://math-k6.vercel.app`、`https://math-k6-logsail.vercel.app`。
- **Vercel inspect：** 已确认项目 `logsail/math-k6`、target 为 production、状态 Ready。
- **回滚目标：** `dpl_Fa1ENzL4HrJQ6JtB6MwGTz7dh9Px`；回滚前需再次 inspect 复核。

## Product Impact

圆面积模型的视觉选中状态与辅助技术语义现在一致；学生切换等分份数后可以确认当前学习上下文，降低理解“份数越多、弧边越接近直线”时的不确定性。相比上一版本，math-k6 继续把核心数学模型的可操作状态变成可读、可测量的学习证据。

## Known Issues

- 没有受控账号，登录后模型交互、云端进度写入/回读、重登和跨设备同步仍未验收。
- 生产域名受 Cloudflare/Vercel 保护，本轮使用 Vercel Inspect 的 Ready readback；未把 403 challenge 当作业务页面验收。
- `CourseMasteryModelC` 的扇形统计图阶段、天平步骤和其他模型控件仍待独立切片。
- 既有 lint warnings 与缺少 Supabase 公共配置 warning 未在本轮扩大处理。
- 工作区仍保留先前误建的 `logsail/math-k6-daily-20261112` Vercel 项目；删除会影响部署且不可逆，未在本轮执行。

## Backlog and Next Candidates

1. 在授权测试账号下验收“登录 → 进入圆面积模型 → 交互 → 完成 → 重登/跨设备回读”。
2. 评估 `CourseMasteryModelC` 的下一个单一选择缺口，优先扇形统计图阶段或天平步骤。
3. 取得人工确认后删除误建的 `math-k6-daily-20261112` Vercel 项目。
4. 继续补齐 PWA/iOS 发布前验收矩阵，不把公开入口、Cloudflare challenge 或 Ready 状态当作完整生产验收。

## Final Status

`PARTIAL`
