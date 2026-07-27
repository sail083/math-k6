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

## 核心修改路径

- **添加新知识点**：在 `src/content/knowledge-points/` 下创建目录（命名规则 `g{年级}-{主题}`），包含 `meta.json`、`explain.md`、`game.json`，可选 `derivation.json`；然后在 `src/content/index.json` 中注册。
- **添加新游戏题型**：在 `src/components/games/` 新增组件，并在 `GameRunner.tsx` 中注册调度。
- **添加新可视化**：在 `src/visualizations/` 新增组件，并在 `registry.tsx` 中注册。
- **修改路由/页面**：编辑 `src/App.tsx` 和 `src/pages/` 下对应页面。

## 验证命令

```bash
npm run test && npm run build
```

- `npm run test` — 运行 Vitest 单元测试（`vitest run`）
- `npm run build` — TypeScript 类型检查 + Vite 生产构建（`tsc -b && vite build`）
- `npm run lint` — oxlint 代码检查

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
