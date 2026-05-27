---
name: html-screenshot-image-gen
slug: html-screenshot-image-gen
description: |
  用 HTML 模板 + 浏览器截图生成图片，零 API 成本出信息图。
  触发词：「做成信息图」「生成封面」「做一张对比图」「生成数据卡片」「做张图」「信息图」「截图生成」。
  当用户提到生成图片、做张图、信息图、封面图、截图生成时使用。
tags: [html, screenshot, image, cover, infographic]
metadata: {"keywords": ["截图", "信息图", "封面", "HTML模板", "Playwright", "生成图片"]}
---

# HTML 截图出图技能

## 核心价值

**零 API 成本，像素级可控，中文渲染完美。**

适用于：信息图、数据卡片、对比图、社交媒体封面。

## 参考资源

本技能配套以下参考文件（位于 `references/` 目录）：

| 文件 | 用途 |
|------|------|
| `references/quick-style-guide.md` | 快速风格选择指南 |
| `references/playwright-screenshot.py` | Playwright 截图脚本 |

生成图片前建议参考 `references/quick-style-guide.md` 选择合适的风格。

---

把 HTML 模板当"图片生成器"——颜色、字体、布局全部像素级可控，中文渲染完美，完全免费。

工作流只有三步：
1. 把内容注入 HTML 模板，保存到本地
2. 用浏览器渲染 HTML
3. 截图保存

## 模板风格

### 基础风格（功能型，适合信息图/数据卡片）

| 风格 | 配色 | 适用场景 |
|------|------|----------|
| 米色暖系 | 背景 #f5f0e8，强调色 #8b6f47（棕褐） | 公众号配图、教程步骤图、微信群精华摘要 |
| 深色极简 | 背景 #0d0d0d，强调色 #4ade80（荧光绿） | 数据卡片、金句图、朋友圈传播 |
| 双列对比 | 背景 #1a1a2e，左右分栏 | 工具对比、方案对比、优劣势对照 |

### 艺术风格（适合社交媒体封面，推荐默认使用）

| 风格 | 核心技法 | 适用场景 |
|------|---------|---------|
| **毛玻璃 + Mesh Gradient**（推荐） | 深色背景 + 多色径向光斑 + backdrop-filter 毛玻璃卡片 + SVG 噪点纹理 + 浮动光斑装饰 | 小红书/公众号封面、社交媒体传播图 |
| 纯色渐变 + 几何装饰 | 线性渐变 + CSS 几何图形（圆、三角、线条）叠加 | 简约风格封面、品牌宣传 |

**⚠️ 2026-05 经验：纯白卡片 + 简单线性渐变（旧版基础风格）在社交媒体封面上"不够有艺术感"。用户明确要求提升视觉品质。封面类输出应默认使用艺术风格。**

## 触发词 → 模板对照

| 用户说 | 触发场景 | 使用模板 |
|--------|----------|----------|
| 做成信息图 | 步骤/列表可视化 | 米色暖系 |
| 做成数据卡片 | 数字/结论高亮 | 深色极简 |
| 生成封面 | 公众号封面图 | 自定义尺寸模板 |
| 做一张对比图 | 双列风格对比 | Grid 双列模板 |

## 检查点

### 检查点：风格选择前
- [ ] 确认用户需要的图片类型（信息图/数据卡片/对比图/封面）
- [ ] 确认目标平台（微信/小红书/知乎）
- [ ] 如果用户未指定风格，提供 2-3 个推荐选项

### 检查点：内容注入前
- [ ] 确认标题、副标题、内容文字
- [ ] 确认尺寸是否正确（默认 1080×1440）
- [ ] 确认品牌信息（默认"娇姐话AI圈"）

### 检查点：截图前
- [ ] 确认输出路径
- [ ] 确认文件名不与现有文件冲突
- [ ] 等待页面完全加载（800ms）

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

## 错误处理

### HTML 文件生成失败
```
模板文件缺失或损坏
→ 检查 templates/ 目录下的模板文件
→ 如果模板不存在，使用内联模板生成
→ 提供错误信息给用户
```

### Playwright 截图失败
```
浏览器未安装或路径错误
→ 检查 /opt/hermes/.venv/bin/python3 是否存在
→ 如果缺失，提示用户安装 Playwright
→ 提供错误信息给用户
```

### 中文字体显示异常
```
字体回退到系统默认字体
→ 检查 fonts-wqy 是否安装
→ 如果缺失，执行 apt-get install fonts-wqy
→ 使用本地字体而非 Google Fonts
```

### 输出目录不存在
```
/opt/data/cache/documents/ 目录不存在
→ 自动创建目录：mkdir -p /opt/data/cache/documents/
→ 继续执行截图
```

### 截图尺寸不符合要求
```
生成的图片尺寸与预期不符
→ 检查 viewport 设置是否正确
→ 横版：width: 1550/1920, height: 660/1080
→ 竖版：width: 1080, height: 1440/1691
→ 调整后重新截图
```

## Anti-Patterns

**❌ 不要做的事：**
- 不要使用已弃用的 PingFang SC 字体 → 改用 Noto Sans CJK SC 或 WenQuanYi
- 不要跳过检查点直接生成 → 每个检查点都有验证项
- 不要硬编码尺寸 → 使用标准尺寸（微信1550×660 / 小红书1080×1440）
- 不要使用 Google Fonts → 服务器环境加载慢，用本地字体
- 不要在飞书发 markdown 表格 → 用纯文本或 send_feishu_card
- 不要忘记备份 → 新增模板前确认是否覆盖现有文件

## 完成检查点

### CP-Delivery
- [ ] 图片已保存到正确路径
- [ ] 文件名无冲突
- [ ] 尺寸符合平台要求
- [ ] 字体显示正常（无乱码或缺失）
- [ ] 发送到飞书群（如需要）

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

- HTML 模板中的中文字体回退：`'Noto Sans CJK SC', 'WenQuanYi Micro Hei', sans-serif`（已弃用 PingFang SC 等非商用字体，2026-05 切换到 SIL OFL 免费商用字体）
- 截图前等待页面完全加载：`browser_vision` 会等渲染完成
- 输出路径统一用 `/tmp/img-output/` 目录
- 品牌信息默认显示"娇姐话AI圈"，可自定义
- **中文字体**：服务器已安装 `fonts-wqy`（文泉驿微米黑），如遇字体回退问题可 `apt-get install fonts-wqy`
- **Google Fonts**：`@import url()` 在服务器环境可能加载慢，改用本地字体更稳定
- **输出路径**：文章插图/临时文件统一用 `/opt/data/cache/documents/`（不是写作系统目录）

## 优化摘要
- 30/35 → 34/35 (97%)
- [D3] 新增截图尺寸错误处理，新增 Anti-Patterns 章节（6条禁止事项）
- [D4] 新增 CP-Delivery 完成检查点（5项检查）
- [D6] 新增相关技能引用表（cover-templates、playwright-exact-screenshot等）
- 新增版本: 1.0.1, 更新日期: 2026-05-27

## 相关技能引用

| 技能 | 用途 |
|------|------|
| `cover-templates` | 封面风格库管理，87个可复用模板 |
| `design-shi-cover-template` | 封面模板设计流程 |
| `playwright-exact-screenshot` | 用 Playwright 精确尺寸截图 |
| `xhs-wx-cover-template` | 小红书竖版+微信公众号横版封面模板 |

---

## 模板索引

| 模板 | 风格 | 适用场景 | 尺寸 |
|------|------|---------|------|
| warm | 米色暖系 | 信息图、教程步骤图 | 1080px 宽 |
| dark | 深色极简 | 数据卡片、金句图 | 1080px 宽 |
| grid | 双列对比 | 工具对比、方案对比 | 1200px 宽 |
| 毛玻璃 | Mesh Gradient | 社交媒体封面 | 可变 |

---

## 快速参考

1. **信息图** → warm 模板 + 步骤列表
2. **数据卡片** → dark 模板 + 统计数据
3. **对比图** → grid 模板 + 左右列表
4. **封面** → 毛玻璃模板 + 渐变文字

---

---

## 艺术风格模板：毛玻璃 + Mesh Gradient

### 核心 CSS 技法（5 层叠加）

```
第1层：mesh gradient 背景（多色 radial-gradient 叠加）
第2层：SVG 噪点纹理（feTurbulence，opacity 0.03-0.05）
第3层：浮动光斑（圆形 div + filter: blur(50-60px) + 半透明色）
第4层：毛玻璃卡片（backdrop-filter: blur(16-20px) + 半透明背景 + 细边框）
第5层：文字排版（大字标题 + 渐变色高亮 + 分割线引导视线）
```

### 配色方案预设

| 方案名 | 光斑色 | 渐变高亮色 | 适用内容 |
|--------|--------|-----------|---------|
| 科技紫 | #ff6b6b, #4ecdc4, #a29bfe, #fd79a8 | #4ecdc4 → #a8e6cf | NAS/Docker/效率工具 |
| 活力暖 | #ff6b6b, #feca57, #ff9ff3, #f368e0 | #feca57 → #ff9ff3 | 生活/家电/数码 |
| 深海蓝 | #0984e3, #00cec9, #6c5ce7, #74b9ff | #00cec9 → #74b9ff | AI/软件/技术教程 |
| 森林绿 | #00b894, #55efc4, #a29bfe, #fd79a8 | #55efc4 → #a29bfe | 环保/健康/自然 |

### 布局变体

#### 竖版 3:4（小红书，1080×1440）

```
┌─────────────────────┐
│  [标签]      [品牌]  │  ← 顶部栏（margin-bottom: auto 推到底）
│                     │
│  副标题（小字灰）     │
│  大标题（白+渐变色）   │  ← 视觉焦点
│                     │
│  ── 分割线 ──        │
│                     │
│  [毛玻璃卡片1] 功能1  │  ← 功能亮点列表
│  [毛玻璃卡片2] 功能2  │
│  [毛玻璃卡片3] 功能3  │
│                     │
│  作者    #话题标签    │  ← 底部栏
└─────────────────────┘
```

#### 横版 2.35:1（公众号，1080×460）

```
┌──────────────────────────────────────┐
│                                      │
│  [标签]                              │
│  大标题（白+渐变色）   ┌──────────┐  │
│  副标题（小字灰）      │ 毛玻璃   │  │
│                       │ 卡片     │  │
│                       │ 3个亮点  │  │
│  作者                 └──────────┘  │
└──────────────────────────────────────┘
```

### 关键 CSS 属性速查

```css
/* Mesh Gradient 背景 */
background:
  radial-gradient(ellipse at 20% 50%, #ff6b6b55 0%, transparent 50%),
  radial-gradient(ellipse at 80% 20%, #4ecdc455 0%, transparent 50%),
  radial-gradient(ellipse at 50% 80%, #6c5ce755 0%, transparent 50%),
  linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #16213e 100%);

/* SVG 噪点纹理（内联 data URI，无需外部文件） */
background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");

/* 浮动光斑 */
.orb {
  position: absolute; border-radius: 50%;
  filter: blur(50-60px);
  opacity: 0.15-0.3;
}

/* 毛玻璃卡片 */
.glass-card {
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(16-20px);
  -webkit-backdrop-filter: blur(16-20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20-24px;
}

/* 渐变文字 */
.gradient-text {
  background: linear-gradient(135deg, #4ecdc4, #a8e6cf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### 实际案例文件

- 竖版：`/tmp/img-output/xhs-cover-art.html`
- 横版：`/tmp/img-output/wx-cover-art.html`
- 输出目录：`写作系统/配图/`

---

## 模板复用技巧（多平台适配）

### 场景
同一篇文章需要生成多个平台的封面（如公众号横版、小红书竖版、知乎、什么值得买），可以复用同一个模板风格。

### 复用流程
1. **找到参考模板**：从 `/opt/data/hermes/cover-templates/templates-original/` 目录查找已有模板
2. **读取模板结构**：理解 CSS 布局（flex/grid）、尺寸、配色
3. **调整尺寸和内容**：
   - 小红书竖版：1080×1691 或 1080×1440
   - 公众号/知乎横版：1920×1080 或 1550×660
   - 什么值得买：同横版
4. **保持风格一致**：复用相同样式类、配色方案、字体
5. **生成截图**：每个平台单独生成

### 案例（2026-05-26）
- 参考模板：`f9-xhs-nas-vector.html`（小红书竖版，深色终端风格）
- 复用生成：公众号、知乎、什么值得买、小红书 4 个平台封面
- 核心元素复用：橙色强调色 #FF5A1F、终端效果、导航栏、品牌信息

### 输出目录（重要）
- **文章插图/临时文件**：统一存放到 `/opt/data/cache/documents/`
- **正式封面**：可存放到写作系统配图目录

```python
# 示例：复制截图到 cache 目录
terminal('cp <screenshot_path> /opt/data/cache/documents/preview-{平台}-{标题}.png')
```
