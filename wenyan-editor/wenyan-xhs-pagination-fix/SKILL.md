---
name: 文言排版器小红书3:4分页问题
description: 修复预览只显示部分内容的问题，需要让所有13页都显示
trigger: 小红书分页 3:4 溢出
---

# 文言排版器小红书3:4分页问题

## 问题描述
- 3:4 比例 1080×1440，content 区域 1361px
- 预览只显示部分内容（如11页，实际可能有13页），内容被截断

## 修复方向
1. **预览**：固定 3:4 高度(1440px)但不截断内容，frame 自适应高度
2. **底部判断**：渲染后检测溢出，把底部元素移到下一页（rebalancePages）
3. **防止无限递归**：限制 rebalancePages 循环次数（最多20次）

## 关键配置
```javascript
const XHS_SIZES = {
  '3:4': { width: 1080, height: 1440, name: '小红书3:4' }
};
const PADDING = 59;
const BOTTOM_MARGIN = 20;
const MAX_CONTENT_H = 1440 - PADDING - BOTTOM_MARGIN; // 1361
```

## 文件位置
- index.html: /opt/data/workspace/Projects/wenyan-editor/templates/xhs/index.html
- main.js: /opt/data/workspace/Projects/wenyan-editor/templates/xhs/js/main.js
- cyber.css: /opt/data/workspace/Projects/wenyan-editor/static/css/cyber.css

## 待完成
用户反馈预览只显示11页，实际有13页内容，需要继续调试 rebalancePages 逻辑确保所有内容都显示