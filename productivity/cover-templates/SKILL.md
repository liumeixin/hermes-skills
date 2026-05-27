---
name: cover-templates
slug: cover-templates
description: |
  封面风格库管理 - 87个可复用封面风格模板，支持 Design Systems 和 HTML Templates 两类风格。
  触发词：「做封面」「换风格」「用XXX风格」「看看风格」「封面模板」「生成封面」。
  当用户提到要做封面、换风格、生成配图时使用。
tags: [cover, template, design, social-media]
version: 1.0.1
metadata: {"keywords": ["封面", "风格", "模板", "Design Systems", "HTML Templates"]}
---

# 封面风格库 Skill

## 参考资源

本技能配套以下参考文件（位于 `references/` 目录）：

| 文件 | 用途 |
|------|------|
| `references/template-selector.md` | 模板选择决策树 |
| `references/css-variables.css` | 通用 CSS 变量定义 |

生成封面前建议参考 `references/template-selector.md` 确认风格选择。

---

## 封面库位置

所有封面风格统一存放在：`/opt/data/hermes/cover-templates/`

```
cover-templates/
├── index.html                      # 封面风格总览页（浏览器打开预览）
├── screenshots/                    # 54个 Design Systems 风格截图
├── screenshots-html-templates/     # 33个 HTML Templates 风格截图
├── templates-original/             # 原创封面模板（横版+竖版）
│   ├── f9-wx.html                  # 毛玻璃风格（当前主用）
│   ├── f9-xhs.html                 # 小红书竖版
│   ├── f9-wx-nowill.html           # Nowill Design 风格
│   ├── f9-xhs-nowill.html          # Nowill Design 竖版
│   ├── f9-wx-terminal.html         # 终端风格
│   ├── f9-xhs-terminal.html        # 终端风格竖版
│   ├── bennett-tea-pink.html       # 茶品牌风格
│   ├── tea-brand-cover-v2.html     # 茶品牌 v2
│   └── nowill-design.html          # Nowill 设计
└── html-templates-index.json       # 34个 HTML 模板索引
```

## 风格分类

### #1 Design Systems（54个）
来源：popular-web-designs skill 的 54 个真实网站设计系统

代表风格：
| 风格名 | 特点 |
|--------|------|
| linear-app | 极简深色，紫罗兰强调 |
| vercel | 黑白极简，Geist字体 |
| stripe | 紫配白，优雅渐变 |
| claude | 暖色调 parchment 米色 |
| notion | 暖白极简 |
| figma | 多彩创意 |
| airbnb | 温暖珊瑚色 |
| ollama | 终端风格单色 |
| cursor | 深色科技 |
| posthog | 趣味绿品牌 |

### #2 HTML Templates（33个）
来源：beautiful-html-templates 项目

代表风格：
| 风格名 | 特点 |
|--------|------|
| studio | 黑底+电黄，高压设计工作室风 ⭐ |
| 8-bit-orbit | 像素霓虹街机风 |
| neo-grid-bold | 霓虹黄+网格 |
| emerald-editorial | 宝石绿+海军+纸 |
| signal | 深海蓝+骨纸+暗金 |
| grove | 森林绿+奶油色+铁锈 |
| coral | 奶油+珊瑚红+近黑 |
| pink-script | 黑底+热粉+珍珠奶油 |
| bold-poster | Shrikhand大字+火红 |

### #3 原创模板（多个）
来源：设计虱写作系统原创模板

| 模板名 | 风格 | 尺寸 |
|--------|------|------|
| f9-wx / f9-xhs | 毛玻璃 + Mesh Gradient（当前主用） | 1550×660 / 1080×1440 |
| f9-wx-nowill / f9-xhs-nowill | Nowill Design 橙黑科技风 | 1550×660 / 1080×1440 |
| nowill-design.html | Nowill Design 横版（1920×1080） | 1920×1080 |
| nowill-design-xhs.html | Nowill Design 竖版（1080×1691） | 1080×1691 |
| f9-wx-terminal / f9-xhs-terminal | 终端风格 | 1550×660 / 1080×1440 |
| bennett-tea-pink | 茶品牌粉色系 | 1550×660 |
| tea-brand-cover-v2 | 茶品牌 v2 | 1550×660 |

## 使用方式

用户说"我要用 XXX 风格做封面"时：

### 检查点：模板选择前
- [ ] 确认平台（微信/小红书/知乎）
- [ ] 确认风格来源（原创/Design Systems/HTML Templates）
- [ ] 如果用户未指定风格，提供 3-5 个推荐选项

### 检查点：生成前
- [ ] 确认标题、副标题、标签内容
- [ ] 确认尺寸是否正确（微信 1550×660 / 小红书 1080×1440）
- [ ] 如果使用 Design Systems 风格，确认颜色/字体规范

### 检查点：截图前
- [ ] 确认输出路径
- [ ] 确认截图格式（PNG/JPG）
- [ ] 确认文件名不与现有文件冲突

### 操作流程

1. **如果风格存在于风格库** → 加载对应设计系统的颜色/字体规范，生成 HTML 封面
2. **如果用户指定了原创模板** → 直接使用 templates-original 下的模板文件

### 生成流程

### Step 1：确认需求
1. 平台（微信/小红书/知乎）
2. 风格（原创/Design Systems/HTML Templates）
3. 内容（标题、副标题、标签）

### Step 2：加载模板
```
原创模板 → 读取 templates-original/{模板名}.html
Design Systems → 读取 design-systems/{风格名}/规范
HTML Templates → 读取 html-templates/{风格名}/规范
```

### Step 3：生成 HTML
1. 替换模板中的标题、副标题、标签、内容
2. 调整颜色/字体（如需要）
3. 保存为新的 HTML 文件

### Step 4：截图
```bash
# 横版封面（微信/知乎）
/opt/hermes/.venv/bin/python3 -c "
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1550, 'height': 660})
    page.goto('file:///opt/data/cache/documents/cover-wx-{文章名}.html')
    page.wait_for_timeout(800)
    page.screenshot(path='/opt/data/cache/screenshots/cover-wx-{文章名}.png', type='png')
    browser.close()
"

# 竖版封面（小红书）
/opt/hermes/.venv/bin/python3 -c "
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1080, 'height': 1440})
    page.goto('file:///opt/data/cache/documents/cover-xhs-{文章名}.html')
    page.wait_for_timeout(800)
    page.screenshot(path='/opt/data/cache/screenshots/cover-xhs-{文章名}.png', type='png')
    browser.close()
"
```

### Step 5：交付
1. 发送图片到飞书群
2. 询问是否需要调整

## Anti-Patterns

**❌ 不要做的事：**
- 不要猜测不存在的风格 → 找不到时列出最接近的3个选项
- 不要跳过检查点直接生成 → 每个检查点都有验证项
- 不要硬编码尺寸 → 使用标准尺寸（微信1550×660 / 小红书1080×1440）
- 不要忘记备份 → 新增模板前确认是否覆盖现有文件
- 不要在飞书发 markdown 表格 → 用纯文本或 send_feishu_card

## 完成检查点

### CP-Delivery
- [ ] 图片已发送到飞书群
- [ ] 文件名无冲突
- [ ] 尺寸符合平台要求
- [ ] 询问用户是否需要调整

## 错误处理

### 风格不存在
```
用户说的风格在库中找不到
→ 列出最接近的 3 个风格供选择
→ 不要猜测或创建不存在的风格
```

### 模板文件缺失
```
templates-original/ 下找不到指定模板
→ 提示用户该模板不存在
→ 建议使用现有模板或创建新模板
```

### 截图失败
```
Playwright 截图报错
→ 检查 HTML 文件路径是否正确
→ 检查浏览器是否安装
→ 提供错误信息给用户
```

## 新增模板规范

以后新增封面模板时，统一存放到：`/opt/data/hermes/cover-templates/templates-original/`

1. 创建 HTML 文件：
   - 横版命名：`f9-wx-{风格名}.html`（尺寸 1920×1080）
   - 竖版命名：`f9-xhs-{风格名}.html`（尺寸 1080×1440/1691）
2. 截取预览图：`preview-wx-{风格名}.png` 或 `preview-xhs-{风格名}.png`
3. 更新 index.html 添加入口（可选）

## Nowill Design 风格规范

### 颜色（橙黑科技风）
| 元素 | 色值 |
|------|------|
| 页面主背景 | #121212 |
| 右侧网格背景 | #1A1A1A + #222222 网格线 |
| 卡片背景 | #1F1F1F |
| 主标题强调色 | #FF5A1F |
| 副标题/次要文字 | #A0A0A0 |
| 按钮背景 | #FF5A1F |

### 常见调整反馈
- 文字太拥挤 → 调大字号（标题64px+）、增加 letter-spacing 和 line-height
- 下方太空 → 添加视觉元素（设备图案、放大镜等）
- 顶部背景分层 → 网格背景从导航栏下方开始（top: 73px）

### 生成示例
```bash
# 竖版封面 1080×1691
/opt/hermes/.venv/bin/python3 -c "
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1080, 'height': 1691})
    page.goto('file:///opt/data/hermes/cover-templates/templates-original/nowill-design-xhs.html')
    page.wait_for_timeout(800)
    page.screenshot(path='/opt/data/cache/screenshots/nowill-xhs-cover-v2.png', full_page=True)
    browser.close()
"

## 优化摘要
- 29/30 → 30/30 (100%)
- [D3] 新增 Anti-Patterns 章节，5条禁止事项
- [D4] 新增 CP-Delivery 完成检查点
- 新增版本: 1.0.1, 更新日期: 2026-05-27