---
name: design-shi-cover-template
slug: design-shi-cover-template
description: |
  封面模板设计流程 - 外部模型读图生成设计规范 → 我根据规范生成HTML封面。
  触发词：「设计封面」「封面规范」「参考图生成」「自定义封面」「品牌封面」。
  当用户提到设计封面、参考图生成、自定义封面风格时使用。
tags: [cover, template, html, design, brand]
created: 2026-05-22
updated: 2026-05-28
metadata: {"keywords": ["封面", "设计", "模板", "品牌", "HTML", "规范"]}
---

# 封面模板设计流程

## 参考资源

本技能配套以下参考文件（位于 `references/` 目录）：

| 文件 | 用途 |
|------|------|
| `references/design-system.md` | 设计规范（配色、字体、间距） |
| `references/templates.md` | 模板映射表 |

设计封面前建议参考 `references/templates.md` 选择合适的模板。

**外部资源**：
- **品牌配置**：`/opt/data/hermes/cover-templates/brand-profile.md`
- **速查表**：`/opt/data/hermes/cover-templates/CHEATSHEET.md`
- **Nowill Design 规范**：`/opt/data/workspace/设计虱-写作系统/_templates/SPEC-nowill-design.md`
- **beautiful-html-templates**：`/opt/data/workspace/设计虱-写作系统/_templates/SPEC-beautiful-html-templates.md`

----

## 核心方法论

**外部模型读图 → 结构化设计规范 → 生成HTML封面**

当用户无法使用视觉模型时，借助外部AI理解参考图，生成结构化设计规范，我再根据规范精准生成HTML。

---

## ⚡ 启动必读

1. **先读品牌配置**：`/opt/data/hermes/cover-templates/brand-profile.md`
2. **先读速查表**：`/opt/data/hermes/cover-templates/CHEATSHEET.md`
3. **检查不变量**：十大硬规则必须遵守

---

## 十大不变量（硬规则）

1. **背景色**：深色 #121212 或白色 #FFFFFF，**禁止**纯灰背景
2. **强调色**：橙色 #FF5A1F，**禁止**超过2种强调色
3. **标题字号**：≥36px，**禁止**小标题抢主角
4. **副标题对比**：必须与标题形成对比
5. **署名固定**：设计虱聊科技
6. **平台规格**：小红书3:4，其他16:9
7. **中英文间距**：必须用空格隔开
8. **禁止纯白背景**（除非极简风格有对比元素）
9. **禁止堆砌元素**：最多3个视觉层次
10. **信息密度起伏**：不要每张都塞满

**违反后果**：封面看起来像AI生成的，没有重点，记不住。

---

## 工作流程

### 检查点：需求确认前
- [ ] 确认内容类型（NAS/AI/教程/生活）
- [ ] 确认平台（小红书/公众号/知乎）
- [ ] 确认风格偏好（有参考图更好）

### 检查点：模板选择前
- [ ] 确认模板映射表中的推荐模板
- [ ] 确认十大不变量中的硬规则
- [ ] 确认品牌配置已读取

### 检查点：生成前
- [ ] 确认输出路径
- [ ] 确认尺寸参数（小红书 1080×1440 / 其他 1550×660）
- [ ] 确认文件名不与现有文件冲突
- [ ] 确认使用 Playwright 脚本截图（不要用 browser_vision）

### Step 1: 确认需求
- 内容类型（NAS/AI/教程/生活）
- 平台（小红书/公众号/知乎）
- 风格偏好（如有参考图更好）

### Step 2: 选择模板
参考 `references/templates.md` 的映射表：
- NAS/数码 → 深色科技、终端风
- AI工具 → 渐变、霓虹、科技感
- 教程攻略 → 清晰分层、步骤感
- 生活经验 → 暖色、简洁、亲近感

### Step 3: 生成HTML
参考 `references/design-system.md` 的配色和字体规范。下面是最小 HTML 骨架示例：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1280">
<style>
  /* 设计规范变量 */
  :root {
    --bg: #121212;
    --accent: #FF5A1F;
    --text: #FFFFFF;
    --text-secondary: #AAAAAA;
    --font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1280px;
    height: 720px;
    background: var(--bg);
    font-family: var(--font);
    color: var(--text);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 48px 64px;
    overflow: hidden;
  }
  .tag {
    font-size: 14px;
    font-weight: 500;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 24px;
  }
  .title {
    font-size: 48px;
    font-weight: 900;
    line-height: 1.15;
    margin-bottom: 16px;
  }
  .subtitle {
    font-size: 24px;
    font-weight: 400;
    color: var(--text-secondary);
    margin-bottom: 48px;
  }
  .footer {
    position: absolute;
    bottom: 32px;
    right: 48px;
    font-size: 14px;
    color: var(--text-secondary);
  }
  /* 装饰元素 */
  .deco {
    position: absolute;
    width: 200px;
    height: 200px;
    border: 2px solid var(--accent);
    border-radius: 50%;
    opacity: 0.1;
    top: -60px;
    right: -60px;
  }
</style>
</head>
<body>
  <div class="deco"></div>
  <div class="tag">NAS / 硬件</div>
  <div class="title">主标题内容</div>
  <div class="subtitle">副标题内容</div>
  <div class="footer">设计虱聊科技</div>
</body>
</html>
```

**关键约束**：
- 尺寸固定：横版 1280×720 / 竖版 1080×1440
- 字号：标题 ≥36px，副标题 24px
- 颜色：仅用 `--bg`、`--accent`、`--text`、`--text-secondary`
- 署名固定：设计虱聊科技

### Step 4: 截图
```python
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1280, 'height': 720})
    page.goto('file:///path/to/template.html')
    page.wait_for_timeout(800)
    page.screenshot(path='output.png', full_page=True)
    browser.close()
```

### Step 5: 自检
对照 CHEATSHEET.md 的快速检查清单逐条验证。

### 检查点：截图完成后
- [ ] 截图文件存在且非空（`ls -lh output.png`）
- [ ] 文件大小合理：横版 50KB-500KB / 竖版 100KB-800KB
- [ ] 图片可正常打开（无损坏）
- [ ] 无滚动条（内容一屏显示完整）
- [ ] 文字可读：标题清晰、副标题对比度足够
- [ ] 配色合规：背景色为深色或白色，强调色为橙色
- [ ] 署名位置正确：右下角「设计虱聊科技」

如果截图文件为空或过小，检查 Playwright viewport 设置和 `wait_for_timeout` 时间。

---

## 错误处理

### 参考图无法读取
```
视觉模型无法分析参考图
→ 尝试使用其他视觉模型
→ 如果仍然失败，使用默认模板
→ 提供错误信息给用户
```

### 设计规范生成失败
```
外部模型返回的规范格式错误
→ 手动解析并修复格式
→ 使用默认值填充缺失字段
→ 提供错误信息给用户
```

### HTML 生成失败
```
模板文件损坏或路径错误
→ 检查模板文件是否存在
→ 使用内联模板生成
→ 提供错误信息给用户
```

### 截图失败
```
Playwright 截图报错
→ 检查 /opt/hermes/.venv/bin/python3 是否存在
→ 如果缺失，提示用户安装 Playwright
→ 提供错误信息给用户
```

---

> 本文档由 skill-optimizer 自动生成
