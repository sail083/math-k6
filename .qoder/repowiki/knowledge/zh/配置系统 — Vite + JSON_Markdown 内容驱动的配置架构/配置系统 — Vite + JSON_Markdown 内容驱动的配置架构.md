---
kind: configuration_system
name: 配置系统 — Vite + JSON/Markdown 内容驱动的配置架构
category: configuration_system
scope:
    - '**'
source_files:
    - vite.config.ts
    - package.json
    - tsconfig.app.json
    - tsconfig.node.json
    - src/lib/content.ts
    - src/lib/types.ts
    - src/lib/progress.ts
    - src/context/ProgressContext.tsx
    - index.html
---

本项目没有传统意义上的运行时配置文件（如 .env、application.properties、config.yaml 等），而是采用**以数据文件为中心的配置体系**：所有应用行为、内容结构、游戏逻辑均由 `src/content/knowledge-points/*/` 目录下的 JSON 和 Markdown 文件声明式定义，并通过 Vite 的 `import.meta.glob` 在构建期动态加载。具体体现在以下层面：

1. **构建与工具链配置**：集中在 `vite.config.ts`，通过 `defineConfig` 统一注册 React、Tailwind CSS、PWA（`vite-plugin-pwa`）插件，并配置别名 `@` → `./src`、开发服务器 host、Vitest 测试环境（jsdom + setupFiles）。TypeScript 编译配置拆分为 `tsconfig.app.json`（浏览器端 ES2023 + DOM + bundler 模式）与 `tsconfig.node.json`（Node 端 nodenext 模块），两者均启用严格 linting 选项（noUnusedLocals、erasableSyntaxOnly 等）。

2. **内容配置即代码**：`src/lib/content.ts` 使用 `import.meta.glob` 对 `/src/content/knowledge-points/*/meta.json` 进行 eager 加载（仅元数据同步可用），对 `explain.md`、`derivation.json`、`game.json` 进行 lazy 加载（按需请求）。知识点 ID 由路径正则提取，支持按年级/单元排序。`src/lib/types.ts` 定义了完整的类型契约（KnowledgePointMeta、Derivation、GameConfig、ProgressData 等），确保 JSON 内容与 TypeScript 类型严格对齐。

3. **运行时状态配置**：学习进度通过 `src/lib/progress.ts` 管理，使用固定 key `math-k6-progress` 持久化到 localStorage，提供 load/save/markPassed/isUnlocked 等纯函数 API；`src/context/ProgressContext.tsx` 将其封装为 React Context，自动监听变化并持久化，组件内通过 `useProgress()` 钩子访问，未包裹 Provider 时抛出错误。

4. **PWA 与静态资源**：`vite-plugin-pwa` 在构建时生成 manifest（name、short_name、theme_color、icons 等）与 Service Worker，globPatterns 缓存 js/css/html/ico/png/svg/json/md 资源，但显式 denylist 排除 `/kp/` 路由以避免缓存知识点内容。

5. **脚本与依赖配置**：`package.json` 中 scripts 仅包含 dev/build/lint/preview/test/test:watch 五个命令，无环境变量注入；依赖明确区分 runtime（react、react-router-dom、react-markdown）与 devDependencies（vite、vitest、oxlint、tailwindcss 等）。

该设计将“配置”与“内容”合一：新增知识点只需在 `src/content/knowledge-points/` 下添加对应 JSON/Markdown 文件，无需修改任何代码或配置文件，体现了典型的 data-driven 前端架构。