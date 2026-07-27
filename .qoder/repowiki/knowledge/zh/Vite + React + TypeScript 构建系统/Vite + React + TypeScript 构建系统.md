---
kind: build_system
name: Vite + React + TypeScript 构建系统
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - vite.config.ts
    - tsconfig.json
    - tsconfig.app.json
    - tsconfig.node.json
    - src/test/setup.ts
---

本项目采用基于 Vite 的现代前端构建系统，结合 React、TypeScript 和 Tailwind CSS 进行开发。构建流程通过 package.json 中的 npm scripts 统一管理，核心命令包括 dev（开发服务器）、build（类型检查+生产构建）、lint（代码检查）、preview（预览构建产物）以及 test/test:watch（单元测试）。

构建配置集中在 vite.config.ts 中，启用了 React、Tailwind CSS 和 PWA 插件。PWA 配置支持离线缓存，通过 Workbox 缓存静态资源，但排除知识点内容文件（/kp/ 路由）的导航回退，因为这些内容是按需加载的。路径别名 @ 指向 src 目录，便于模块导入。

TypeScript 采用多项目引用模式，根 tsconfig.json 通过 references 引用 tsconfig.app.json（应用代码）和 tsconfig.node.json（Node.js 工具代码），实现增量编译和类型检查分离。两个子配置都启用严格模式选项，包括 noUnusedLocals、noUnusedParameters、erasableSyntaxOnly 等现代 TypeScript 特性。

测试环境基于 Vitest，配置在 vite.config.ts 中，使用 jsdom 作为测试环境，并通过 setup.ts 注入 @testing-library/jest-dom 断言扩展。测试文件位于 src/test/ 目录下。

构建产物为静态网站，无后端服务依赖，部署简单。版本管理通过 package.json 中的 version 字段控制，当前为 0.0.0 的开发版本。