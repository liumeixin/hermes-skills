---
name: wenyan-xhs-pagination-debug
description: 文言排版器小红书分页问题排查与修复
---

# 文言排版器小红书分页问题排查

## 问题症状（2025-05 更新）

- 横版图自动排到下一页，明明稍微缩放就能放下
- 文字段落太长也被排到下一页  
- 切换到公众号宽度后网格背景太密
- 分页时图片方向检测失效，第一次 doSplit 检测到 0 个横版图

## 根因分析

### 1. 两次 doSplit 机制
分页函数会执行两次：
- 第一次：图片未加载完，无法检测方向（`所有 img: 0`）
- 第二次：图片加载完，正确检测（`横版 img: 5`）

移到下一页的图片在第二次 doSplit 时是第一个元素，offsetTop=0，之前的截断检测逻辑不适用。

### 2. CSS 优先级覆盖背景图
```js
// 问题代码：scaleCss 完全覆盖了 themeCss
const scaleCss = `
  #wenyan { font-size: ...; line-height: ...; }  // 这会覆盖 background-image!
`;
```
themeCss 中的 background-image 被完全覆盖。

### 3. 测量容器中图片没有 class
doSplit 在隐藏的测量容器 (`#wenyan-measure`) 中执行，那里创建的 img 元素是新创建的，没有 `landscape`/`portrait` class。

### 4. 缩放条件太严格
```js
// 问题：缩放比例 <40% 就移到下一页
if (scaleRatio >= 0.4) {
  // 缩放
} else {
  // 移到下一页 ← 导致很多图被错误分页
}
```

## 解决方案（2025-05 更新）

### 1. 使用 :where() 降低优先级
```js
const scaleCss = `
  :where(#wenyan) { font-size: ...; line-height: ...; }
  :where(#wenyan) h1 { ... }
  // ...
`;
```

### 2. 实时检测图片方向并应用样式
在 `renderMarkdown()` 和小红书渲染时调用 `detectAndApplyImageStyles()`：

```js
function detectAndApplyImageStyles(container) {
  const imgs = container.querySelectorAll('img');
  
  imgs.forEach((img, idx) => {
    if (img.classList.contains('landscape') || img.classList.contains('portrait')) {
      return;  // 已有 class 跳过
    }
    
    if (img.complete && img.naturalWidth > 0) {
      applyImageOrientationStyle(img);
    } else {
      img.addEventListener('load', () => {
        applyImageOrientationStyle(img);
      });
      img.addEventListener('error', () => {
        img.classList.add('landscape');  // 失败默认横版
      });
    }
  });
}
```

### 3. detectImageOrientation 添加已存在 class 检查
```js
function detectImageOrientation(container, debug = false) {
  imgs.forEach(img => {
    // 新增：跳过已有 class
    if (img.classList.contains('portrait') || img.classList.contains('landscape')) {
      return;
    }
    // ... 检测逻辑 ...
    
    // 强制重新计算布局
    void img.offsetHeight;
  });
}
```

### 4. 测量容器 CSS 添加 !important
```css
#wenyan-measure img.landscape { 
  max-width:100% !important; 
  height:auto !important; 
  display:block !important; 
}
```

### 5. 添加公众号宽度选项
```js
const XHS_DIMENSIONS = {
  '公众号宽度': { width: 700, height: 1000 },
  '3:4': { width: 1080, height: 1440 },
  '1:1': { width: 440, height: 440 },
};
```

### 6. 强制缩放横版图到当前页剩余空间
```js
if (hasLandscapeImg && targetImg) {
  const remaining = maxContentH - currentH;
  if (remaining > 0) {
    // 强制缩放到剩余空间
    const newHeight = Math.max(remaining, 50);
    // 应用缩放...
    continue;
  }
}
```

### 7. 强制刷新布局
在检测完图片方向后添加：
```js
detectImageOrientation(measureContent, true);
void measureContent.offsetHeight;  // 强制刷新布局
setTimeout(() => { ... }, 200);
```

## 新问题：文字溢出（2026-05 更新）

### 症状
- 每页下面的文字都溢出到页面底部以外
- 分页数量比实际需要的多（4 页显示，内容应该更多）

### 根因：测量高度未考虑渲染缩放

**关键发现**：测量和渲染两阶段的尺寸比例完全不同：

| 阶段 | 容器宽度 | 字体计算 | 实际显示 |
|------|----------|----------|----------|
| 测量 | 1080px | 16px × measureScale | 约 10px |
| 渲染 | 270px | 16px × (1080/440) ≈ 39px，然后 scale(0.25) | 约 10px |

但**图片高度**的问题更严重：
- 测量容器 1080px 宽，图片按 naturalHeight 显示（如 475px）
- 渲染到 270px 卡片时，被 scale(0.25) 缩放，实际显示只有 ~119px
- **测量高度 = 实际渲染高度的 4 倍！**

### 解决方案：分页时使用实际渲染高度

在 doSplit 函数中，把测量高度乘以 renderScale：

```javascript
const renderScale = 270 / pageWidth; // 0.25 for 1080px
const actualBH = bH * renderScale; // 实际渲染高度

// 用 actualBH 替代 bH 进行分页计算
if (currentH + actualBH > maxContentH) {
  pages.push(currentPage.map(b => b.outerHTML).join('\n'));
  currentPage = [block];
  currentH = padding + actualBH;
} else {
  currentPage.push(block);
  currentH += actualBH;
}
```

### 下拉框默认值修复

原默认值是「公众号宽度」(700×1000)，应该是「3:4」(1080×1440)。

```html
<select id="xhsRatio">
  <option value="3:4" selected>3:4 (1080×1440)</option>  <!-- 改为默认 -->
  <option value="公众号宽度">公众号宽度 (700×1000)</option>
  <option value="1:1">1:1 (440×440)</option>
</select>
```

### 调试日志示例

正常工作的日志应该显示：
```
分页设置: pageWidth= 1080 pageHeight= 1440 PADDING= 59 MAX_CONTENT_H= 1263 measureScale= 0.614
图片 block 4 : tag= P height= 475 img.naturalHeight= 475
换页: currentH= 169 bH= 119 maxContentH= 1263  （换页高度应该是 119 左右，不是 475）
=== doSplit，total blocks: 58 所有 img: 5 横版 img: 5
分页结果: 共 5 页
```

注意图片 block 的 height 已经除以缩放比例了。

## 文件位置
- `/opt/data/workspace/Projects/wenyan-editor/frontend/index.html`
- 关键函数：`doSplit()`, `splitContentIntoPages()`, `generateXhsPages()`, `detectAndApplyImageStyles()`, `detectImageOrientation()`

## 相关 CSS 修复
- 公众号预览样式：使用 `:where(#wenyan)` 避免覆盖背景图
- 测量容器样式：为 `.landscape` 添加 `!important`

## 下载与预览不一致问题（2026-05 更新）

### 问题症状
- 预览正常，但下载的图片排版与预览不一致
- htmlToImage 转换时样式丢失

### 尝试过的解决方案

1. **等待图片加载** - 在下载前等待所有 img.onload
2. **强制内联样式** - 用 JS 直接设置 img.style，不依赖 CSS 类
3. **切换到 html2canvas** - 替换 html-to-image 库
4. **移除 transform:scale** - 截图前临时移除 scale，让元素以原始尺寸显示
5. **使用实际渲染尺寸** - 用 offsetWidth/offsetHeight 而非预设值

```javascript
// 截图前临时移除 transform:scale
const origTransform = contentEl.style.transform;
contentEl.style.transform = 'none';
contentEl.style.width = dims.width + 'px';

await new Promise(r => setTimeout(r, 50));

// 使用实际渲染尺寸
const actualWidth = contentEl.offsetWidth;
const actualHeight = contentEl.offsetHeight;

const canvas = await html2canvas(contentEl, {
  width: actualWidth,
  height: actualHeight,
  scale: 1,
  useCORS: true,
  allowTaint: true,
});

// 恢复原始样式
contentEl.style.transform = origTransform;
```

### 核心挑战
- `transform: scale(0.25)` 让 html2canvas/html-to-image 测量尺寸时出错
- 需要在截图前移除 transform，截图后恢复