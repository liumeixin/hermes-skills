---
name: html-screenshot-image-gen
description: 用 HTML 模板 + 浏览器截图生成图片，零 API 成本出信息图。触发词：做成信息图、生成封面、做一张对比图、生成数据卡片。当用户提到"生成图片"、"做张图"、"信息图"、"封面图"时使用。
---

# HTML 截图出图技能

## 核心原理

把 HTML 模板当"图片生成器"——颜色、字体、布局全部像素级可控，中文渲染完美，完全免费。

工作流只有三步：
1. 把内容注入 HTML 模板，保存到本地
2. 用浏览器渲染 HTML
3. 截图保存

## 模板风格

| 风格 | 配色 | 适用场景 |
|------|------|----------|
| 米色暖系 | 背景 #f5f0e8，强调色 #8b6f47（棕褐） | 公众号配图、教程步骤图、微信群精华摘要 |
| 深色极简 | 背景 #0d0d0d，强调色 #4ade80（荧光绿） | 数据卡片、金句图、朋友圈传播 |
| 双列对比 | 背景 #1a1a2e，左右分栏 | 工具对比、方案对比、优劣势对照 |

## 触发词 → 模板对照

| 用户说 | 触发场景 | 使用模板 |
|--------|----------|----------|
| 做成信息图 | 步骤/列表可视化 | 米色暖系 |
| 做成数据卡片 | 数字/结论高亮 | 深色极简 |
| 生成封面 | 公众号封面图 | 自定义尺寸模板 |
| 做一张对比图 | 双列风格对比 | Grid 双列模板 |

## 执行流程

### Step 1：生成 HTML 文件

调用 `generate.js` 脚本，传入风格、标题、内容参数：

```javascript
// 使用示例
const { generateHTML } = require('./generate.js');

const html = generateHTML({
  style: 'warm',      // 'warm' | 'dark' | 'grid'
  title: '文章标题',
  content: {
    // 步骤列表（warm 风格）
    steps: ['第一步...', '第二步...', '第三步...'],
    // 或数据统计（dark 风格）
    stats: [{ value: '85%', label: '效率提升' }],
    // 或对比项（grid 风格）
    leftItems: ['优势1', '优势2'],
    rightItems: ['劣势1', '劣势2'],
  },
  outputPath: '/tmp/img-output/card.html'
});
```

### Step 2：浏览器渲染

```javascript
browser_navigate('file:///tmp/img-output/card.html')
```

### Step 3：截图保存

```javascript
browser_vision('截图整个页面，展示完整视觉效果')
```

### Step 4：复制到输出目录

```javascript
terminal('cp <screenshot_path> /tmp/img-output/final.png')
```

## HTML 模板

### 米色暖系模板（warm）

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      background: #f5f0e8;
      padding: 60px;
      font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    }
    .card {
      background: #fffdf8;
      border-radius: 20px;
      padding: 50px;
      box-shadow: 0 4px 30px rgba(0,0,0,0.06);
    }
    .title {
      font-size: 38px;
      font-weight: 800;
      color: #8b6f47;
      margin-bottom: 40px;
      text-align: center;
    }
    .step-list {
      list-style: none;
    }
    .step-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 24px;
      font-size: 22px;
      color: #333;
      line-height: 1.6;
    }
    .step-num {
      background: #8b6f47;
      color: white;
      border-radius: 50%;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 20px;
      margin-right: 20px;
      flex-shrink: 0;
    }
    .step-text {
      flex: 1;
      padding-top: 6px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 16px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1 class="title">{{TITLE}}</h1>
    <ol class="step-list">
      {{STEPS}}
    </ol>
    <div class="footer">{{BRAND}}</div>
  </div>
</body>
</html>
```

### 深色极简模板（dark）

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      background: #0d0d0d;
      padding: 60px;
      font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    }
    .card {
      background: #141414;
      border: 1px solid #2a2a2a;
      border-radius: 16px;
      padding: 56px;
    }
    h1 {
      color: #ffffff;
      font-size: 42px;
      font-weight: 800;
      margin-bottom: 40px;
    }
    h1 span {
      color: #4ade80;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }
    .stat-item {
      text-align: center;
    }
    .stat-value {
      font-size: 56px;
      font-weight: 800;
      color: #4ade80;
      line-height: 1.2;
    }
    .stat-label {
      font-size: 18px;
      color: #888;
      margin-top: 8px;
    }
    .conclusion {
      font-size: 24px;
      color: #ccc;
      line-height: 1.8;
      text-align: center;
      padding: 30px;
      background: #1a1a1a;
      border-radius: 12px;
      border-left: 4px solid #4ade80;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 16px;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>{{TITLE}}</h1>
    {{STATS}}
    {{CONCLUSION}}
    <div class="footer">{{BRAND}}</div>
  </div>
</body>
</html>
```

### 双列对比模板（grid）

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      background: #1a1a2e;
      padding: 50px;
      font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    }
    .card {
      background: #16213e;
      border-radius: 20px;
      padding: 50px;
      overflow: hidden;
    }
    .title {
      font-size: 36px;
      font-weight: 800;
      color: #fff;
      text-align: center;
      margin-bottom: 40px;
    }
    .title span {
      color: #e94560;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .column {
      background: #1a1a2e;
      border-radius: 16px;
      padding: 36px;
    }
    .column.left { border-top: 4px solid #4ade80; }
    .column.right { border-top: 4px solid #e94560; }
    .column-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 24px;
    }
    .column.left .column-title { color: #4ade80; }
    .column.right .column-title { color: #e94560; }
    .item-list {
      list-style: none;
    }
    .item {
      font-size: 20px;
      color: #ccc;
      line-height: 1.8;
      padding: 8px 0;
      border-bottom: 1px solid #2a2a4a;
    }
    .item:last-child { border-bottom: none; }
    .item::before {
      content: '✓ ';
      color: #4ade80;
    }
    .column.right .item::before {
      content: '✗ ';
      color: #e94560;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 16px;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1 class="title">{{TITLE}}</h1>
    <div class="grid">
      <div class="column left">
        <h2 class="column-title">优势</h2>
        <ul class="item-list">{{LEFT_ITEMS}}</ul>
      </div>
      <div class="column right">
        <h2 class="column-title">劣势</h2>
        <ul class="item-list">{{RIGHT_ITEMS}}</ul>
      </div>
    </div>
    <div class="footer">{{BRAND}}</div>
  </div>
</body>
</html>
```

## 生成脚本（generate.js）

脚本负责：
1. 读取模板文件
2. 替换占位符（{{TITLE}}, {{STEPS}}, {{STATS}} 等）
3. 处理不同类型的内容（步骤列表、数据卡片、对比图）
4. 写入 HTML 文件

完整代码见 [generate.js](generate.js)。

## 浏览器截图方案

本技能使用两种截图方式，优先级：

1. **Hermes browser_vision**（推荐）：内置工具，直接截图，无需额外代码
2. **html-to-image 方案**：如果需要在 Node 环境中生成 base64，可集成 `html-to-image` npm 包

```javascript
// 如果用 html-to-image（需 npm install html-to-image）
import * as htmlToImage from 'html-to-image';

const dataUrl = await htmlToImage.toPng(document.getElementById('card'), {
  quality: 1.0,
  pixelRatio: 2,  // 2x 分辨率
  backgroundColor: '#ffffff'
});
```

## 目录结构

```
html-screenshot-image-gen/
├── SKILL.md
├── generate.js          # HTML 生成脚本
└── templates/
    ├── warm.html        # 米色暖系模板
    ├── dark.html        # 深色极简模板
    └── grid.html        # 双列对比模板
```

## 注意事项

- HTML 模板中的中文字体回退：`'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`
- 截图前等待页面完全加载：`browser_vision` 会等渲染完成
- 输出路径统一用 `/tmp/img-output/` 目录
- 品牌信息默认显示"娇姐话AI圈"，可自定义
