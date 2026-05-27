---
name: wenyan-editor-troubleshooting
description: 文言排版器故障排查 - 路由问题、图片加载、分页问题
tags: [wenyan-editor, flask, css, pagination]
---

# 文言排版器 (wenyan-editor) 故障排查指南

## 路由问题

### 问题：/api/proxy-image 返回 404
**原因**：Flask 路由顺序问题，`/<path:filename>` catch-all 路由在具体路由之前定义，导致拦截了 `/api/proxy-image`

**解决**：确保 `/api/proxy-image` 路由定义在 `/<path:filename>` 之前

```python
# 正确顺序
@app.route('/api/proxy-image')
def proxy_image():
    ...

@app.route('/<path:filename>')
def serve_frontend(filename):
    ...
```

## 图片加载问题

### 问题：OSS 图片部分加载失败
**原因**：URL 中包含空格等特殊字符（如 `Pasted image 20260520.png`），未编码就放入 query string

**解决**：使用 `encodeURIComponent()` 编码 URL

```javascript
result = result.replace(
  /src="(https?:\/\/[^\"]+\.(?:png|jpg|jpeg|gif|webp|bmp|svg))"/gi,
  (match, url) => `src="/api/proxy-image?url=${encodeURIComponent(url)}"`
);
```

## 小红书分页问题

### 问题：底部文字被截断
**解决**：分页计算时预留底部空间

```javascript
const BOTTOM_MARGIN = 60; // 预留底部空间给小红书装饰
const MAX_CONTENT_H = pageHeight - PADDING * 2 - BOTTOM_MARGIN;
```

### 问题：图片在分页处被截断
**原因**：图片刚好在分页处，上方文字占用部分空间后，图片被截断

**解决**：简单方案 - 图片直接放到下一页，不尝试缩放（缩放逻辑复杂且有 bug）

```javascript
// 更可靠地检测图片元素（包括 img、picture、figure 等）
const isImage = block.tagName.toLowerCase() === 'img' || 
                (block.querySelector && block.querySelector('img') !== null);

// 图片直接放到下一页，避免截断
if (isImage && currentPage.length > 0) {
  pages.push(currentPage.map(b => b.outerHTML).join('\n'));
  currentPage = [block];
  currentH = padding + bH;
  continue;
}
```

**注意**：曾尝试根据可见比例缩放图片（可见部分 >= 50% 则缩放，< 50% 则移下一页），但 scale 计算有误差且不同页面测量不一致，最终放弃此方案。

### 问题：渲染后高度和测量高度不一致，内容被截断

**原因**：分页测量时每个 block 高度单独测量正常，但拼接后的 HTML 重新渲染时 margin/padding 累积，导致实际高度大于测量高度。

**排查方法**：在 `doSplit` 函数中添加调试日志，打印每个 block 的 tag 和高度：
```javascript
function doSplit(blocks, padding, maxContentH) {
  const debugLogs = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const bH = block.offsetHeight;
    debugLogs.push(`block${i}: tag=${block.tagName}, h=${bH}`);
    // ... 分页逻辑
  }
  console.log('分页调试:', debugLogs.join('\n'), `\n最终分页: ${pages.length}页`);
  return pages;
}
```

**解决**：添加自动截断逻辑
1. 测量和渲染的 CSS 必须完全一致（添加 `box-sizing:border-box`）
2. 渲染后检测实际高度，超出则设置 `overflow:hidden` + 强制限制高度
3. htmlToImage 截图时使用实际内容高度而非固定页面高度

```javascript
// 渲染后检测溢出
requestAnimationFrame(() => {
  const actualH = wenyanDiv.offsetHeight;
  const BOTTOM_MARGIN = 120;
  const maxH = height - Math.round(width * 0.055) * 2 - BOTTOM_MARGIN;
  if (actualH > maxH) {
    // 内容超限，自动截断
    content.style.overflow = 'hidden';
    content.style.height = maxH + 'px';
  }
});

// htmlToImage 使用实际高度
const actualHeight = parseInt(contentEl.style.height) || dims.height;
await htmlToImage.toPng(contentEl, {
  width: dims.width,
  height: actualHeight,
  // ...
});
```

## 文件位置
- 后端：`/opt/data/workspace/Projects/wenyan-editor/backend/app.py`
- 前端：`/opt/data/workspace/Projects/wenyan-editor/frontend/index.html`
- 单页版：`/opt/data/workspace/Projects/wenyan-editor/frontend/standalone.html`

## 调试技巧
1. 浏览器 F12 → Network 查看请求详情
2. 查看控制台 JavaScript 错误
3. 确认容器已重启让代码生效
4. 在需要排查的函数中添加 console.log 跟踪执行流程