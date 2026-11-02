# math-k6 Daily Release Report

## Version

v2026.09.25 · retry reset mainline release

## Today's Release Goal

将已验证并已生产发布的“再试一次重置全部题型”修复归入 `main`，使后续发布不再丢失这项核心练习保障。

## Why

学生答错后的重新作答是自主学习闭环。修复只停留在发布分支会让 `main` 与线上行为分叉，后续发布可能重新带回已锁定题目的问题。

## Evidence

- 2026-09-24 发布分支已验证：`GameRunner` 只复用题目 ID 时，题型内部的锁定状态会跨重试残留。
- `347b7ce` 为七种现有题型加入同一 `run` key 边界，并有真实的判断题错误 → 重试 → 通过回归。
- 主工作区仍含大量在途课程、鉴权和进度修改；本次从干净 `origin/main` 的 `1fd0d3e` 隔离完成，只带入该修复及其既有发布记录。

## Product Spec

### Problem

发布分支与主干不一致会让已经修复的“可重试”体验在下一次常规发布时回归。

### Target User

答错后需要根据反馈重新作答的小学数学学生。

### User Story

作为学生，我点击“再试一次”后，希望每一种题目都重新可操作，且这个保障不会在后续版本消失。

### Solution and Scope

将已有的最小修复归入 `main` 并重新生产部署：重试时递增 `run`，七种 `GameRunner` 题型以 `questionId:run` 为 React key 重新挂载。

### Non-goals

不改题目、判分、首次作答证据、进度字段、接口、数据库或密码找回功能；不携带发布分支上的无关提交。

### Edge Cases

- 同一题组重试会重新初始化选择、输入、拖拽、排序与计时状态。
- 切题仍由题目 ID 隔离；通过、失败和复习逻辑不变。
- 无真实验收账号时，仅以组件回归和公开页面核验声明本轮结果，不宣称进度已远端回读。

### Acceptance Criteria

1. 判断题错误后重试可再次选择并完成通过。
2. 七种已调度题型均以重试计数建立状态重置边界。
3. 目标提交通过 lint、typecheck、单测、生产构建和 diff 检查，并推送、部署到 `main` 的生产版本。

## Technical Design

- 影响模块：`GameRunner`、一条组件级回归、CHANGELOG 和 2026-09-24 发布记录。
- 无新增依赖、API、迁移、配置或持久化字段；复用已有本地 `run` state。
- 风险控制：隔离工作树只纳入四个相关文件；未读取或写入任何账号、Supabase 数据或凭据。
- 回滚：重新部署上一生产部署 `dpl_5RN27Ki5dcMN2jwNB1ADM17VYtsv`，或将 `main` 回退至 `1fd0d3e` 后部署。

## Product Changes

线上练习的重试承诺现在也由 `main` 持续承载：选择、填空、判断、两类拖拽、时间线和计时题都会重新进入干净状态。

## Implementation

- 提交 `733c8ea`（`fix: preserve retry reset on main`）已推送到 `origin/main`。
- 仅纳入 `CHANGELOG.md`、2026-09-24 发布报告、`GameRunner` 和 `gameRunnerRestart` 回归。

## QA

- 定向回归：`npm run test -- src/test/gameRunnerRestart.test.tsx`，1/1 通过。
- 全量单测：19 文件、567 项通过。
- `npm run lint` 退出码 0；仅既有 Fast Refresh / hooks 警告。
- `npm run typecheck`、`npm run build`、`git diff --check` 均通过。
- Playwright 打开隔离开发构建的 `/login`：登录表单可见，控制台 0 error；未使用账号。

## Bugs Fixed

防止判断、拖拽、排序和计时题在“再试一次”后保留上一次已锁定的本地状态；选择和填空题同时纳入相同边界。

## Release Status

- Git：`733c8ea` 已推送至 `origin/main`。
- 部署：`vercel deploy . --prod --yes --scope logsail`；部署 `dpl_7ivXW851E7ay7VPLvtdGfBVPaLdQ` 为 `READY`。
- 生产：<https://math.logsail.lat>（部署 URL：<https://math-k6-r89jhqtky-logsail.vercel.app>）。
- 初次通过临时 `npx vercel` 部署因上游 `@vercel/elysia@10.0.0` 不存在而失败，未产生发布；改用已登录的本机 Vercel CLI 56.5.0 后成功。

## Product Impact

修复不再是一次性的发布分支差异，而成为后续版本的基线，降低学生在错误反馈后被界面锁死的风险，保证“理解 → 重试 → 验证”的核心闭环持续可用。

## Known Issues

- 未以真实账号验证“登录 → 课程作答 → 进度同步 → 重登回读”；本报告不把公开登录页和组件测试等同于该验收。
- lint 的 Fast Refresh / hooks 警告是既有问题，未在本轮扩大范围处理。

## Backlog

- 完成：将全题型重试重置纳入主干并生产部署。
- 保留：审校每种题型首次错误反馈和重试证据时序。
- 阻塞：获得授权测试账号后，验证课程作答、云端进度、重登与 D1/D7 回读。

## Next Candidates

1. 用授权测试账号完成真实课程与跨会话进度回读。
2. 逐题型审校首次错误反馈是否能指导下一步。
3. 清理原主工作区在途改动，恢复常规可发布基线。

## Final Status

`PARTIAL`：代码、工程门禁、主干推送和生产部署已完成；缺少真实登录后的课程作答与云端进度回读，未满足完整用户链路的 Definition of Done。
