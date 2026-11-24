# math-k6 Daily Release Report

## Version

v2026.11.12 · foundation model selection accessibility

## Product Discovery

- **Target user:** 使用键盘或读屏完成三至六年级数学探索的学生。
- **Core scenario:** 学生进入分数加减模型，在“合并/拿走”之间切换并依据图示理解单位分数的变化。
- **Observed bottleneck:** 基础模型的“合并/拿走”按钮只用视觉 `is-active` 表示当前模式；辅助技术能触发按钮，但无法知道当前数学操作是哪一种。
- **Evidence:** `src/components/CourseFoundationModel.tsx` 的 `FractionAddSub` 复用 `operation` state 驱动结果和样式，却没有原生选中状态语义；最近几轮已在几何、算术和概念模型验证了同类 `aria-pressed` 模式。
- **Candidate directions:** 补齐基础模型选中状态语义（高价值、低风险、可独立发布）；扩展进阶/应用模型（保留后续组件级切片）；使用受控账号验收登录后同步（当前缺少账号，不能假设完成）。

## Today's Release Goal

让分数加减基础模型的“合并/拿走”控件向辅助技术明确表达当前生效操作。

## Product Spec

### Problem

分数加减模型的当前操作只通过视觉高亮表达，键盘或读屏学生无法确认正在理解“合并”还是“拿走”。

### Target User and User Story

作为使用键盘或读屏学习分数加减的学生，我希望切换操作后能确认哪个模式已生效，从而把看到的结果和数学含义对应起来。

### Solution and Scope

- 为“合并”和“拿走”按钮绑定由现有 `operation` state 派生的动态 `aria-pressed`。
- 增加组件级回归，覆盖初始状态和切换后的互斥状态。
- 保留现有公式、数量重置、交互事件、视觉样式和课程路由。

### Non-goals

- 不修改数学公式、题目、评分、进度、路由、认证、Supabase、数据库、PWA 或依赖。
- 不在本轮扩展到进阶、应用模型或全站控件审计。
- 不写入真实账号、学习记录或跨设备同步数据。

### Edge Cases and Acceptance Criteria

1. 初始“合并”唯一为 `aria-pressed="true"`，“拿走”为 `false`。
2. 点击“拿走”后两项状态互斥反转，现有结果和操作重置逻辑保持不变。
3. 定向回归、全量测试、lint、typecheck、生产构建和 `git diff --check` 全部通过。
4. 本地生产预览的受保护课程入口仍跳转 `/login` 且无新增 console error；没有受控账号时，不把登录后课程、进度写入、重登或跨设备回读记为完整验收。

## Technical Design

- **Affected modules:** `src/components/CourseFoundationModel.tsx`、新增 `src/test/courseFoundationModel.test.tsx`。
- **Approach:** 直接复用既有 `operation` state，给两个原生按钮增加布尔 `aria-pressed`；不新增抽象、依赖、API、持久化字段或迁移。
- **Compatibility:** 视觉 class 与 click handler 不变，现有课程模型调用链不变。
- **Rollback:** 还原提交 `805fd10`；生产回滚目标为部署 `dpl_Gs16UMBFDiJ4y76iraoRmUYDSfy9`，不涉及数据库操作。

## Implementation and Bugs Fixed

- 修复分数加减基础模型当前操作只对视觉用户可见的问题。
- 新增组件回归，验证“合并/拿走”的初始与切换状态。

## QA Evidence

- Red：新增回归在实现前因缺少 `aria-pressed` 无法通过；依赖安装后实现后的定向测试通过。
- 定向回归：5 个相关测试文件、24 项通过。
- 全量单测：68 个文件、831 项通过。
- `npm run lint`：退出码 0；仅保留仓库既有 Fast Refresh / hooks warnings。
- `npm run typecheck`：通过。
- `npm run build`：通过，Vite 生产构建和 PWA precache 生成完成。
- `git diff --check`：通过。
- 浏览器 QA：本地生产预览 `http://127.0.0.1:4179/math/kp/g3-fraction-add-sub` 实际跳转到 `/login`，标题“语数英综合学习平台”，console 0 errors、1 个仓库已知的 Supabase 配置 warning。未提交凭据，未创建或修改真实账户。

## Release Status

`PARTIAL`。

- 发布分支：`daily-20261112-foundation-model-selection-a11y`。
- 实际代码提交：`805fd10 fix: expose foundation model selection state`，已推送至 `origin`。
- 部署命令：`CI=1 npx vercel deploy . --prod -y --scope logsail --project math-k6`。
- 生产部署：`dpl_mbgxFYsbFLi9Ct2vaRKz5vupJP6Z`，target `production`、状态 `READY`；部署 URL 为 `https://math-k6-hc01bikzp-logsail.vercel.app`，生产别名为 `https://math.logsail.lat`。
- Vercel inspect：确认项目 `math-k6`、commit `805fd10c6f5c6754b88bdcd0edbbaf4995966765`、别名已绑定。
- 回滚目标：`dpl_Gs16UMBFDiJ4y76iraoRmUYDSfy9`（上一份已验证 Ready 的生产部署）。回滚前须再次用 `vercel inspect` 复核，不涉及数据库操作。
- `PARTIAL` 的唯一产品验收原因：没有受控账号，未完成登录后课程交互、进度写入、重登和跨设备同步回读。公开入口、Vercel Ready 和本地登录页 QA 不构成该层验收。

## Product Impact

分数加减模型的当前操作现在对视觉用户和辅助技术用户一致可读；学生切换“合并/拿走”后能够确认模式已生效，降低探索过程中的不确定性。

## Known Issues

- 真实账号下的课程作答、进度回读、重登和跨设备同步仍没有受控验收。
- `CourseAdvancedModel`、`CourseMasteryModelC` 及部分应用模型仍有未声明选中状态的分段控件，不能因本轮完成基础模型一个控件就视为全部完成。
- 既有 lint warnings 和缺少 Supabase 公开配置 warning 未在本轮扩大处理。

## Backlog and Next Candidates

1. 完成：基础分数加减模型“合并/拿走”选中状态语义与回归保护。
2. 保留：评估进阶、掌握与应用模型中的下一个单一组件级选中状态缺口。
3. 保留：在授权测试账号下完成数学/语言课程“登录 → 作答 → 完成 → 重登/跨设备回读”。
4. 保留：补齐 PWA/iOS 发布前验收矩阵，不把公开入口或部署 READY 当成完整生产验收。

## Final Status

`PARTIAL`：工程门禁、生产部署和公开入口 QA 已完成；受控账号的登录后核心流仍待验收。
