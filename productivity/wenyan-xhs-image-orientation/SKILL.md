---
name: 文言排版器小红书图片方向实时检测
description: 在文言排版器中添加小红书预览模式，实时检测图片方向并应用对应布局的完整方案
trigger: wenyan 小红书 图片 方向 检测 横版 竖版
tags:
  - wenyan-editor
  - 小红书
  - 图片排版
  - 实时检测
---

# 文言排版器 - 小红书图片方向实时检测与排版优化

## 概述
在文言排版器中添加小红书预览模式，实时检测图片方向（横版/竖版）并应用不同布局。

## 核心功能

### 1. 实时图片方向检测
在编辑内容时自动检测每张图片的方向：

```javascript
// 检测图片方向并应用对应样式
function detectAndApplyImageStyles(container) {
  const imgs = container.querySelectorAll('img');
  
  imgs.forEach((img, idx) => {
    if (img.classList.contains('landscape') || img.classList.contains('portrait')) {
      return;
    }
    
    if (img.complete && img.naturalWidth > 0) {
      applyImageOrientationStyle(img);
    } else {
      img.addEventListener('load', () => applyImageOrientationStyle(img));
      img.addEventListener('error', () => img.classList.add('landscape'));
    }
  });
}
```

### 2. 方向对应 CSS 样式

```css
/* 横版图：全宽堆叠 */
#wenyan img.landscape {
  width: 100% !important;
  height: auto !important;
  display: block !important;
}

/* 竖版图：与文字并排 */
#wenyan img.portrait {
  width: 48% !important;
  height: auto !important;
  float: left !important;
  margin-right: 2% !important;
}

#wenyan img.portrait + * {
  display: inline-block !important;
  width: 50% !important;
  vertical-align: top !important;
}
```

### 3. 简化分页逻辑
核心原则：**放不下就换页，不截断任何内容**

```javascript
// 横版图必须完整放入当前页，否则换页
if (hasLandscapeImg) {
  if (currentH + bH > maxContentH && currentPage.length > 0) {
    pages.push(currentPage.map(b => b.outerHTML).join('\n'));
    currentPage = [block];
    currentH = padding + bH;
    continue;
  }
}

// 普通内容：放不下就换页
if (currentH + bH > maxContentH && currentPage.length > 0) {
  pages.push(currentPage.map(b => b.outerHTML).join('\n'));
  currentPage = [block];
  currentH = padding + bH;
}
```

### 4. CSS 优先级问题
使用 `:where()` 降低优先级，让主题背景图生效：

```javascript
const scaleCss = `
  :where(#wenyan) { font-size: ... !important; line-height: ... !important; }
  :where(#wenyan) img { width: 100% !important; height: auto !important; }
`;
```

### 5. 异步版本控制
防止快速编辑导致旧请求覆盖新内容：

```javascript
let xhsVersion = 0;

async function generateXhsPages() {
  const currentVersion = ++xhsVersion;
  
  if (currentVersion !== xhsVersion) return;
  xhsPages = await splitContentIntoPages(...);
  
  if (currentVersion !== xhsVersion) return;
  // 继续渲染...
}
```

### 6. 预览帧高度修复
确保 scaled 内容不被裁剪：

```javascript
const scale = 270 / width;
content.style.height = (height * scale) + 'px';
content.style.overflow = 'visible';
```

## 文件位置
`/opt/data/workspace/Projects/wenyan-editor/frontend/index.html`

## 下载图片与预览不一致的排查

### 问题描述
下载的图片排版与预览不一致，或尺寸不匹配。

### 排查步骤

1. **不要用预设尺寸**
   - 错误：`htmlToImage.toPng(el, { width: 1080, height: 1440 })`
   - 正确：使用元素实际渲染尺寸，或移除 transform 后用 `offsetWidth/offsetHeight`

2. **transform:scale 导致问题**
   - 预览使用 `transform: scale(0.25)` 缩小显示
   - 下载前临时移除：`el.style.transform = 'none'; el.style.width = '1080px'`
   - 截图后恢复原样式

3. **html2canvas 方案**
   ```javascript
   // 临时移除 scale
   const origTransform = contentEl.style.transform;
   const origWidth = contentEl.style.width;
   contentEl.style.transform = 'none';
   contentEl.style.width = '1080px';
   contentEl.style.overflow = 'visible';
   
   await new Promise(r => setTimeout(r, 50));
   
   const canvas = await html2canvas(contentEl, {
     width: 1080,
     height: contentEl.offsetHeight, // 使用实际内容高度
     scale: 1,
     useCORS: true,
     allowTaint: true,
     backgroundColor: '#ffffff',
   });
   
   // 恢复样式
   contentEl.style.transform = origTransform;
   contentEl.style.width = origWidth;
   ```

4. **高度问题**
   - 固定高度 (1440) 会裁剪超出内容
   - 使用 `offsetHeight` 获取实际内容高度
   - 或设置 `overflow: visible` 让内容完整显示

### 关键经验
- 预览和下载使用相同的渲染逻辑（移除 transform 后都是 1080px 宽度）
- 高度按实际内容，不固定
- html2canvas 比 html-to-image 对 transform 处理更稳定

## 常见问题

1. **背景网格消失**：检查是否用了 `:where()` 降低选择器优先级
2. **图片被截断**：简化分页逻辑，放不下就换页
3. **内容不同步**：添加异步版本控制防止旧请求覆盖
4. **内容被裁剪**：检查 preview frame 的 overflow 和 height 设置
5. **下载与预览不一致**：移除 transform:scale，使用实际渲染尺寸