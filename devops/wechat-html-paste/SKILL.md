---
name: wechat-html-paste
description: 微信公众号 HTML 粘贴兼容性技术要点 — 确保复制的 HTML 粘贴到微信编辑器后样式完整保留
version: 1.0.0
author: Hermes Agent
metadata:
  hermes:
    tags: [wechat, html, clipboard, css, compatibility]
---

# 微信公众号 HTML 粘贴兼容性

## 核心原则

微信公众号编辑器对粘贴的 HTML 有严格过滤，但 inline style 支持较完整。

## 三种复制方式对比

| 方式 | MIME 类型 | 粘贴效果 | background-image |
|------|-----------|----------|-----------------|
| `writeText()` | `text/plain` | ❌ 原始 HTML 代码 | 丢失 |
| `execCommand('copy')` + hidden div | `text/html` | ✅ 渲染后富文本 | 可能丢失 |
| `ClipboardItem` | `text/html` | ✅ 渲染后富文本 | ✅ 保留 |

### ❌ 最差：writeText()（纯文本）

```javascript
// 粘贴后显示原始 HTML 代码字符串，完全不可用
navigator.clipboard.writeText(html);
```

### ⚠️ 中等：execCommand + hidden div（富文本，但可能丢 CSS）

```javascript
// 用隐藏 div + selection 复制，MIME 是 text/html，粘贴为渲染内容
// 但浏览器序列化时可能丢弃 background-image 等 CSS 属性
const tempDiv = document.createElement('div');
tempDiv.innerHTML = fullHtml;
tempDiv.style.position = 'fixed';
tempDiv.style.left = '-9999px';
document.body.appendChild(tempDiv);
const range = document.createRange();
range.selectNodeContents(tempDiv);
const selection = window.getSelection();
selection.removeAllRanges();
selection.addRange(range);
document.execCommand('copy');
selection.removeAllRanges();
document.body.removeChild(tempDiv);
```

### ✅ 最佳：ClipboardItem（保留所有 CSS）

```javascript
// 直接写入 text/html MIME，保留 background-image 等完整 CSS
const blob = new Blob([html], { type: 'text/html' });
const item = new ClipboardItem({
  'text/html': blob,
  'text/plain': new Blob([html], { type: 'text/plain' })
});
navigator.clipboard.write([item]);
```

**根因**：`writeText()` 写入的是 `text/plain`，粘贴为纯文本。`execCommand` 通过 selection 复制，MIME 是 `text/html` 但浏览器序列化时会丢弃 `background-image` 等 CSS。`ClipboardItem` 直接写入 `text/html` MIME，保留完整 HTML。

**实际建议**：ClipboardItem 为主，execCommand 做 fallback。`writeText()` 绝对不要用于 HTML 内容。

## CSS 必须 inline

微信会剥掉 `<style>` 标签，所有样式必须写在元素的 `style` 属性里：

```html
<!-- ✅ 正确 -->
<section style="background-image: linear-gradient(...); padding: 20px;">
  <h1 style="color: red;">标题</h1>
</section>

<!-- ❌ 错误 — <style> 会被剥掉 -->
<style>h1 { color: red; }</style>
<h1>标题</h1>
```

## 支持的 CSS 属性（inline style）

| 属性 | 支持 |
|------|------|
| `background-image: linear-gradient(...)` | ✅ |
| `background-color` | ✅ |
| `background-size`, `background-repeat` | ✅ |
| `color`, `font-size`, `font-weight` | ✅ |
| `margin`, `padding`, `border`, `border-radius` | ✅ |
| `box-shadow` | ✅ |
| `position: absolute/fixed` | ❌ |
| `transform`, `animation` | ❌ |
| `<svg>` 内联元素 | ❌（会被剥掉） |
| `<style>` 标签 | ❌（会被剥掉） |

## 复制 HTML 结构模板

参考 xhs.pro 的实现：

```javascript
const fullHtml = `<section style="font-family: ...; line-height: 1.75; font-size: 16px; background-image: linear-gradient(...); background-size: 20px 20px; padding: 20px;">
  <!-- 正文内容，所有样式已 inline -->
  <h1 style="...">标题</h1>
  <p style="...">内容</p>
</section>`;
```

## 从主题 CSS 提取 inline style 的方法

**属性顺序很重要**：`background`（简写）必须在 `background-image` 之前，否则简写会覆盖具体属性。

```javascript
const wenyanMatch = themeCss.match(/#wenyan\\s*\\{([^}]*)\\}/);
if (wenyanMatch) {
  const block = wenyanMatch[1];
  // ⚠️ 顺序: shorthand 在前，specific 在后
  const bgProps = ['background', 'background-color', 'background-image',
                   'background-size', 'background-repeat', 'background-position',
                   'background-attachment', 'padding'];
  for (const prop of bgProps) {
    const re = new RegExp(prop + '\\\\s*:\\\\s*([^;]+);');
    const m = block.match(re);
    if (m) bgInline += prop + ':' + m[1].trim() + ';';
  }
}
```

## 完整的 copyHtml() 实现模式

```javascript
function copyHtml() {
  const html = document.getElementById('wenyan').innerHTML;
  const themeCss = getThemeCss(); // 从主题 CSS 获取

  // 1. 提取背景属性到 inline style
  let bgInline = '';
  const wenyanMatch = themeCss.match(/#wenyan\\s*\\{([^}]*)\\}/);
  if (wenyanMatch) {
    const block = wenyanMatch[1];
    const bgProps = ['background', 'background-color', 'background-image',
                     'background-size', 'background-repeat', 'background-position',
                     'background-attachment', 'padding'];
    for (const prop of bgProps) {
      const re = new RegExp(prop + '\\\\s*:\\\\s*([^;]+);');
      const m = block.match(re);
      if (m) bgInline += prop + ':' + m[1].trim() + ';';
    }
  }

  // 2. 用 <section> 包裹（和 xhs.pro 一样），不带 <style> 标签
  const fullHtml = `<section style="font-family: ...; line-height: 1.75; font-size: 16px;${bgInline}">
${html}
</section>`;

  // 3. ClipboardItem 为主，execCommand 为 fallback
  const blob = new Blob([fullHtml], { type: 'text/html' });
  const item = new ClipboardItem({
    'text/html': blob,
    'text/plain': new Blob([fullHtml], { type: 'text/plain' })
  });
  navigator.clipboard.write([item]).catch(() => {
    // fallback: selection + execCommand（会丢 background-image）
  });
}
```

## 逆向分析其他工具的方法

用 F12 拦截目标工具的剪贴板输出，确认其实现方式：

```javascript
// 覆盖 navigator.clipboard.write 拦截复制内容
const orig = navigator.clipboard.write.bind(navigator.clipboard);
navigator.clipboard.write = function(items) {
  return orig(items).then(() => {
    items[0].getType('text/html').then(blob => blob.text().then(t => {
      console.log('COPIED HTML:', t);
    }));
  });
};
console.log('Interceptor ready — now click copy');
```

## 已知限制

- SVG 内联元素会被微信剥掉
- `<style>` 标签会被剥掉
- `position: absolute/fixed` 不支持
- `transform`、`animation` 不支持
- 百分比单位不稳定，建议用 `px`
