# math-k6 Daily Release Report

## Version

v2026.11.13 · advanced model selection accessibility

## Product Discovery

- **Target user:** 使用键盘或读屏完成三至六年级数学探索的学生。
- **Core scenario:** 学生进入运算定律模型，在“交换 / 结合 / 分配”之间切换并观察等式保持不变。
- **Observed bottleneck:** 当前运算定律按钮只用视觉 `is-active` 表达选中项，辅助技术无法知道生效的是哪一种变形。
- **Evidence:** `src/components/CourseAdvancedModel.tsx` 的 `OperationLaws` 由 `law` state 驱动表达式和样式，但三枚原生按钮没有选中状态语义；前几轮已在数学、概念、几何和基础模型验证了同类 `aria-pressed` 模式。
- **Candidate directions:** 补齐运算定律模型选中状态语义（高价值、低风险、可独立发布）；继续扩展其他模型（保留后续单组件切片）；使用受控账号验收登录后同步（当前缺少账号，不能假设完成）。

## Today's Release Goal

让运算定律模型的“交换 / 结合 / 分配”控件向辅助技术明确表达当前生效选项。

## Product Spec

### Problem

运算定律模型的当前变形只通过视觉高亮表达，键盘或读屏学生无法确认正在理解哪一种运算关系。

### Target User and User Story

作为使用键盘或读屏学习运算定律的学生，我希望切换选项后能确认哪个模型已生效，从而把看到的等式和数学含义对应起来。

### Solution and Scope

- 为“交换”“结合”“分配”按钮绑定由现有 `law` state 派生的动态 `aria-pressed`。
- 增加组件级回归，覆盖初始状态和切换后的互斥状态。
- 保留现有表达式、结果、视觉样式、交互回调和课程路由。

### Non-goals

- 不修改数学公式、题目、评分、进度、路由、认证、Supabase、数据库、PWA 或依赖。
- 不在本轮扩展到其他进阶模型或全站控件审计。
- 不写入真实账号、学习记录或跨设备同步数据。

### Edge Cases and Acceptance Criteria

1. 初始“分配”唯一为 `aria-pressed="true"`，其余两项为 `false`。
2. 点击“交换”或“结合”后，三项状态互斥反转，现有等式结果仍随 `law` 更新。
3. 定向回归、全量测试、lint、typecheck、生产构建和 `git diff --check` 全部通过。
4. 本地生产预览的受保护课程入口仍跳转 `/login` 且无新增 console error；没有受控账号时，不把登录后课程、进度写入、重登或跨设备回读记为完整验收。

## Technical Design

- **Affected modules:** `src/components/CourseAdvancedModel.tsx`、`src/test/courseAdvancedModel.test.tsx`。
- **Approach:** 直接复用既有 `law` state，给三个原生按钮增加布尔 `aria-pressed`；不新增抽象、依赖、API、持久化字段或迁移。
- **Compatibility:** 视觉 class、click handler、表达式计算和模型调用链不变。
- **Rollback:** 还原本轮提交；生产回滚前复核上一份 Ready 部署，不涉及数据库操作。

## Implementation and Bugs Fixed

- 修复运算定律模型当前选项只对视觉用户可见的问题。
- 新增组件回归，验证“交换 / 结合 / 分配”的初始与切换状态。

## QA Evidence

- 定向回归：1 个文件、1 项通过。
- 全量单测：69 个文件、832 项通过。
- `npm run lint`：退出码 0；仅保留仓库既有 Fast Refresh / hooks warnings。
- `npm run typecheck`：通过。
- `npm run build`：通过，Vite 生产构建和 PWA precache 生成完成。
- `git diff --check`：通过。
- 浏览器 QA：本地生产预览访问 `/math/kp/g4-operation-patterns` 实际跳转到 `/login`，标题“语数英综合学习平台”，console 0 errors、1 个仓库已知 Supabase 配置 warning。未提交凭据，未创建或修改真实账户。

## Release Status

`PARTIAL`。

- 发布分支：`daily-20261113-advanced-model-selection-a11y`。
- 实际代码与日报提交：`0992417 fix: expose advanced model selection state`，已推送至 `origin`。
- 部署命令：`CI=1 npx vercel deploy . --prod -y --scope logsail --project math-k6`。
- 生产部署：`dpl_8QpPESkbX6YTuU4QK1JhjaQjGGDY`，target `production`、状态 `READY`；部署 URL 为 `https://math-k6-qjft9pv37-logsail.vercel.app`，生产别名为 `https://math.logsail.lat`。
- Vercel inspect：确认项目 `math-k6`、target 为 production、状态 Ready，别名已绑定。
- 回滚目标：`dpl_mbgxFYsbFLi9Ct2vaRKz5vupJP6Z`（上一份已验证 Ready 的生产部署）。回滚前须再次用 `vercel inspect` 复核，不涉及数据库操作。
- `PARTIAL` 的唯一产品验收原因：没有受控账号，未完成登录后课程交互、进度写入、重登和跨设备同步回读。

## Product Impact

运算定律模型的当前选项现在对视觉用户和辅助技术用户一致可读；学生切换变形后能够确认模型已生效，降低理解运算关系时的不确定性。相比上一版本，math-k6 又完成了一个可复用的数学模型无障碍闭环，提升核心学习路径的可完成性与可测量性。

## Known Issues

- 真实账号下的课程作答、进度回读、重登和跨设备同步仍没有受控验收。
- `ColumnArithmeticLab`、`CourseAdvancedModel` 其他分段模型和 `CourseMasteryModelC` 仍有未声明选中状态的控件，不能因本轮完成一个模型就视为全部完成。
- 既有 lint warnings 和缺少 Supabase 公开配置 warning 未在本轮扩大处理。

## Backlog and Next Candidates

1. 完成：运算定律模型“交换 / 结合 / 分配”选中状态语义与回归保护。
2. 保留：评估下一个单一模型选择缺口，优先 `CourseMasteryModelC` 或 `ColumnArithmeticLab` 中用户核心路径上的控件。
3. 保留：在授权测试账号下完成数学/语言课程“登录 → 作答 → 完成 → 重登/跨设备回读”。
4. 保留：补齐 PWA/iOS 发布前验收矩阵，不把公开入口或部署 READY 当成完整生产验收。

## Final Status

`PARTIAL`：工程门禁和公开入口 QA 已完成；受控账号的登录后核心流仍待验收。
