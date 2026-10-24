# AGENTS.md

## 项目简介

math-k6 是基于 Vite + React 19 + TypeScript 的小学数学（三至六年级）交互式教学单页应用。聚合知识点内容数据、SVG 可视化组件、游戏化练习引擎与学习进度管理，通过 PWA 提供离线学习体验。

## 目录职责映射

| 目录 | 职责 |
|------|------|
| `src/content/knowledge-points/` | 知识点内容数据（meta.json / explain.md / game.json / derivation.json） |
| `src/content/index.json` | 知识点索引清单 |
| `src/components/games/` | 交互式答题游戏组件（选择、填空、判断、拖拽、计时等） |
| `src/components/` | GameRunner 调度中心、DerivationPlayer、KnowledgePoint、Layout |
| `src/visualizations/` | SVG 教学可视化组件库（面积网格、分数饼图、数轴、立体模型等） |
| `src/lib/` | 共享库：类型定义（types.ts）、内容加载（content.ts）、进度管理（progress.ts） |
| `src/pages/` | 页面路由组件（首页、年级页、知识点详情页、进度看板） |
| `src/context/` | React Context（ProgressContext 全局进度状态） |
| `src/test/` | Vitest 单元测试套件 |
| `public/` | 静态资源（favicon、PWA 图标） |
| `supabase/migrations/` | 数据库迁移脚本：登录 RPC 函数定义与权限 grant |

## 核心修改路径

- **添加新知识点**：在 `src/content/knowledge-points/` 下创建目录（命名规则 `g{年级}-{主题}`），包含 `meta.json`、`explain.md`、`game.json`，可选 `derivation.json`；然后在 `src/content/index.json` 中注册。
- **添加新游戏题型**：在 `src/components/games/` 新增组件，并在 `GameRunner.tsx` 中注册调度。
- **添加新可视化**：在 `src/visualizations/` 新增组件，并在 `registry.tsx` 中注册。
- **修改路由/页面**：编辑 `src/App.tsx` 和 `src/pages/` 下对应页面。
- **修改登录/鉴权**：涉及 `src/lib/auth.ts`、`src/context/AuthContext.tsx` 时，必须同步检查 `supabase/migrations/` 中的登录 RPC 与权限 grant，并确认远端 Supabase 应用已应用对应迁移。

## 验证命令

```bash
npm ci --include=dev --no-audit --no-fund
npm run lint
npm run typecheck
npm run test:ci
npm run test:content:ci
npm run build
```

- 使用 `.node-version` 固定 Node.js，使用 `package.json#packageManager` 固定 npm；依赖以 `package-lock.json` 为准，不以本地已有 `node_modules` 代替干净安装。
- `npm run test` — 运行 Vitest 单元测试（`vitest run`）
- `npm run test:ci` — 全量单测，限制 2 个 worker，输出逐例日志、GitHub 注解和 `reports/unit/junit.xml`
- `npm run test:content:ci` — 独立执行数学内容、知识图谱、课程模型与语文/英语回归，输出 `reports/content/junit.xml`；不代替全量单测
- `npm run typecheck` — 独立 TypeScript 类型检查
- `npm run build` — TypeScript 类型检查 + Vite 生产构建（`tsc -b && vite build`）
- `npm run lint` — oxlint 代码检查

GitHub 的 `Code quality` 工作流在 PR、main 提交和 merge queue 上执行以上检查。提交沿用 `ci:` / `fix:` / `docs:` 等仓库惯例；本地 Husky 不能替代 GitHub 检查。提交 PR 后，必须确认最新测试提交的 `CI required` 成功并在交付记录中保留 run 链接；没有 run 证据时标记“等待 GitHub CI 验证”，不得用跳过测试、`continue-on-error` 或删除质量检查来获得通过。CI 只检查代码，不执行部署或数据库迁移。环境复现、失败定位和必需检查配置见 [CI 说明](docs/ci-quality-checks.md)。

## 高风险区域

| 区域 | 风险说明 |
|------|----------|
| `src/lib/types.ts` | 全局类型定义，修改会影响所有组件和内容数据校验 |
| `src/lib/content.ts` | Vite glob 动态加载机制，路径模式变更会导致内容加载失败 |
| `src/lib/progress.ts` | localStorage 进度持久化与解锁逻辑，变更可能导致用户数据丢失 |
| `src/components/GameRunner.tsx` | 题型调度中心，所有游戏组件的入口，修改影响全部练习流程 |
| `src/content/index.json` | 知识点索引，格式错误会导致整个内容系统崩溃 |
| `vite.config.ts` | 构建配置（PWA、Tailwind、路径别名），误改会导致构建失败 |
| `src/visualizations/registry.tsx` | 可视化注册表，derivation.json 通过此表查找组件 |
| `supabase/migrations/` | 迁移未应用会导致登录 RPC 缺失、权限不足，整个鉴权链路不可用；修改后须确认远端 Supabase 已执行对应迁移 |
