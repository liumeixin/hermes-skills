---
name: wenyan-xhs-debug
title: 文言排版器小红书分页调试记录
description: 文言排版器小红书分页功能的高度测量与渲染不一致问题调试记录
tags: [wenyan-editor, xhs, pagination, debug]
---

# 文言排版器小红书分页调试记录

## 核心问题
测量高度与实际渲染高度不一致

## 关键参数
- 设计宽度 1080px，设计字体 16px
- 渲染时 CSS 放大 2.45x → 字体 39px，然后 transform:scale(0.25) → 视觉字体 ~10px
- 测量时需用 39px 字体（不是 10px），然后除以 scale 得到实际高度

## 公式
```js
sizeScale = pageWidth / 440  // 1080/440 = 2.45
measureFontSize = 16 * sizeScale  // 39px
renderScale = renderWidth / pageWidth  // 270/1080 = 0.25

// 分页测量
blockHeight = measuredHeight / renderScale

// 渲染帧高度
frameHeight = content.offsetHeight * renderScale * 1.1
```

## 当前状态（2026-05-22）
- 预览框页面变长，有大量空白
- 下载图片有一页底部文字被截断
- 待继续调优

---

## 问题：下载图片大小不一致（2026-05-25）

### 问题描述
- 预览框显示正常，但下载的图片有长有短
- 原因：之前使用 `contentEl.offsetHeight`（内容实际高度），导致每页高度不同

### 解决方案
1. 添加 `getMaxXhsPageHeight()` 函数：预先测量所有页面的实际高度，返回最大值
2. 所有下载的图片统一使用这个最大高度

### 代码改动
```js
// 获取所有页面中的最大高度（用于统一下载尺寸）
async function getMaxXhsPageHeight() {
  const dims = getXhsDimensions();
  const scroll = document.getElementById('preview-scroll');
  const cards = scroll.querySelectorAll('.xhs-page-card');
  
  let maxHeight = 0;
  for (const card of cards) {
    // 临时设置样式，获取实际高度
    contentEl.style.transform = 'none';
    contentEl.style.width = dims.width + 'px';
    contentEl.style.overflow = 'visible';
    await new Promise(r => setTimeout(r, 50));
    maxHeight = Math.max(maxHeight, contentEl.offsetHeight);
    // 恢复样式...
  }
  return maxHeight;
}

// downloadXhsPage 和 downloadAllXhsPages 都调用此函数获取统一高度
```

### 效果
- 所有下载的图片高度一致，等于最长页面的实际高度
- 较短的页面底部会有背景空白，但不会裁剪内容