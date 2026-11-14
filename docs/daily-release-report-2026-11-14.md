# math-k6 Daily Release Report

## Version

v2026.11.14 · column arithmetic selection accessibility

## Product Discovery

- **Target user:** 使用键盘或读屏完成三至六年级数学探索的学生。
- **Core scenario:** 学生进入竖式计算实验室，在“进位加法 / 退位减法”之间切换，并按步骤理解进位或借位过程。
- **Observed bottleneck:** 当前模式和步骤只用视觉 `is-active` 表达，辅助技术无法确认正在学习的计算类型或步骤。
- **Evidence:** `src/components/ColumnArithmeticLab.tsx` 的 `mode` 与 `step` state 已驱动视觉状态和竖式内容，但模式按钮和步骤按钮没有 `aria-pressed`。
- **Candidate directions:** 补齐竖式实验室的模式与步骤选中语义（高价值、低风险、可独立发布）；继续扩展其他模型（保留后续单组件切片）；使用受控账号验收登录后同步（当前缺少账号和生产权限）。

## Today's Release Goal

让竖式计算实验室的当前计算类型与当前步骤向辅助技术明确表达，并保持现有竖式教学行为不变。

## Product Spec

### Problem

竖式实验室的当前模式和步骤只通过视觉高亮表达，键盘或读屏学生无法确认自己正在学习哪种计算或哪一步。

### Target User and User Story

作为使用键盘或读屏学习竖式计算的学生，我希望切换模式或步骤后能确认当前生效项，从而把解释文字和竖式变化对应起来。

### Solution and Scope

- 为“进位加法”“退位减法”按钮绑定由现有 `mode` state 派生的动态 `aria-pressed`。
- 为第 1 至第 3 步按钮绑定由现有 `step` state 派生的动态 `aria-pressed`。
- 增加组件级回归，覆盖初始状态、步骤切换和模式切换后重置状态。
- 保留现有视觉 class、竖式结果、步骤解释、交互回调和课程路由。

### Non-goals

- 不修改计算公式、题目、评分、进度、路由、认证、Supabase、数据库、PWA 或依赖。
- 不在本轮审计 `CourseMasteryModelC` 或其他模型控件。
- 不写入真实账号、学习记录或跨设备同步数据。

### Edge Cases and Acceptance Criteria

1. 初始“进位加法”和第 1 步唯一为 `aria-pressed="true"`。
2. 点击第 2 步后，步骤状态互斥更新，解释仍显示第 2 步。
3. 切换“退位减法”后，模式状态互斥更新，步骤按现有行为重置到第 1 步。
4. 定向回归、全量测试、lint、typecheck、生产构建和 `git diff --check` 全部通过。
5. 本地生产预览的受保护课程入口仍跳转 `/login` 且无新增 console error；没有受控账号时，不把登录后课程、进度写入、重登或跨设备回读记为完整验收。

## Technical Design

- **Affected modules:** `src/components/ColumnArithmeticLab.tsx`、`src/test/columnArithmeticLab.test.tsx`、`CHANGELOG.md`。
- **Approach:** 直接复用既有 `mode` / `step` state，为原生按钮增加布尔 `aria-pressed`；不新增抽象、依赖、API、持久化字段或迁移。
- **Compatibility:** 视觉 class、`selectMode` 的重置逻辑、`advance`、内容计算和 `onInteract` 调用链不变。
- **Rollback:** 还原本轮代码提交；没有数据库或不可逆数据变更。

## Implementation and Bugs Fixed

- 修复竖式实验模式和步骤当前状态只对视觉用户可见的问题。
- 新增组件回归，验证模式和步骤的初始、切换、重置语义。

## QA Evidence

- 定向回归：`src/test/columnArithmeticLab.test.tsx`，1 项通过。
- 全量单测：70 个文件、833 项通过。
- `npm run lint`：退出码 0；仅保留仓库既有 Fast Refresh / hooks warnings。
- `npm run typecheck`：通过。
- `npm run build`：通过，Vite 生产构建和 PWA precache 生成完成。
- `git diff --check`：通过。
- 浏览器 QA：本地生产预览访问 `/math/kp/g3-add-sub-10000` 实际跳转到 `/login`，标题“语数英综合学习平台”，console 0 errors、1 个仓库已知 Supabase 配置 warning。未提交凭据，未创建或修改真实账户。

## Release Status

`PARTIAL`（代码已提交到隔离分支，生产部署未完成）。

- 发布分支：`daily-20261114-column-lab-selection-a11y`。
- 本地代码提交：`3e71eda fix: expose column lab selection state`。
- 已通过 GitHub 连接创建同内容远端提交：`6a4db55024549c61c2d117562bfb926ff123b535`；远端分支已创建并指向该提交。
- 常规 `git push` 未完成：SSH 返回 `Connection closed by 20.205.243.166 port 22`，HTTPS 返回 `SSL_ERROR_SYSCALL`。
- 生产部署未执行：Vercel 项目读取返回 403，当前连接未授权 `logsail` scope（要求重新授权 team `team_khiztBOsoCnkELsGl4lo7885`）。没有凭据或权限时不绕过授权、不把旧 Ready 部署当成本轮结果。
- 无本轮部署 URL、deployment ID 或新回滚目标；上一轮 Ready 部署仍为历史回滚候选，但未作为本轮发布证明。

## Product Impact

竖式计算实验室的模式和步骤状态现在对视觉用户和辅助技术用户一致可读；学生切换计算类型或步骤后，可以确认当前学习上下文，降低理解进位/借位过程时的不确定性。

## Known Issues

- 本轮未完成生产部署，远端 Vercel scope 授权是当前唯一外部阻塞。
- 没有受控账号，登录后课程交互、进度写入、重登和跨设备同步仍未验收。
- `CourseMasteryModelC` 等其他模型仍有未声明选中状态的控件，不能因本轮完成一个实验室就视为全站完成。
- 既有 lint warnings 和缺少 Supabase 公共配置 warning 未在本轮扩大处理。

## Backlog and Next Candidates

1. 待部署：在 `logsail` Vercel scope 获得授权后，重新验证并发布本轮远端提交。
2. 保留：评估 `CourseMasteryModelC` 中一个单一模型选择缺口，优先长方体“有盖 / 无盖”或圆面积等分控件。
3. 保留：在授权测试账号下完成数学/语言课程“登录 → 作答 → 完成 → 重登/跨设备回读”。
4. 保留：补齐 PWA/iOS 发布前验收矩阵，不把公开入口或部署 READY 当成完整生产验收。

## Final Status

`PARTIAL`：代码、测试和本地浏览器边界已完成；Git 常规推送和 Vercel 生产部署受外部网络/权限阻塞，受控账号验收仍待完成。
