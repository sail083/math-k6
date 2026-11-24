# math-k6 Daily Release Report

## Version

v2026.11.07 · language practice progress accessibility

## Today's Release Goal

让语言课程练习的进度条向辅助技术明确播报当前题号，而不只是一个没有上下文的“练习进度”。

## Why

11 月 6 日刚发布语言课程后，数学练习已经有“第 N / M 题”的读屏名称，但语文和英语练习仍只有通用进度条名称。使用屏幕阅读器的学生无法从进度控件判断自己正在完成哪一题，连续答题时需要额外依赖视觉题号。

## Evidence

- 发布基线为 `origin/main` / `191debc`，包含语言课程与 `LessonPractice`。
- `src/pages/LanguageSubjectPage.tsx` 原先将进度条固定标记为 `aria-label="练习进度"`，虽然可视区域显示 `N / M`，辅助技术没有当前题号上下文。
- 语言练习既有回归覆盖通过、失败重练和路由，但没有验证进度条名称随题号更新；本轮新增该回归。
- 主工作区仍有大量未提交在途改动，本轮只在干净的 `origin/main` 隔离工作树实施，并未混入主工作区。

## Product Spec

### Problem

语言课程练习的进度条没有表达当前题号，读屏用户无法可靠判断练习位置。

### Target User and User Story

目标用户是使用屏幕阅读器或其他辅助技术完成语文、英语课程的三至六年级学生。学生希望从进度控件直接知道“第几题 / 共几题”，以便保持连续答题节奏。

### Solution and Scope

- 将语言练习进度条名称改为动态的“练习进度：第 N / M 题”。
- 保留现有可视题号、宽度计算、`aria-valuenow/min/max` 和答题流程。
- 新增首题和进入第二题后的组件回归。

### Non-goals

- 不改变课程内容、答案、评分、解锁、进度保存、认证、Supabase、PWA 或数据库。
- 不新增依赖、组件、持久化字段或网络请求。
- 不把无受控账号条件下的登录后课程浏览写成已验收事实。

### Edge Cases and Acceptance Criteria

1. 首题进度条名称为“练习进度：第 1 / 3 题”，数值为 1。
2. 进入第二题后名称更新为“练习进度：第 2 / 3 题”，数值为 2。
3. 既有语言练习通过、失败、重练和路由回归保持通过。
4. 定向/全量测试、lint、typecheck、build、`git diff --check` 通过。
5. 生产部署状态和 URL 有真实回执，回滚目标可识别。

## Technical Design and Implementation

- 影响模块：`src/pages/LanguageSubjectPage.tsx`、`src/test/languageLearning.test.tsx`、`CHANGELOG.md`。
- 复用已有 `questionIndex` 与 `lesson.questions.length`，仅动态生成原生 ARIA 名称；不改状态模型和课程数据。
- 兼容性、性能和安全风险为静态文本属性级别；没有数据库、迁移、权限或 secret 变更。
- 代码提交：`ec84fa4 fix: name language practice progress`。
- 仅提交了上述 3 个实现/文档文件；未提交构建产物、浏览器快照、密钥或主工作区无关改动。

## QA

- 定向回归：`npm run test -- src/test/languageLearning.test.tsx`，53/53 通过。
- 全量单测：`npm run test`，65 个文件、821 项通过。
- `npm run lint`：退出码 0；保留仓库既有 Fast Refresh/hooks 警告，未扩大范围。
- `npm run typecheck`：通过。
- `npm run build`：通过，Vite 生成生产构建与 PWA service worker。
- `git diff --check`：通过。
- 本地浏览器：生产预览启动成功，打开语言课程直链后安全跳转 `/login`，console 0 errors；因环境没有受控账号，未提交真实登录或课程答案，不把受保护课程 DOM 观察冒充已登录验收。
- 生产回读：Vercel `dpl_418nrBsCRuajsrw7UBcThbKRz4np` 为 `READY`，`vercel curl https://math.logsail.lat` 返回应用 HTML。

## Bugs Fixed

- 语言课程练习进度条从通用名称改为包含当前题号和总题数的动态可访问名称。

## Release Status

`PARTIAL`。

- 已推送分支：`daily-20261107-language-progress-a11y`。
- 生产部署：`dpl_418nrBsCRuajsrw7UBcThbKRz4np`，状态 `READY`。
- 生产 URL：`https://math.logsail.lat`；部署 URL：`https://math-k6-3hent96oz-logsail.vercel.app`。
- 部署命令：`CI=1 npx vercel --prod --yes --scope logsail`。
- 回滚目标：Vercel 上一份已验证的 READY 生产部署，发布前可通过 `vercel inspect` 识别；本次未执行数据库或不可逆操作。
- `PARTIAL` 仅表示缺少受控账号下的登录后语言课程浏览器验收，不表示测试、构建或部署失败。

## Product Impact

语文和英语练习现在与数学练习共享同一条题号语义。读屏学生可以在答题过程中知道当前题目位置，降低连续练习的认知负担；实现不引入 AI、网络或数据风险，属于对核心学习路径的低风险可感知改进。

## Known Issues

- 生产课程入口受认证保护，本轮没有受控账号，因此未验证真实登录后的语言题目交互和屏幕阅读器播报。
- 真实账号跨设备同步、移动端语音和 PWA/iOS 仍按既有发布边界等待受控验收。
- lint 的既有警告未在本轮扩大处理。

## Backlog

1. 完成：语言练习进度条题号的可访问名称与回归保护。
2. 保留：在受控账号下完成语言课程“登录 → 作答 → 完课 → 重登/跨设备回读”验收。
3. 保留：在真实移动设备验收朗读、麦克风和 PWA 更新行为。

## Next Candidates

1. 受控账号下完成语言课程核心路径与云同步验收。
2. 继续审查语言课程结果页的辅助技术语义，优先复用数学练习已验证模式。
3. 评估 PWA 双版本更新和 iOS 主屏幕验收，而不是继续扩大课程数量。

## Final Status

`PARTIAL`
