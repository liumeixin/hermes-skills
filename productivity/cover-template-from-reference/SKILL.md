---
name: cover-template-from-reference
description: 根据设计稿参考图反推生成自媒体封面HTML模板的工作流。用户提供参考图片+结构化描述，生成对应风格的HTML封面。
tags: [cover, html, design, template]
created: 2026-05-22
trigger: 按设计稿做封面 / 参考图生成封面 / 照着图片做模板
---

# 根据设计稿生成封面模板

## 适用场景

用户提供了参考设计稿（原图+描述），需要生成对应风格的HTML封面。

## 工作流

### 1. 收集参考信息

- 设计稿图片
- 用户提供的结构化描述（包含：布局、配色、字体、元素、模块）
- 目标尺寸（横版 16:9 或 竖版 9:16）

### 2. 提取设计要素

从描述中提取关键信息：

| 要素 | 示例 |
|------|------|
| 背景色 | #0A0A0F, radial-gradient |
| 强调色 | #00FFAA (霓虹青绿) |
| 字体 | Inter, Space Mono, Noto Sans CJK |
| 模块 | 导航栏、左右分栏、终端、按钮 |
| 特效 | grid网格、mesh orbs、blur光晕 |

### 3. 生成HTML

按以下结构组织代码：

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  /* CSS变量定义配色 */
  :root {
    --bg: #0A0A0F;
    --accent: #00FFAA;
    --text: #E5E7EB;
    --muted: #9CA3AF;
  }
  /* 背景层 */
  .bg { position: absolute; inset: 0; background: ... }
  .grid { ... }
  .noise { ... }
  /* 布局容器 */
  .container { position: relative; z-index: 2; ... }
  /* 各模块样式 */
  .navbar { ... }
  .terminal { ... }
  /* 动画 */
  .blink-cursor { animation: blink 1s ... }
</style>
</head>
<body>
  <div class="bg"></div>
  <div class="grid"></div>
  <!-- 内容 -->
</body>
</html>
```

### 3. 验证效果

用Playwright截图验证：

```python
from playwright.sync_api import sync_playwright

def screenshot(html_file, output_file, width, height):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.goto(f'file://{html_file}')
        page.wait_for_timeout(800)
        page.screenshot(path=output_file, full_page=True)
        browser.close()
```

### 4. 根据文案生成配图（非参考图模式）

当用户直接提供文案而不是参考图时：

1. 理解文案核心观点
2. 设计适配的视觉布局（卡片式、对比式、流程式等）
3. 编写 HTML（1200×630 或 1550×660 尺寸）
4. 启动 HTTP 服务器 + 浏览器截图
5. 保存到 templates-original/ 目录

**配图尺寸建议**：
- 微信公众号封面：1200×630（文章配图）
- 社交媒体：1550×660（横版）、1080×1440（竖版）

## 关键经验

1. **不要外部依赖** - 最多用Google Fonts，代码自包含
2. **固定尺寸** - 横版1280x720或1550x660，竖版1080x1440
3. **无滚动条** - 设置 `overflow:hidden`
4. **颜色一致性** - 从参考图中提取主色/强调色，用CSS变量管理
5. **终端效果** - 用 `.prompt` (强调色) + `.cmd` (白色) + 闪烁光标

## 文件命名规范

```
_templates/
├── f9-wx-{风格名}.html      # 横版公众号
├── f9-xhs-{风格名}.html     # 竖版小红书
├── preview-wx-{风格名}.png  # 横版预览
└── preview-xhs-{风格名}.png # 竖版预览
```

## 相关工具

- 截图：`/opt/hermes/.venv/bin/python3` + playwright
- 模板目录：`/opt/data/workspace/设计虱-写作系统/_templates/`