---
kind: dependency_management
name: npm + Vite 依赖管理体系
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
    - vite.config.ts
---

本项目采用 npm 作为包管理器，通过 package.json 声明依赖，配合 package-lock.json 锁定版本，构建工具链基于 Vite 8。具体实践如下：

1. 依赖声明与分类
- 运行时依赖（dependencies）：react、react-dom、react-markdown、react-router-dom，均为生产环境必需。
- 开发依赖（devDependencies）：包含 TypeScript、Vite、@vitejs/plugin-react、Tailwind CSS、oxlint、vitest、testing-library、jsdom、vite-plugin-pwa 等开发与测试工具。
- 项目标记为 private，避免误发布到 npm。

2. 版本管理策略
- 运行依赖使用 ^ 语义化版本范围（如 react: ^19.2.7），允许小版本升级。
- TypeScript 使用 ~ 精确主版本（~6.0.2），确保类型定义一致性。
- package-lock.json 记录完整依赖树及每个包的 sha512 integrity，保证安装可重现。

3. 构建与插件体系
- vite.config.ts 集中配置 React、Tailwind、PWA 插件，并通过 alias 将 @ 指向 src 目录。
- PWA 通过 vite-plugin-pwa 实现离线缓存，Workbox 配置缓存 js/css/html/图片/json/md 等资源。

4. 脚本命令
- dev/build/lint/preview/test/test:watch 覆盖开发、构建、代码检查、预览和测试全流程。
- build 先执行 tsc -b 进行类型检查，再执行 vite build。

5. 无私有仓库或 vendoring
- 未发现 .npmrc、pnpm-lock.yaml、yarn.lock、go.mod、vendor 目录等，表明未使用私有注册源或本地打包策略。
- 所有依赖均从公共 npm 镜像（package-lock.json 中显示 npmmirror.com）获取。

6. 约束与约定
- 依赖按运行时/开发时严格区分，无 peerDependencies 声明。
- 通过 lockfileVersion 3 的 package-lock.json 强制依赖树锁定，避免不同环境安装差异。
- 测试环境通过 vitest + jsdom 模拟浏览器 DOM，setup.ts 注入 jest-dom 断言扩展。