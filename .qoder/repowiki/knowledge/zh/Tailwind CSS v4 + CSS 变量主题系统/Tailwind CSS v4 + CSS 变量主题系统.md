---
kind: frontend_style
name: Tailwind CSS v4 + CSS 变量主题系统
category: frontend_style
scope:
    - '**'
source_files:
    - src/index.css
    - package.json
    - vite.config.ts
---

本项目采用 Tailwind CSS v4（通过 `@tailwindcss/vite` 插件集成）作为核心样式方案，结合原生 CSS 自定义属性构建轻量级设计令牌系统。样式入口为 `src/index.css`，通过 `@import "tailwindcss"` 引入 Tailwind 4 的 CSS-first 配置方式，无需额外配置文件。

**设计令牌与主题**：在 `:root` 中定义了四色语义变量——`--color-primary`（#4f46e5 靛蓝）、`--color-success`（#22c55e 绿色）、`--color-warning`（#f59e0b 琥珀）、`--color-danger`（#ef4444 红色），与 PWA manifest 中的 `theme_color` 保持一致，形成统一的品牌色调。

**排版与内容样式**：项目未使用 `@tailwindcss/typography`，而是手动实现了 `.prose` 类来渲染 Markdown 内容，包含 h1-h3、p、ul、li、strong、code、blockquote 等元素的样式定义，确保教学内容可读性。

**响应式与可访问性**：全局启用 `scroll-behavior: smooth` 平滑滚动；SVG 默认 `max-width: 100%; height: auto` 保证可视化组件自适应；通过 `@media (prefers-reduced-motion: reduce)` 尊重用户的减少动态偏好，将动画和过渡时间压缩至 0.01ms。

**工具类约定**：项目中广泛使用 Tailwind 原子类进行布局（flex、grid）、间距（p-[0-9]、m-[0-9]）、颜色（text-slate-400、bg-indigo-600）、圆角（rounded-lg、rounded-full）等；同时提供 `.scrollbar-none` 自定义工具类隐藏滚动条，用于游戏区域等场景。

**字体策略**：body 使用系统字体栈，优先 Apple 系统字体，其次 Windows Segoe UI，最后回退到 PingFang SC、Microsoft YaHei 等中文字体，确保中英文混排效果。

**构建集成**：Vite 配置中通过 `@tailwindcss/vite` 插件启用 Tailwind 4，配合 `vite-plugin-pwa` 实现离线缓存，CSS 与 JS 资源均被 Workbox 缓存策略覆盖。