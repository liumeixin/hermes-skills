---
name: wenyan-editor-pagination-fix
description: 修复文言排版器小红书分页文字截断问题
tags: [wenyan-editor, pagination, xiaohongshu]
---

# wenyan-editor 分页截断问题排查

## 问题
小红书分页时文字被截断，即使预留了底部空间也不起作用。

## 2025-05-21 更新：分辨率改为 1080×1440

小红书标准分辨率：
- 3:4 竖版：1080×1440 px（之前是 440×586）

修改点：
```javascript
// XHS_DIMENSIONS
'3:4': { width: 1080, height: 1440 },

// CSS 预览尺寸（缩放显示）
.xhs-page-content {
  width: 270px; height: 360px;  // 预览用
  transform: scale(0.25);       // 1080 * 0.25 = 270
}

// 渲染时 padding 计算基于 pageWidth
const PADDING = Math.round(pageWidth * 0.055); // ~59px for 1080px
```

## 根因（2024年发现）

1. **CSS 不一致**：测量容器和渲染容器的 `box-sizing` 不同
2. **BOTTOM_MARGIN 不对称**：底部预留过大，与顶部不对称
3. **htmlToImage 尺寸错误**：使用固定 dims.height 而非实际高度

## 解决方案

### 1. 确保测量容器的样式与渲染页面完全一致

```javascript
const measureStyle = document.createElement('style');
measureStyle.textContent = themeCss + `
  #wenyan-measure { 
    max-width:${pageWidth}px;
    margin:0 auto;
    padding:${PADDING}px;
    box-sizing:border-box;
  }
  #wenyan-measure img { max-width:100%; height:auto; display:block; }
  #wenyan-measure pre { white-space: pre-wrap !important; word-break: break-all !important; }
  #wenyan-measure table { width: 100% !important; table-layout: fixed !important; word-break: break-all !important; }
`;
```

关键点：
- **`box-sizing: border-box`** 必须加，否则测量和渲染高度不一致
- `max-width`, `margin`, `padding` 必须一致
- `img`, `pre`, `table` 等元素样式必须一致
- 测量时用 `#wenyan-measure` 前缀

### 2. BOTTOM_MARGIN 与 PADDING 不对称

底部预留应小于顶部，避免内容被过早分页：
- `PADDING` = pageWidth * 0.055（顶部，约 59px）
- `BOTTOM_MARGIN` = 20px（底部，保持紧凑）
- `MAX_CONTENT_H` = pageHeight - PADDING - BOTTOM_MARGIN

```javascript
const PADDING = Math.round(pageWidth * 0.055);
const BOTTOM_MARGIN = 20; // 底部预留调小，避免内容被过早分页
const MAX_CONTENT_H = pageHeight - PADDING - BOTTOM_MARGIN;
```

### 3. 下载时必须使用固定页面高度

这是 3:4 页面溢出的根因！下载图片时不能使用动态计算的内容高度，必须用固定的页面尺寸。

```javascript
// ❌ 错误：使用动态计算的最大高度，导致页面变长
const maxHeight = await getMaxXhsPageHeight();
const pageHeight = maxHeight;

// ✅ 正确：使用固定的页面尺寸
const pageWidth = dims.width;   // 1080px
const pageHeight = dims.height; // 1440px（固定）
```

```javascript
const contentEl = cards[pageIndex].querySelector('.xhs-page-content');
const dataUrl = await htmlToImage.toPng(contentEl, {
  width: dims.width,
  height: dims.height,  // 使用固定页面高度，截断超出的内容
  pixelRatio: 1,
  cacheBust: true,
  skipAutoScale: true,
  style: { transform: 'none', transformOrigin: 'top left' },
});
```

### 4. 渲染时保持 overflow:visible

```javascript
requestAnimationFrame(() => {
  content.style.overflow = 'visible';
});
```

## 分页逻辑

按 HTML block（H1、P、blockquote、pre 等）分页，每个 block 作为整体放到一页。如果 block 本身超高则会截断。

增大分辨率后（1080×1440），每个 block  一般不会超高。

## 2025-05 新问题：横版图分页缩放

### 问题表现
- 横版图片放不下时直接移到下一页，没有尝试缩放
- 分页时设置的 height 样式在渲染时被 CSS 覆盖
- 移到新页面的横版图没有被缩放处理

### 根因分析
1. **CSS 优先级问题**：`#wenyan img { height: auto !important; }` 会覆盖内联 style
2. **分页逻辑缺陷**：只有当前页最后一个 block 被截断时才缩放，其他情况直接分页
3. **新页面横版图**：移到新页面后是第一个元素（offsetTop=0），不会被截断检测处理

### 解决方案

#### 1. 放不下时先尝试缩放横版图
```javascript
// 放不下就分页
if (currentH + bH > maxContentH && currentPage.length > 0) {
  // 如果是横版图，尝试缩放后放入当前页
  if (hasLandscapeImg && targetImg) {
    const overflow = currentH + bH - maxContentH;
    const scaleRatio = 1 - (overflow / bH);
    
    if (scaleRatio >= 0.4) {
      // 缩放后能放入当前页
      const newHeight = Math.floor(bH * scaleRatio);
      targetImg.style.setProperty('height', newHeight + 'px', 'important');
      targetImg.style.setProperty('object-fit', 'contain', 'important');
      block.style.setProperty('height', newHeight + 'px', 'important');
      currentPage.push(block);
      currentH += newHeight;
      continue;
    }
  }
}
```

#### 2. 新页面的超高横版图缩放
```javascript
// 超高元素单独一页
if (bH > maxContentH) {
  // 如果是横版图，缩放到页面大小
  if (hasLandscapeImg && targetImg) {
    targetImg.style.setProperty('height', maxContentH + 'px', 'important');
    targetImg.style.setProperty('object-fit', 'contain', 'important');
    block.style.setProperty('height', maxContentH + 'px', 'important');
    bH = maxContentH;
  }
}

// 移到下一页时
if (currentH + bH > maxContentH && currentPage.length > 0) {
  // ... 缩放尝试 ...
  
  // 分页后，如果是横版图且超高，需要缩放
  if (hasLandscapeImg && targetImg && bH > maxContentH) {
    targetImg.style.setProperty('height', maxContentH + 'px', 'important');
    targetImg.style.setProperty('object-fit', 'contain', 'important');
    block.style.setProperty('height', maxContentH + 'px', 'important');
    currentH = padding + maxContentH;
  }
}
```

#### 3. 渲染后加强缩放（保险措施）
```javascript
function applyLandscapeScaling(container, pageWidth, pageHeight, padding) {
  const MAX_CONTENT_H = pageHeight - padding * 2;
  const blocks = Array.from(container.children);
  
  blocks.forEach(block => {
    const imgs = block.querySelectorAll('img');
    if (imgs.length === 0) return;
    
    const img = imgs[0];
    
    // 优先检查分页阶段是否已设置内联 height，如有则强制加 !important
    if (img.style.height && !img.style.height.includes('important')) {
      img.style.setProperty('height', img.style.height, 'important');
      return;
    }
    // ... 重新检测截断并缩放 ...
  });
}

// 渲染后调用
setTimeout(() => {
  applyLandscapeScaling(wenyanDiv, width, height, PADDING);
}, 50);
```

## 2025-05 新问题：主题背景丢失

### 问题表现
小红书排版后，主题的网格背景（background-image）消失了。

### 根因
scaleCss 使用 `#wenyan { ... }` 选择器会**完全覆盖** themeCss 中 `#wenyan` 的所有样式，包括 background-image。

### 解决方案
使用 `:where()` 降低选择器优先级，让 themeCss 的 background-image 能够生效：

```javascript
const scaleCss = `
  :where(#wenyan) { font-size: ${size}px !important; line-height: 1.6 !important; }
  :where(#wenyan) h1 { font-size: ... }
  :where(#wenyan) p { margin: ... }
  // ... 其他选择器也用 :where() ...
`;
```

## 2025-05-27 更新：预览和下载比例不一致

### 问题表现
下载的页面是预览页面的一部分，上下被截断。预览显示正常但下载不对。

### 根因
1. **预览问题**：预览时使用内容实际高度作为 frame 高度，导致各页面高度不一致
2. **下载问题**：html2canvas 按 contentEl 实际高度截取，而非固定的 dims.height
3. **内容溢出**：没有统一使用固定页面高度 + overflow:hidden

### 最终解决方案

#### 1. 预览时使用固定高度 + overflow:hidden（关键！）

```javascript
// 生成预览卡片时
const scale = 270 / width; // 缩放比例 (0.25 for 1080px)

const content = document.createElement('div');
content.className = 'xhs-page-content';
// 必须设置固定宽高，overflow: hidden 隐藏超出部分
content.style.width = width + 'px';
content.style.height = height + 'px';   // 固定高度，如 1440px
content.style.overflow = 'hidden';       // 关键：隐藏超出部分
content.style.transform = `scale(${scale})`;
content.style.transformOrigin = 'top left';

// frame 使用固定高度比例
requestAnimationFrame(() => {
  const fixedHeight = height * scale;   // 如 1440 * 0.25 = 360px
  frame.style.height = fixedHeight + 'px';
});
```

#### 2. 下载时也必须设置固定高度

```javascript
const origHeight = contentEl.style.height;
const origOverflow = contentEl.style.overflow;

// 下载前设置固定高度
contentEl.style.height = dims.height + 'px';   // 1440px
contentEl.style.overflow = 'hidden';

const canvas = await html2canvas(contentEl, {
  width: dims.width,
  height: dims.height,     // 固定页面尺寸，而非动态 maxHeight
  scale: 1,
  useCORS: true,
  allowTaint: true,
  backgroundColor: '#ffffff',
});

// 恢复
contentEl.style.height = origHeight;
contentEl.style.overflow = origOverflow;
```

---

## 2025-05-27 重大更新：测量与渲染高度不一致问题

### 核心发现：测量阶段图片未加载导致高度计算错误

**调试日志分析：**
```
第一次分页（图片未加载，无 landscape class）：
  block 0-4: currentH 逐渐增加到 633
  但突然出现: currentH=1194 + actualBH=195 = 1389 > 1361 → 错误换页

第二次分页（图片已加载，全部是 landscape class）：
  所有图片都有 landscape class
  分页结果完全不同
```

**根因：**
1. 测量容器中的图片在测量时未加载完成
2. 测量阶段使用默认的 small 尺寸（如 20x20）
3. 渲染阶段图片加载后高度变大（如 500px+）
4. 测量时计算的分页与实际渲染完全不一致

### 最终解决方案：动态高度策略

不再依赖测量阶段的分页结果，改为渲染后动态调整：

#### 1. 预览时动态调整高度
```javascript
// 预览卡片生成时设置固定高度
const content = document.createElement('div');
content.style.width = width + 'px';
content.style.height = height + 'px';     // 固定 1440px
content.style.overflow = 'hidden';

// frame 高度先设为固定值
requestAnimationFrame(() => {
  const fixedHeight = height * scale;   // 360px
  frame.style.height = fixedHeight + 'px';
  
  // 如果内容溢出，动态增加高度
  const contentHeight = content.offsetHeight;
  if (contentHeight > height) {
    frame.style.height = contentHeight * scale;
  }
});
```

#### 2. 下载时使用实际内容高度
```javascript
// 下载前让内容自然流出
contentEl.style.height = 'auto';
contentEl.style.overflow = 'visible';

// 获取实际高度后截图
await new Promise(r => setTimeout(r, 50));
const actualHeight = Math.max(contentEl.offsetHeight, height);

const canvas = await html2canvas(contentEl, {
  width: dims.width,
  height: actualHeight,  // 使用实际内容高度
  // ...
});
```

### 经验总结

**不要依赖测量阶段的分页结果来决定页面高度**，因为：
1. 图片在测量时可能未加载
2. 字体渲染在测量和渲染阶段可能有差异
3. 动态内容（如下拉菜单、折叠区域）会导致高度变化

**正确的做法：**
- 预览：使用固定页面高度 + overflow:hidden
- 下载：使用实际内容高度
- 始终保持预览和下载的比例一致

---

## 2026-05-27 重大重写：smartSplit 架构

### 旧方案的问题
1. `doSplit` 只做 block 级换页，不处理图片缩放和文字切分
2. 测量容器和渲染容器的 CSS 不一致（`box-sizing`、字体大小等）
3. `rebalancePages` 后处理方案复杂且不稳定
4. 下载和预览使用不同的捕获方式（html2canvas vs htmlToImage）

### 新方案：smartSplit 架构

核心思路：**先渲染 → 测量实际高度 → 智能分页 → 固定尺寸预览/下载**

#### 1. 分页参数
```javascript
const PADDING = Math.round(pageWidth * 0.055);  // ~59px for 1080px
const USABLE_H = pageHeight - PADDING * 2;       // 1440 - 118 = 1322px
```

#### 2. smartSplit 算法（scrollHeight 版本）
```javascript
function smartSplit(blocks, pageWidth, usableH, padding, measureEl) {
  // 创建测试元素，模拟 #wenyan 的样式
  const testEl = document.createElement('div');
  testEl.style.cssText = `...same styles as #wenyan...`;
  measureEl.parentNode.appendChild(testEl);

  const PAGE_H = usableH + padding * 2; // = pageHeight

  function measurePage() {
    testEl.innerHTML = pageHtml.join('\n');
    return testEl.scrollHeight; // 包含 margin collapsing 的真实高度
  }

  for each block:
    pageHtml.push(block.outerHTML)
    if measurePage() <= PAGE_H → fits, keep
    else → remove, handle oversized (scale image / split text / new page)
}
```
关键改进：用 `scrollHeight` 测量整个页面的累积高度，自动处理 margin collapsing。

#### 3. 图片缩放 (scaleBlockToFit)
- 计算 `scaleW = 可用宽度 / 原始宽度`
- 计算 `scaleH = 可用高度 / 原始高度`
- 取 `min(scaleW, scaleH, 1)` — 不放大
- 用 `style.setProperty('height', ..., 'important')` 覆盖 CSS

#### 4. 文字切分 (splitBlock)
- 优先按子节点边界切分（从后往前逐个移除，找到高度合适的分割点）
- 单文本节点时：二分搜索文字长度，找到合适断点（优先在标点处断开）

#### 5. 预览/下载一致性
```javascript
// 预览：固定 1080×1440 + overflow:hidden + transform:scale(0.25)
// 下载：临时移除 scale，用 html2canvas 捕获 1080×1440，然后恢复
contentEl.style.transform = 'none';
contentEl.style.overflow = 'visible';
const canvas = await html2canvas(contentEl, {
  width: 1080, height: 1440, scale: 1, ...
});
contentEl.style.transform = `scale(${scale})`;
contentEl.style.overflow = 'hidden';
```

### 配置
```javascript
const XHS_DIMENSIONS = { '3:4': { width: 1080, height: 1440 } };
```

### 关键 CSS
```css
.xhs-page-frame { width: 270px; height: 360px; overflow: hidden; }
.xhs-page-content {
  width: 1080px; height: 1440px;
  transform: scale(0.25); transform-origin: top left;
  overflow: hidden;
}
```

### 字体缩放（手机阅读优化）
主题 CSS 是按 ~440px 设计的，1080px 画布需要放大。
基准比例 `s = pageWidth / 360`（1080px 时 s=3.0），通过 `:where(#wenyan)` + `!important` 覆盖：
```javascript
function getXhsScaleCss(pageWidth) {
  const s = pageWidth / 360; // 3.0 for 1080px
  return `
    :where(#wenyan) { font-size: ${Math.round(16*s)}px !important; line-height: 1.65 !important; }
    :where(#wenyan) h1 { font-size: ${Math.round(28*s)}px !important; }
    :where(#wenyan) h2 { font-size: ${Math.round(22*s)}px !important; }
    :where(#wenyan) h3 { font-size: ${Math.round(18*s)}px !important; }
    :where(#wenyan) p { margin: ${Math.round(12*s)}px 0 !important; }
    ...
  `;
}
```
- 测量容器和预览容器都要加 scaleCss，确保分页测量与渲染一致
- 手机上 1080px 图全屏 → 正文 48px ≈ 16px CSS 等效 → 阅读舒适