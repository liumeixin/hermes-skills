---
name: obsidian-wechat-publisher-dev
description: 开发 Obsidian 微信公众号发布插件的关键技术点和踩坑记录
version: 1.0.0
author: Hermes Agent
metadata:
  hermes:
    tags: [obsidian, plugin, wechat, typescript, esbuild]
---

# Obsidian 微信公众号发布插件开发

## 项目路径
`/opt/data/workspace/Projects/obsidian-wechat-publisher/`

## 渲染管线

```
Markdown → Obsidian MarkdownRenderer.render() → DOM
  → cleanObsidianUIElements() 清理 Obsidian UI 控件
  → formatContent() 结构化处理
    ├── 列表 ul/ol/li → 纯 <section> 结构（⚠️ 必须，防公众号还原默认样式）
    ├── 代码块 <pre> → 添加 macOS 窗口按钮（3 个彩色圆点用 <section>+inline style）
    ├── Callout → 内联样式的 section 结构
    └── 内部嵌入图片 → 解析为 <img>
  → ThemeManager.applyTheme() 注入 <style> 标签（预览用）
  → 序列化为 HTML 字符串
  → juice 将 CSS 内联到每个元素的 style 属性
  → 输出（复制到剪贴板 / 发布）
```

## ⚠️ 关键踩坑

### 1. 列表必须转为 `<section>` 结构
公众号会自动还原 `ul/ol/li` 的默认样式，导致主题 CSS 失效。
转换后的 DOM：
```html
<section class="wp-list-section" data-list-type="ordered|unordered">
  <section class="wp-list-item" style="padding-left:{indent}em;line-height:1.8;">
    <section class="wp-list-marker">1. </section>
    <section class="wp-list-content">内容</section>
  </section>
</section>
```
CSS 主题中禁止使用 `ul/ol/li` 选择器，必须用 `.wp-list-section/.wp-list-item/.wp-list-marker`。

### 2. 预览必须包裹 `#wenyan` 容器
`MarkdownRenderer.render()` 输出到普通 div，没有 id。
所有主题 CSS 选择器以 `#wenyan` 开头，所以预览必须手动创建 `<div id="wenyan">` 包裹：
```typescript
const wenyanWrapper = renderEl.createEl('div', { attr: { id: 'wenyan' } });
await MarkdownRenderer.render(app, content, wenyanWrapper, sourcePath, component);
themeManager.applyTheme(wenyanWrapper, 'wp-preview');
```

### 3. esbuild CSS raw loader
将 `.css` 文件作为 string 导入（打包进 main.js），`loaders` 选项在 `context()` API 中无效，必须用插件：
```javascript
const cssRawLoader = {
  name: 'css-raw-loader',
  setup(build) {
    build.onResolve({ filter: /\.css$/ }, args => ({
      path: path.resolve(args.resolveDir, args.path),
    }));
    build.onLoad({ filter: /\.css$/ }, async (args) => ({
      contents: fs.readFileSync(args.path, 'utf8'),
      loader: 'text',
    }));
  },
};
```

### 4. CSS 主题约束
- 禁止：`var(--xxx)`、`::before/::after`、`@media`、`@font-face`、`!important`
- juice `preserveMediaQueries: false` + `preserveFontFaces: false`
- `font-family` 和 `font-size` 被 ThemeManager 的 `!important` 覆盖

### 5. 剪贴板复制
必须用 `ClipboardItem` + `text/html` MIME，不能用 `writeText()`：
```typescript
const clipData = new ClipboardItem({
  'text/html': new Blob([finalHtml], { type: 'text/html' }),
  'text/plain': new Blob([plainText], { type: 'text/plain' }),
});
await navigator.clipboard.write([clipData]);
```

## 维度混搭机制

18 个元素维度，每个可独立指定主题来源。
实现方式：基础主题完整 CSS + 每个覆盖维度从指定主题提取匹配规则追加到末尾（CSS 级联覆盖）。
选择器匹配用 `DIMENSION_SELECTOR_MAP` 常量，按 `}` 分割 CSS 块后匹配选择器关键字。

## 参考项目
- [obsidian-mp-publisher](https://github.com/joeytoday/obsidian-mp-publisher) — 架构参考（AGPL-3.0，不能直接搬运代码）
- wenyan-editor — CSS 主题来源（MIT）
