---
name: obsidian-wechat-plugin-dev
description: 构建 Obsidian 微信公众号发布插件的完整架构和踩坑记录 — Markdown→styled HTML→剪贴板
version: 1.0.0
author: Hermes Agent
metadata:
  hermes:
    tags: [obsidian, plugin, wechat, esbuild, typescript, markdown]
---

# Obsidian 微信公众号插件开发

## 核心架构

```
Obsidian MarkdownRenderer → DOM → 清理 Obsidian UI 元素 → juice CSS 内联 → ClipboardItem
```

### 关键组件

1. **ThemeManager** — 管理内置+本地主题，支持维度混搭（按元素选择不同主题来源）
2. **Converter** — Markdown→HTML：用 `MarkdownRenderer.render()` 渲染，然后清理 Obsidian 特有元素（.internal-link、.copy-code-button、checkbox 等）
3. **CopyManager** — 从预览 DOM 生成内联样式 HTML：clone DOM → 图片转 base64 → 提取 `<style>` CSS → juice 内联 → ClipboardItem
4. **PreviewView** — ItemView 侧边栏，实时预览 + 主题选择 + 复制按钮

### 微信兼容处理清单

- 列表 ul/ol/li → 转为 section + inline style（微信会重置列表样式）
- code block pre → 添加 macOS 风格窗口按钮（三个彩色圆点）
- callout → 转为带内联样式的 section（背景色+左边框+图标）
- 内部嵌入图片 `span.internal-embed` → 转为 `img` 标签
- 内部链接 `.internal-link` → 提取纯文本
- checkbox → 转为 `[x]`/`[ ]` 文本
- 剥离 `.copy-code-button`、`.clickable-icon`、`.popover`、`.tooltip` 等

## esbuild 配置踩坑

### ❌ 错误：`context()` API 不支持 `loaders` 选项

```javascript
// 这样会报错：Invalid option in context() call: "loaders"
const context = await esbuild.context({
  loaders: { '.css': 'text' },  // ← 不行！
});
```

### ✅ 正确：用 plugin 实现 CSS raw loader

```javascript
import fs from 'fs';
import path from 'path';

const cssRawLoader = {
  name: 'css-raw-loader',
  setup(build) {
    build.onResolve({ filter: /\.css$/ }, args => ({
      path: path.resolve(args.resolveDir, args.path),
      pluginData: { raw: true },
    }));
    build.onLoad({ filter: /\.css$/ }, async (args) => ({
      contents: fs.readFileSync(args.path, 'utf8'),
      loader: 'text',
    }));
  },
};

const context = await esbuild.context({
  plugins: [cssRawLoader],
  // ...
});
```

同时需要 `css.d.ts` 声明模块类型：

```typescript
declare module '*.css' {
  const content: string;
  export default content;
}
```

### juice 内联关键配置

```typescript
const { inlineContent } = await import('juice');
html = inlineContent(html, css, {
  applyStyleTags: true,
  removeStyleTags: true,
  preserveMediaQueries: false,
  preserveFontFaces: false,
});
```

## 列表→section 转换（方案 B，已实现）

公众号会自动还原 ul/ol/li 默认样式，必须转为 section 结构：

```
<section class="wp-list-section" data-list-type="ordered|unordered">
  <section class="wp-list-item" style="padding-left:{indent}em">
    <section class="wp-list-marker">1. </section>
    <section class="wp-list-content">内容</section>
  </section>
</section>
```

CSS 主题中的列表选择器需从 `ul/ol/li` 改为 `.wp-list-section/.wp-list-item/.wp-list-marker/.wp-list-content`

### MarkdownRenderer 容器问题（踩坑）

`MarkdownRenderer.render()` 把 markdown 渲染到一个普通 `<div>` 里，没有 `#wenyan` 容器。而所有主题 CSS 选择器都以 `#wenyan` 开头（如 `#wenyan h1`），导致样式不匹配。**解决方法**：渲染前先创建 `<div id="wenyan">` 包裹层。

## 元素级混搭面板（18 维度）

维度列表：页面背景/文字颜色/H1/H2/H3-H6/加粗/引用/行内代码/代码块/无序列表/链接/表格/图片/分割线/段落间距/整体背景。

混搭原理：加载整体主题完整 CSS → 对覆盖维度从指定主题提取匹配规则追加（CSS 级联覆盖）。`dimensionSelectorMap` 在 main.ts 中定义，关联维度名到 CSS 选择器。

## 参考实现

- **obsidian-mp-publisher** (joeytoday, AGPL-3.0) — 最成熟的微信公众号 Obsidian 插件，含 cheerio/juice/图片 base64/微信 API 发布。代码不可直接搬运（AGPL 许可证）
- **wenyan-editor** (liumeixin) — 17 个 CSS 主题 + 维度混搭系统，Flask Web 版
- **obsidian-wechat-publisher** — 本项目的产出，融合两者优点

## 文件结构模板

```
obsidian-wechat-publisher/
├── manifest.json              # Obsidian 插件元数据
├── package.json
├── tsconfig.json
├── esbuild.config.mjs         # 含 CSS raw loader plugin
├── styles.css                 # 插件 UI 样式（用 Obsidian CSS 变量）
├── main.js                    # 构建产物
├── custom/                    # 用户自定义主题目录
└── src/
    ├── main.ts                # Plugin 入口
    ├── types.ts               # 类型定义
    ├── themeManager.ts        # 主题管理（内置+本地+混搭）
    ├── converter.ts           # Markdown→HTML
    ├── copyManager.ts         # 剪贴板管理
    ├── css.d.ts               # CSS 模块声明
    ├── themes/
    │   ├── index.ts           # 主题注册表
    │   └── *.css              # 内置主题
    ├── views/
    │   └── previewView.ts     # 侧边栏预览
    └── settings/
        └── settingsTab.ts     # 设置面板
```

## 构建命令

```bash
npm install
npm run build        # 生产构建
npm run dev          # 开发模式（watch）
```

安装：将 main.js + styles.css + manifest.json 复制到 `.obsidian/plugins/<plugin-id>/`
