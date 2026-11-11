# math-k6 Daily Release Report

## Version

v2026.11.11 · concept model selection accessibility

## Today's Release Goal

让概念模型的分段选择控件向辅助技术明确表达当前生效的数学概念或试验规模。

## Why

概念模型是学生理解单位换算、分数比较、平行与垂直、四边形分类和概率频率的核心探索入口。此前这些控件只用视觉高亮表示当前状态；读屏或纯键盘学生虽然能点击选项，却不能确认模型切换是否真正生效。

## Evidence

- 前一日 `CourseMathModel` 已修复相同的状态缺口，但 `CourseConceptModel` 的五组分段控件仍只有 `is-active` 样式。
- 新增回归在实现前 5/5 失败：所有初始选项均缺少 `aria-pressed`。
- 调用链只有 `InteractivePractice` 的惰性加载入口；改动复用各模型现有 React state，不改变路由、题目、得分或进度事件。

## Product Spec

### Problem

辅助技术无法获得概念模型当前选项，学生难以判断正在比较哪一类关系或当前概率试验次数。

### Target User and User Story

使用键盘或读屏完成三至六年级数学探索的学生，希望每次切换概念模型后，都能知道哪一个选项已生效。

### Solution and Scope

- 为单位换算、分数比较、平行/垂直、平行四边形/梯形和概率试验次数按钮绑定动态 `aria-pressed`。
- 覆盖各组初始选择和切换后的 true/false 互斥状态。

### Non-goals

- 不修改数学公式、题目、评分、进度、路由、认证、Supabase、数据库、PWA 或依赖。
- 不把本轮局部修复宣称为全站控件审计完成。
- 不写入真实账号、学习记录或跨设备同步数据。

### Edge Cases and Acceptance Criteria

1. 五组控件初始各有且仅有一个 `aria-pressed="true"`。
2. 选择任一备选项后，旧项为 `false`、新项为 `true`，原有模型状态计算保持不变。
3. 定向回归、全量测试、lint、typecheck、生产构建与 `git diff --check` 全部通过。
4. 本地受保护课程入口能稳定跳转登录页且没有应用 console error；登录后课程和云同步仅在受控账号下验收。

## Technical Design and Implementation

- 修改 `src/components/CourseConceptModel.tsx`：仅从已有 `mode`、`type`、`trials` state 派生原生布尔 ARIA 属性。
- 新增 `src/test/courseConceptModel.test.tsx`：以参数化回归覆盖五个模型的初始与切换状态。
- 无新增组件、依赖、API、持久化字段、迁移或权限变化；回滚为还原本轮代码提交，无数据库回滚。

## QA

- Red：`npm run test -- src/test/courseConceptModel.test.tsx --pool=threads --maxWorkers=1` 在实现前 5/5 失败，均为缺少 `aria-pressed`。
- 定向回归：同一命令在实现后 5/5 通过；连同相邻数学/几何语义回归共 3 个文件、17 项通过。
- 完整门禁：`npm run lint`（退出 0，只有既有 Fast Refresh/hooks warnings）、`npm run typecheck`、`npm run test -- --pool=threads --maxWorkers=1`（67 文件、830 项）、`npm run build`、`git diff --check` 全部通过。
- 浏览器 QA：本地生产预览 `http://127.0.0.1:4178/math/kp/g4-measurement` 实际重定向到 `/login`；标题“语数英综合学习平台”，console 为 0 errors、1 个缺少 Supabase 公开配置 warning。未提交凭据，因此不把登录后模型交互、进度写入或云同步记为已验收。

## Bugs Fixed

- 修复五组概念模型的当前选中项只对视觉用户可见的问题。

## Release Status

`PARTIAL`。

- 发布分支：`daily-20261111-concept-model-selection-a11y`。
- 实际代码提交：`46ac84f fix: expose concept model selection state`，已推送至 `origin`。
- 部署命令：`CI=1 npx vercel deploy . --prod -y --scope logsail --project math-k6`。
- 生产部署：`dpl_Gs16UMBFDiJ4y76iraoRmUYDSfy9`，目标 `production`、状态 `Ready`，部署 URL 为 `https://math-k6-cte6jmd4g-logsail.vercel.app`，生产别名为 `https://math.logsail.lat`。
- 生产回读：`vercel inspect` 确认项目为 `logsail/math-k6`、别名已绑定；浏览器实际打开 `https://math.logsail.lat/math/kp/g4-measurement` 跳转到 `/login` 且登录表单可用；`vercel curl` 返回当前生产应用 HTML。
- 回滚目标：部署前最后一份已验证 `Ready` 的生产部署 `dpl_4xQrgL8imowbampgH6Ei3U5s215x`。回滚前须先用 `vercel inspect` 复核目标，不涉及数据库操作。
- `PARTIAL` 的唯一产品验收原因：未使用受控账号完成登录后概念模型交互、进度写入、重登和跨设备同步回读。公开入口、Vercel Ready 和 HTML 回读不构成该层验收。

## Product Impact

概念探索的当前状态现在对视觉用户和辅助技术用户一致可读；学生切换比较方式、图形关系或试验次数时，可确认模型已切换，降低学习探索的不确定性。

## Known Issues

- 真实账号下的课程作答、进度回读、重登和跨设备同步仍没有本轮受控验收。
- `CourseFoundationModel`、`CourseAdvancedModel` 和部分应用模型还需独立按用户价值审查，不能因为本轮覆盖概念模型就视作全部完成。
- 既有 lint warnings 未在本轮扩大处理。

## Backlog

1. 完成：概念模型五组分段控件的选中状态语义和回归保护。
2. 保留：受控账号下完成数学/语言课程“登录 → 作答 → 完成 → 重登/跨设备回读”。
3. 保留：依用户价值审查其余探索模型控件及 PWA/iOS 验收矩阵。

## Next Candidates

1. 受控账号下完成数学和语言课程核心路径与云同步验收。
2. 评估基础、进阶与应用模型中仍未声明当前选中状态的控件，保持单一组件级切片。
3. 补齐 PWA/iOS 发布前验收，不把公开入口或部署 READY 当成完整生产验收。

## Final Status

`PARTIAL`：工程门禁、生产部署和公开入口 QA 已通过；受控账号的登录后核心流仍待验收。
