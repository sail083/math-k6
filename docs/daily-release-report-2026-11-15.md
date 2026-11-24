# math-k6 Daily Release Report

## Version

v2026.11.15 · cuboid surface selection accessibility

## Product Discovery

- **Target user:** 使用键盘或读屏完成三至六年级数学探索的学生。
- **Core scenario:** 学生进入长方体表面积模型，在“有盖 / 无盖”之间切换，观察展开图和表面积公式。
- **Observed bottleneck:** `CourseMasteryModelC` 的长方体表面积模型已有 `hasLid` 状态和视觉高亮，但按钮没有向辅助技术声明当前选项。
- **Evidence:** 上一日报将 `CourseMasteryModelC` 的单一模型选择列为下一候选；当前实现的“有盖 / 无盖”按钮只由 `is-active` class 表达状态。
- **Candidate directions:** 补齐长方体“有盖 / 无盖”选中语义（高价值、低风险、可独立发布）；继续扩展同组件其他模型控件；使用受控账号验收登录后课程和进度同步。

## Today's Release Goal

让长方体表面积模型的当前“有盖 / 无盖”状态对辅助技术可读，并保持现有数学计算和教学交互不变。

## Why

这是上一轮明确的未完成用户体验缺口，复用已有状态即可形成当天可完成的无障碍 vertical slice，不引入新的业务状态或数据依赖。

## Product Spec

### Problem

模型当前是否包含顶盖只通过视觉样式和图形透明度表达，键盘或读屏学生无法确认当前学习选项。

### Target User and User Story

作为使用键盘或读屏学习表面积的学生，我希望切换“有盖 / 无盖”后能确认当前生效选项，从而把图形和公式对应起来。

### Solution and Scope

- 为“有盖”和“无盖”原生按钮绑定由现有 `hasLid` state 派生的动态 `aria-pressed`。
- 增加组件级回归，覆盖初始状态与切换后的互斥状态。
- 更新 CHANGELOG 和本日报，保留现有视觉 class、表面积计算、SVG 展开图与 `onInteract` 回调。

### Non-goals

- 不修改其他 `CourseMasteryModelC` 模型、题目、评分、进度、路由、认证、Supabase、数据库、PWA 或依赖。
- 不创建测试账号、不发送邮件、不写入真实学习记录。
- 不把未认证的公开入口或 Vercel Ready 状态当作完整登录后验收。

### Edge Cases and Acceptance Criteria

1. 初始“有盖”为 `aria-pressed="true"`，“无盖”为 `false`。
2. 点击“无盖”后两按钮状态互斥更新，现有表面积结果和展开图仍由同一 `hasLid` state 驱动。
3. 定向回归、全量测试、lint、typecheck、生产构建和 `git diff --check` 全部通过。
4. 本地生产预览的受保护课程入口仍跳转 `/login`，无新增 console error。
5. 代码提交、分支推送和 canonical Vercel 生产部署均有实际 readback；账号课程交互、进度写入/回读、重登和跨设备同步没有受控凭据时保持未验收。

## Technical Design

- **Affected modules:** `src/components/CourseMasteryModelC.tsx`、`src/test/courseMasteryModelC.test.tsx`、`CHANGELOG.md`。
- **Approach:** 直接复用已有 `hasLid` boolean，为两个原生按钮增加布尔 `aria-pressed`；不新增抽象、依赖、API、持久化字段或迁移。
- **Compatibility:** 视觉 class、SVG aria-label、表面积公式、尺寸滑块和交互回调保持不变。
- **Security / data:** 仅暴露当前本地 UI 状态，不写入账号或敏感数据。
- **Performance:** 常数级属性读取，无新增渲染循环或网络请求。
- **Rollback:** 回滚提交 `4c013c6`；无数据库或不可逆数据变更。

## Implementation and Bugs Fixed

- 修复长方体表面积模型“有盖 / 无盖”状态只对视觉用户可见的问题。
- 新增 `courseMasteryModelC.test.tsx`，验证初始和切换后的选中语义。

## QA Evidence

- 定向回归：`npm run test -- src/test/courseMasteryModelC.test.tsx`，1 项通过。
- 全量单测：71 个文件、834 项通过。
- `npm run lint`：退出码 0；仅保留仓库既有 Fast Refresh / hooks warnings。
- `npm run typecheck`：通过。
- `npm run build`：通过，Vite 生产构建和 PWA precache 生成完成。
- `git diff --check`：通过。
- 浏览器 QA：本地生产预览 `http://127.0.0.1:4173/math/kp/g5-cuboid-surface` 实际跳转到 `/login`，标题为“语数英综合学习平台”，console 0 errors、1 个已知 Supabase 配置 warning。未提交凭据，未创建或修改真实账户；组件内部状态由定向组件回归覆盖。

## Release Status

`PARTIAL`：代码、工程门禁、分支推送和 canonical 生产部署已完成；受控账号验收仍缺失，且本轮曾因未链接 worktree 意外创建了一个独立 Vercel 项目，无法在无人工确认下删除。

- **发布分支：** `daily-20261115-cuboid-surface-selection-a11y`
- **代码提交：** `4c013c6 fix: expose cuboid surface selection state`
- **远端状态：** 已推送，远端分支与提交一致。
- **部署命令：** `npx --yes vercel link --project math-k6 --scope logsail --yes`；`npx --yes vercel --yes --prod`
- **canonical 部署：** `dpl_Fa1ENzL4HrJQ6JtB6MwGTz7dh9Px`，`READY`，生产别名 [https://math.logsail.lat](https://math.logsail.lat)，部署检查 [Vercel inspect](https://vercel.com/logsail/math-k6/Fa1ENzL4HrJQ6JtB6MwGTz7dh9Px)。
- **回滚目标：** 上一轮 canonical Ready 部署 `dpl_8QpPESkbX6YTuU4QK1JhjaQjGGDY`。
- **意外项目：** `logsail/math-k6-daily-20261112` 曾被 CLI 自动创建并部署为 `dpl_EqcK2w2sLWRa5ShPVhxYmWqmuW8V`；删除会同时删除其部署且不可恢复，Vercel CLI 要求人工确认，故本轮未执行删除。它不承担 canonical 流量，也未被作为本轮正式发布结果。

## Product Impact

长方体表面积模型的视觉选中状态与辅助技术语义现在一致；学生切换“有盖 / 无盖”后可以确认当前模型上下文，降低理解表面积公式时的歧义。

## Known Issues

- 没有受控账号，登录后模型交互、云端进度写入/回读、重登和跨设备同步仍未验收。
- 生产域名受 Vercel Deployment Protection 保护，本轮使用部署 Inspect 的 `READY` readback；未把保护页当作业务页面验收。
- `CourseMasteryModelC` 的圆面积等分、扇形图阶段和天平步骤等其他选择控件仍待独立切片。
- 每日发布专用 skill 文件在当前环境不可读，本轮按仓库 `AGENTS.md`、自动化文本和上一轮报告中的门禁执行。
- 既有 lint warnings 与缺少 Supabase 公共配置 warning 未在本轮扩大处理。

## Backlog and Next Candidates

1. 在授权测试账号下验收“登录 → 进入长方体模型 → 交互 → 完成 → 重登/跨设备回读”。
2. 评估 `CourseMasteryModelC` 的下一个单一模型选择缺口，优先圆面积“8/16/32/64 等分”或扇形图阶段。
3. 取得人工确认后删除误建的 `math-k6-daily-20261112` Vercel 项目，避免留下无用途的独立生产部署。
4. 继续补齐 PWA/iOS 发布前验收矩阵，不把公开入口或 Ready 状态当作完整生产验收。

## Final Status

`PARTIAL`
