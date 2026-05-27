---
name: xhs-wx-cover-template
slug: xhs-wx-cover-template
description: |
  小红书竖版 + 微信公众号横版封面模板，毛玻璃 + Mesh Gradient 风格。
  触发词：「生成封面」「做封面图」「小红书封面」「公众号封面」「封面模板」。
  当用户提到做封面、封面图、cover image 时使用。
tags: [cover, template, xhs, wechat, design]
metadata: {"keywords": ["封面", "模板", "小红书", "公众号", "毛玻璃", "Mesh Gradient"]}
notes: 本 skill 包含大量 CSS/HTML 代码，建议只关注核心流程和关键参数。飞书不支持 markdown 表格。
---

# 封面模板 Skill

## 相关技能引用

| 技能 | 用途 |
|------|------|
| `cover-templates` | 封面风格库管理，87个可复用模板 |
| `html-screenshot-image-gen` | HTML模板+浏览器截图生成图片 |
| `playwright-exact-screenshot` | 用 Playwright 精确尺寸截图 |
| `design-shi-cover-template` | 封面模板设计流程 |

## 参考资源

本技能配套以下参考文件（位于 `references/` 目录）：

| 文件 | 用途 |
|------|------|
| `references/cover-parameters.md` | 封面参数速查 |
| `references/color-schemes.md` | 配色方案参考 |

生成封面前建议参考 `references/cover-parameters.md` 确认尺寸和参数。

---

**风格**：深色 Mesh Gradient 背景 + 毛玻璃卡片 + 噪点纹理
**用途**：小红书竖版封面（1080×1440）+ 微信公众号/什么值得买横版封面（1550×660）
**触发时机**：文章写完后自动生成，无需用户确认

## 错误处理

### 模板文件缺失
```
_templates/ 下找不到 f9-wx.html 或 f9-xhs.html
→ 检查路径是否正确
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
→ 检查 fonts-noto-cjk 是否安装
→ 如果缺失，执行 apt-get install fonts-noto-cjk
→ 使用本地字体而非 Google Fonts
```

### 飞书发图失败
```
图片上传失败
→ 检查 .env 中 FEISHU_APP_ID / FEISHU_APP_SECRET
→ 检查图片文件是否存在
→ 提供错误信息给用户
```

### 标题换行或挤压
```
封面标题太长导致换行或挤压其他元素
→ 检查每行是否≤12字（横版）或≤10字（竖版）
→ 缩短标题或调整字号
→ 使用标题优化规则重新设计
```

## Anti-Patterns

**❌ 不要做的事：**
- 不要用 browser_vision 截图 → 必须用 Playwright 脚本，视口固定 1280×720 会变形
- 不要用旧模板路径 → 必须用 `_templates/f9-wx.html` 和 `f9-xhs.html`
- 不要硬编码旧文章内容 → 每次必须检查并替换为当前文章内容
- 不要用已弃用的配色方案 → 统一使用 v2.0 深紫蓝底+奶色球风格
- 不要跳过检查点 → 每个检查点都有验证项
- 不要在飞书发 markdown 表格 → 用纯文本或 send_feishu_card
- 不要用 Google Fonts → 服务器环境加载慢，用本地字体

## 完成检查点

### CP-Delivery
- [ ] 竖版封面已保存（1080×1440）
- [ ] 横版封面已保存（1550×660）
- [ ] 文件名无冲突
- [ ] 字体显示正常（无乱码或缺失）
- [ ] 标题未换行（每行≤12字）
- [ ] 作者署名是「设计虱聊科技」
- [ ] 发送到飞书群

## 执行流程（2026-05-21 更新）

### 检查点：模板选择前
- [ ] 确认需要生成的平台（微信/小红书/知乎/什么值得买）
- [ ] 确认模板路径正确（`_templates/f9-wx.html` 或 `f9-xhs.html`）
- [ ] 确认模板中的文字是旧内容（需要替换）

### 检查点：内容替换后
- [ ] 确认主标题（line1）≤12字
- [ ] 确认副标题（line2）与主标题有节奏感
- [ ] 确认卡片内容（3条）已替换
- [ ] 确认作者署名是「设计虱聊科技」

### 检查点：截图前
- [ ] 确认输出路径
- [ ] 确认尺寸参数正确（横版 1550×660 / 竖版 1080×1440）
- [ ] 确认使用 Playwright 脚本（不要用 browser_vision）
- [ ] 确认文件名不与现有文件冲突

### 操作步骤

1. **先读数据周报**（`写作系统/数据分析/数据追踪.md`），确认各平台标题公式和受众偏好
2. **封面标题 ≠ 文章标题**。文章标题给搜索引擎/推荐算法，封面标题给**眼球**——要短、直觉、一眼抓住
3. **每个平台必须独立封面**，因为：
   - 各平台受众不同（公众号要痛点+解法、小红书要情绪+结果、知乎要问题式、头条号要冲突感）
   - 数据报告已验证不同标题点击率差异巨大（如"降低成本"角度小红书点击率21.3%）
   - 封面标题根据平台特点和近期数据表现单独设计
4. 从文章提取：每个平台的封面标题（≤15字/行）、副标题（一句话卖点）、3 个功能亮点
   - **⚠️ 模板路径（重要！）**：
     - **必须使用**：`/opt/data/workspace/设计虱-写作系统/_templates/` 下的模板
     - 横版（公众号/什么值得买/知乎/头条号）：`f9-wx.html`（1550x660，带网格背景）
     - 竖版（小红书）：`f9-xhs.html`（1080x1440）
     - **不要用** `/tmp/cover-output/` 下的旧模板，那是临时文件
     - **不要用** `/opt/data/workspace/Projects/html-ppt-skill/templates/cover-templates/` 下的旧模板
6. **⚠️ 封面内容检查点（关键！）**：
   - 打开模板后，必须确认 HTML 中的文字内容是**当前文章**的内容
   - 常见错误：模板中的标题/副标题/描述/卡片内容是**旧文章的硬编码文字**
   - 必须替换的内容：
     - `line1`（主标题）
     - `line2`（副标题）
     - `.desc` / `.subtitle`（描述文字）
     - `.tag`（标签）
     - `.tag-side`（副标签，横向模板有）
     - `.card-title`（卡片标题）
     - `.card-items` / `.feat`（卡片内容，3条）
     - 作者署名（统一用「设计虱聊科技」）
   - 头像/图标：知乎/头条号用 `title .line1: 42px, .line2: 32px`，其他保持不变
   - 如果发现是旧内容，**必须根据当前文章内容重新填写**
   - 完成后检查：标题是否换行？超过12字需缩短
   ```bash
   /opt/hermes/.venv/bin/python3 -c "
   from playwright.sync_api import sync_playwright
   with sync_playwright() as p:
       browser = p.chromium.launch()
       page = browser.new_page(viewport={'width': W, 'height': H})
       page.goto('file:///path/to/cover.html')
       page.wait_for_timeout(1000)
       page.screenshot(path='output.png', type='png')
       browser.close()
   "
   ```
   - 公众号/什么值得买/知乎（横版）：`1550 660`
   - 小红书（竖版）：`1080 1440`
   - 头条号（横版窄）：`1080 608`
8. 保存到分发目录：`写作系统/稿件库/已适配/YYYY-MM-DD-文章标题/`（**直接放根目录，不要放配图子目录**）
9. 告知用户，附截图路径

---

## 封面标题优化规则（核心！）

**封面标题和文章标题是两回事**。文章标题给算法/搜索（长、完整、含关键词），封面标题给**人眼**（短、直觉、一瞬间抓住）。

### 各平台封面标题策略

| 平台 | 封面标题风格 | 字数限制 | 数据依据 |
|------|------------|---------|---------|
| **公众号** | 痛点+解法，制造悬念 | 每行≤10字，共两行 | 痛点+解法型转发率11%（"看不见图"95转发），叙事型权重低 |
| **什么值得买** | 攻略感+实用价值，突出"省事/省钱" | 每行≤10字，共两行 | 攻略/工具组合收藏最高（67收藏），"免费+攻略"是爆款公式 |
| **知乎** | "为什么/怎么+生活场景"问题式 | 每行≤12字，共两行 | "怎么向老婆解释NAS"5万+阅读，生活化切入>纯技术分析 |
| **头条号** | 数字+冲突感，反常识 | 每行≤12字，共两行 | 产品对比类/问题解决类点击率4-8%，反常识标题加权 |
| **小红书** | 情绪+结果，零技术词，可加emoji | 每行≤12字，共两行 | 技术术语劝退（ACL点击率4.2%），"降低成本"角度点击率21.3%最高 |

### 封面标题自检清单

生成封面标题后，逐项检查：
1. **有没有技术术语？** → 小红书/头条号绝对不能出现（如"Agent""上下文""Token"）
2. **有没有情绪钩子？** → 至少一行要有情绪词（变蠢/失忆/真相/救命）
3. **有没有结果承诺？** → 至少一行要给出结果（一招治好/什么都记得住）
4. **每行是否≤12字？** → 超过12字在封面上会换行或挤压其他元素
5. **两行是否有节奏感？** → 上行提问/痛点，下行解答/结果（不要两行都是陈述句）

### 常见错误

- ❌ 封面标题照搬文章标题（太长、信息密度过高，封面上读不完）
- ❌ 封面标题全是技术概念（"单Agent分群大法"→小红书用户看不懂）
- ❌ 两行都是问句或都是陈述句（没有节奏感）
- ❌ 一行放了太多信息（"AI助手用着用着就变蠢一招治好上下文污染"→太长）
- ❌ 把一句话拆成两行（"AI为什么用着用着" / "就变笨了？"）→应该主标题完整表达意思，副标题补充说明

### 标题优化案例（上下文污染这篇文章）

| 平台 | 初始标题 | 优化后 | 优化原因 |
|------|---------|--------|---------|
| 公众号 | AI助手变蠢？一招治好上下文污染 | 不变 | 已符合痛点+解法公式 |
| 什么值得买 | 一个群一件事AI不再失忆 | 一个群一件事 / AI助手从此不再失忆 | 拆成两行更有节奏，加"助手"让非技术用户理解 |
| 知乎 | AI为什么用着用着就变笨了？ | 不变 | 已符合"为什么+生活场景"公式 |
| 头条号 | AI变笨的真相所有事塞一个群 | AI变笨的真相 / 所有事塞一个群的后果 | 加"后果"增强冲突感 |
| 小红书 | 告别AI失忆症 | 不变 | 已是情绪+结果，零技术词 |

---

## 配色方案

根据文章主题选择：

| 方案名 | 背景基色 | 光斑色 | 渐变强调色 | 适用场景 |
|--------|---------|--------|-----------|---------|
| **科技紫** | #0c0c1d → #1a1a3e | #ff6b6b / #4ecdc4 / #a29bfe | #4ecdc4 → #a8e6cf | NAS / Docker / 效率工具 |
| **活力橙** | #1a0c0c → #3e1a1a | #f093fb / #f5576c / #ffecd2 | #f093fb → #f5576c | 生活 / 家电 / 数码 |
| **深邃蓝** | #0c1a2e → #1a2e3e | #4facfe / #00f2fe / #43e97b | #4facfe → #00f2fe | AI / 软件 / 技术教程 |
| **暗金** | #1a1a0c → #2e2e1a | #f7971e / #ffd200 / #c471ed | #f7971e → #ffd200 | 评测 / 对比 / 高端产品 |

---

## 竖版模板（小红书 1080×1440，3:4）

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 1080px; height: 1440px; overflow: hidden; }
    body {
      font-family: 'Noto Sans CJK SC', 'WenQuanYi Micro Hei', sans-serif;
      position: relative;
      background: /* mesh gradient */;
    }
    .bg {
      position: absolute; inset: 0;
      background:
        radial-gradient(ellipse at 20% 50%, {{ORB1_COLOR}}44 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, {{ORB2_COLOR}}44 0%, transparent 50%),
        radial-gradient(ellipse at 50% 80%, {{ORB3_COLOR}}44 0%, transparent 50%),
        radial-gradient(ellipse at 70% 60%, {{ORB4_COLOR}}55 0%, transparent 40%),
        linear-gradient(135deg, {{BG_START}} 0%, {{BG_MID}} 50%, {{BG_END}} 100%);
    }
    .noise {
      position: absolute; inset: 0; opacity: 0.035;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 256px 256px;
    }
    .orb { position: absolute; border-radius: 50%; filter: blur(60px); }
    .orb-1 { width: 300px; height: 300px; background: {{ORB1_COLOR}}; top: -50px; left: -80px; opacity: 0.3; }
    .orb-2 { width: 200px; height: 200px; background: {{ORB2_COLOR}}; bottom: 200px; right: -60px; opacity: 0.25; }
    .orb-3 { width: 250px; height: 250px; background: {{ORB3_COLOR}}; top: 400px; left: 600px; opacity: 0.2; }

    .content {
      position: relative; z-index: 2; height: 100%;
      display: flex; flex-direction: column; padding: 70px 65px;
    }
    .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: auto; }
    .tag {
      display: inline-flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,0.08); backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.85); font-size: 26px; font-weight: 600;
      padding: 14px 30px; border-radius: 50px; letter-spacing: 1px;
    }
    .tag-dot { width: 10px; height: 10px; background: {{ACCENT_COLOR}}; border-radius: 50%; }
    .brand { color: rgba(255,255,255,0.4); font-size: 24px; font-weight: 500; letter-spacing: 3px; }

    .hero { margin-bottom: 50px; }
    .hero-sub { font-size: 30px; color: rgba(255,255,255,0.5); font-weight: 500; margin-bottom: 20px; letter-spacing: 2px; }
    .hero-title { font-size: 82px; font-weight: 900; line-height: 1.2; letter-spacing: -2px; }
    .hero-title .line1 { color: #ffffff; display: block; }
    .hero-title .line2 {
      display: block;
      background: linear-gradient(135deg, {{ACCENT_COLOR}}, {{ACCENT_COLOR_2}});
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .divider { width: 80px; height: 4px; background: linear-gradient(90deg, {{ACCENT_COLOR}}, transparent); border-radius: 2px; margin-bottom: 40px; }

    .features { display: flex; flex-direction: column; gap: 18px; margin-bottom: auto; }
    .feat {
      display: flex; align-items: center; gap: 22px;
      background: rgba(255,255,255,0.06); backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px 32px;
    }
    .feat-icon {
      width: 52px; height: 52px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0;
    }
    .feat-icon.g { background: rgba(78,205,196,0.15); }
    .feat-icon.p { background: rgba(162,155,254,0.15); }
    .feat-icon.k { background: rgba(253,121,168,0.15); }
    .feat-text { font-size: 30px; color: rgba(255,255,255,0.88); font-weight: 600; letter-spacing: 0.5px; }

    .bottom {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.08);
    }
    .bottom-author { color: rgba(255,255,255,0.5); font-size: 24px; font-weight: 500; }
    .bottom-hashtag { color: {{ACCENT_COLOR}}99; font-size: 22px; font-weight: 500; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="bg"></div>
  <div class="noise"></div>
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>
  <div class="content">
    <div class="top-bar">
      <div class="tag"><span class="tag-dot"></span>{{TAG_TEXT}}</div>
      <div class="brand">{{AUTHOR}}</div>
    </div>
    <div class="hero">
      <div class="hero-sub">{{SUBTITLE}}</div>
      <div class="hero-title">
        <span class="line1">{{TITLE_LINE1}}</span>
        <span class="line2">{{TITLE_LINE2}}</span>
      </div>
    </div>
    <div class="divider"></div>
    <div class="features">
      <div class="feat"><div class="feat-icon g">{{ICON1}}</div><span class="feat-text">{{FEAT1}}</span></div>
      <div class="feat"><div class="feat-icon p">{{ICON2}}</div><span class="feat-text">{{FEAT2}}</span></div>
      <div class="feat"><div class="feat-icon k">{{ICON3}}</div><span class="feat-text">{{FEAT3}}</span></div>
    </div>
    <div class="bottom">
      <span class="bottom-author">{{AUTHOR}} · {{CATEGORY}}</span>
      <span class="bottom-hashtag">{{HASHTAGS}}</span>
    </div>
  </div>
</body>
</html>
```

---

## 横版模板（微信公众号/什么值得买 1550×660）

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 1550px; height: 660px; overflow: hidden; }
    body {
      font-family: 'Noto Sans CJK SC', 'WenQuanYi Micro Hei', sans-serif;
      position: relative;
      background: /* mesh gradient */;
    }
    .bg {
      position: absolute; inset: 0;
      background:
        radial-gradient(ellipse at 15% 50%, {{ORB1_COLOR}}44 0%, transparent 50%),
        radial-gradient(ellipse at 75% 30%, {{ORB2_COLOR}}44 0%, transparent 50%),
        radial-gradient(ellipse at 50% 90%, {{ORB3_COLOR}}44 0%, transparent 40%),
        linear-gradient(135deg, {{BG_START}} 0%, {{BG_MID}} 50%, {{BG_END}} 100%);
    }
    .noise {
      position: absolute; inset: 0; opacity: 0.035;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 256px 256px;
    }
    .orb { position: absolute; border-radius: 50%; filter: blur(50px); }
    .orb-1 { width: 250px; height: 250px; background: {{ORB1_COLOR}}; top: -80px; left: -60px; opacity: 0.25; }
    .orb-2 { width: 180px; height: 180px; background: {{ORB2_COLOR}}; bottom: -60px; right: 200px; opacity: 0.2; }
    .orb-3 { width: 200px; height: 200px; background: {{ORB3_COLOR}}; top: -40px; right: -50px; opacity: 0.18; }

    .content {
      position: relative; z-index: 2; height: 100%;
      display: flex; align-items: center; padding: 0 70px; gap: 50px;
    }
    .left { flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .tag {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.07); backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.75); font-size: 18px; font-weight: 600;
      padding: 8px 20px; border-radius: 40px; margin-bottom: 20px; width: fit-content; letter-spacing: 1px;
    }
    .tag-dot { width: 8px; height: 8px; background: {{ACCENT_COLOR}}; border-radius: 50%; }
    .title { font-size: 48px; font-weight: 900; line-height: 1.25; letter-spacing: -1px; margin-bottom: 16px; }
    .title .w1 { color: #fff; }
    .title .w2 {
      background: linear-gradient(135deg, {{ACCENT_COLOR}}, {{ACCENT_COLOR_2}});
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .subtitle { font-size: 20px; color: rgba(255,255,255,0.45); font-weight: 400; line-height: 1.6; }

    .right { width: 380px; flex-shrink: 0; }
    .card {
      background: rgba(255,255,255,0.06); backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 36px 32px;
    }
    .card-title { font-size: 16px; color: rgba(255,255,255,0.4); font-weight: 500; letter-spacing: 2px; margin-bottom: 22px; text-transform: uppercase; }
    .card-items { display: flex; flex-direction: column; gap: 16px; }
    .card-item { display: flex; align-items: center; gap: 14px; }
    .card-icon {
      width: 40px; height: 40px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
    }
    .card-icon.g { background: rgba(78,205,196,0.12); }
    .card-icon.p { background: rgba(162,155,254,0.12); }
    .card-icon.k { background: rgba(253,121,168,0.12); }
    .card-text { font-size: 22px; color: rgba(255,255,255,0.82); font-weight: 600; }

    .author { position: absolute; bottom: 20px; left: 70px; z-index: 3; color: rgba(255,255,255,0.3); font-size: 16px; font-weight: 500; letter-spacing: 2px; }
  </style>
</head>
<body>
  <div class="bg"></div>
  <div class="noise"></div>
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>
  <div class="content">
    <div class="left">
      <div class="tag"><span class="tag-dot"></span>{{TAG_TEXT}}</div>
      <div class="title">
        <span class="w1">{{TITLE_LINE1}}</span><br>
        <span class="w2">{{TITLE_LINE2}}</span>
      </div>
      <div class="subtitle">{{SUBTITLE}}</div>
    </div>
    <div class="right">
      <div class="card">
        <div class="card-title">{{CARD_TITLE}}</div>
        <div class="card-items">
          <div class="card-item"><div class="card-icon g">{{ICON1}}</div><span class="card-text">{{FEAT1}}</span></div>
          <div class="card-item"><div class="card-icon p">{{ICON2}}</div><span class="card-text">{{FEAT2}}</span></div>
          <div class="card-item"><div class="card-icon k">{{ICON3}}</div><span class="card-text">{{FEAT3}}</span></div>
        </div>
      </div>
    </div>
  </div>
  <div class="author">{{AUTHOR}} · {{CATEGORY}}</div>
</body>
</html>
```

---

## 使用说明

1. 替换模板中的 `{{变量}}` 为实际内容
2. 根据文章主题选择配色方案，替换颜色变量
3. 保存为 HTML → Playwright 脚本截图 → 保存 PNG
4. 竖版和横版共用同一套视觉语言，风格统一
5. 截图命令：`/opt/hermes/.venv/bin/python /opt/data/scripts/html2png.py <html> <png> <宽> <高>`

## Emoji / 图标渲染

Chromium 无头浏览器默认不带彩色 emoji 字体，🧠📉🔥 等 emoji 会渲染成方框。两种解决方案：

1. **安装 emoji 字体**（推荐，一劳永逸）：
   ```bash
   apt-get install -y fonts-noto-color-emoji && fc-cache -f
   ```
   安装后 emoji 正常渲染，可直接在 HTML 中使用。

2. **纯 CSS / SVG 图标**（不依赖字体）：
   - 闪电：CSS border 三角组合 或 `<svg>` path
   - 大脑/共享：两个重叠圆 `<circle>`
   - 下降：竖线 + 三角箭头 `<polyline>`
   - 优点：渲染零风险；缺点：制作成本稍高

**经验**：如果封面需要 emoji，先跑一次 `apt-get install -y fonts-noto-color-emoji`，之后不用再装。如果不确定环境是否已装，先用纯 CSS 图标兜底。

---

## 亮度校准指南（重要！）

封面常见的迭代路径：**太暗 → 提亮过曝 → 压回背景**。核心原则：**背景和装饰元素的亮度要分开调**。

### 推荐亮度参数

| 元素 | 推荐值 | 说明 |
|------|--------|------|
| **背景渐变基色** | `#080c1e` ~ `#0e1230` | 深但非纯黑，保留色彩倾向 |
| **光斑 orb opacity** | 0.25 ~ 0.35 | 低于 0.2 看不见，高于 0.4 过曝 |
| **光斑 orb filter** | `blur(80px)` | 比模板的 60px 更柔和 |
| **脉冲线/弧线** | opacity 0.5~0.7 + box-shadow 发光 | 线条本身要亮，靠 opacity 控制整体感 |
| **卡片边框** | `rgba(255,255,255,0.08~0.12)` 或主题色 0.15~0.2 | 太低看不见，太高抢文字 |
| **卡片背景** | `rgba(255,255,255,0.03~0.06)` | 配合 backdrop-filter |
| **节点/光点** | 8~10px + box-shadow 发光圈 | 小于 6px 在截图中几乎不可见 |
| **文字（非标题）** | opacity 0.4~0.55 | 太低看不清，太高抢标题 |

### 元素间距调整技巧

当需要调整两个元素之间的间距（如标签和标题）时：

**问题**：直接用 margin 在 flex 容器中不生效，因为容器有 padding（如 `padding-top: 270px`）会推着所有内容往下走。

**解决方案**：
1. 减少容器的 padding-top（如从 270px 减到 150px，减少 120px）
2. 给要保持位置的元素加等量的 margin-top（如标题加 `margin-top: 120px`）
3. 这样两个元素之间的相对位置就改变了

**示例**：标签和标题间距想增加 100px
```css
.glass { padding: 150px 50px 80px; }  /* 从270px减到150px */
.title { margin-top: 120px; }  /* 标题位置补偿回来 */
```

### 调试口诀

- 用户说**"太暗/元素看不见"** → 提亮装饰元素（orb opacity、线宽、节点大小），**不要动背景**
- 用户说**"过曝/太亮"** → 压暗背景渐变基色，**不要动装饰元素**
- 用户说**"再暗一点但元素保留"** → 只改 body background 和 .bg gradient 的颜色值，其他全部不动

---

## 三套风格变体（可选）

当用户要求多方案选择时，提供以下三套风格变体（均以横版 1550×660 为模板）：

### A「赛博脉冲」— 能量感最强
- 背景：深空底 + 霓虹脉冲线条（2px渐变线 + box-shadow 发光）
- 卡片：毛玻璃 + 发光边框 + 叠影层偏移旋转
- 图标：CSS 几何形状或 SVG
- 适用：需要强视觉冲击的场景

### B「深空晶格」— 极简高级
- 背景：极暗底 + 星空粒子 + 大光斑
- 卡片：多层 HUD 玻璃板（2~3层叠加，不同 opacity）
- 图标：SVG 线条（stroke 风格，白色半透明）
- 适用：偏高端、克制的调性

### C「流光拓扑」— 数据感
- 背景：流光弧线（大圆弧 border）+ 节点连线（SVG line）
- 卡片：流程图节点式（彩色圆点 + 竖线连接）
- 图标：彩色发光圆点（与节点风格统一）
- 适用：技术/数据可视化风格

---

## Flex 布局踩坑（重要！）

### `justify-content: center` 导致 margin 失效

**症状**：调大某个元素的 `margin-bottom`，但视觉上间距完全不变。

**原因**：父容器 `justify-content: center` 会将所有剩余空间均匀分配到首尾，子元素的 margin 增加只是让总内容变高，flex 重新居中后间距被抵消。

**修复**：改用 `justify-content: flex-start`，用 padding 控制内容起始位置，margin 才能生效。

### `margin-top: auto` 吃掉所有剩余空间

**症状**：底部元素（如作者栏）有 `margin-top: auto`，无论怎么调上面元素的 margin，间距都不变。

**原因**：`margin-top: auto` 在 flex 列布局中会吸收所有剩余可用空间，把自身推到底部。其他元素的 margin 变化被 auto margin 吞掉。

**修复**：去掉 `margin-top: auto`，改用显式的 `margin-top` 值控制间距。

### 推荐的竖版布局方案

```css
.glass {
  display: flex; flex-direction: column;
  justify-content: flex-start;  /* 不要用 center */
  padding: 200px 50px 60px 50px;
}
.features { margin-top: 200px; }  /* 用显式值控制间距 */
.author-row { padding-top: 20px; }  /* 不要用 margin-top: auto */
```

---

## 注意事项

- **字体版权（2026-05 更新）**：已从 PingFang SC / Microsoft YaHei 等商业字体切换到 **Noto Sans CJK SC**（SIL Open Font License 1.1，免费商用）。安装：`apt-get install fonts-noto-cjk`。备选 `WenQuanYi Micro Hei`。CSS 字体栈 `'Noto Sans CJK SC', 'WenQuanYi Micro Hei', sans-serif`。不引用 Google Fonts CDN（服务器环境加载慢），一律用本地字体
- **截图方式**：必须用 Playwright 脚本，指定 viewport 尺寸截图。不要用 `browser_vision`（视口固定 1280×720，会导致缩放或白边）
- **HTML 尺寸必须设置**：Playwright 截图时，`html, body { width: Xpx; height: Ypx }` **必须写在 CSS 里**，否则截图会白屏或尺寸错误
- **执行流程**：先读旧模板文件（`/tmp/cover-output/` 下各平台 .html），只修改标题文字，不要重新生成 HTML 结构
- **踩坑记录**：曾尝试 `html,body { width: Npx }`、`min-width: 100vw`、CSS `scale()` 三种方案，均因浏览器视口与设计稿尺寸不匹配导致白边或缩放变形。最终方案：Playwright 脚本启动时设 `viewport: {width, height}`，页面在正确尺寸下渲染，截图无缩放无白边
- **HTML 结构**：直接设 `html, body { width: Npx; height: Npx; overflow: hidden; }`，不需要 scale hack
- **竖版 flex 居中陷阱**：`justify-content: center` 会让 margin 调整失效（flex 重新分配空间）。需要控制间距时改 `flex-start` + 固定 padding
- 中文字体使用 `Noto Sans CJK SC`（fonts-noto-cjk，SIL 开源免费商用），备选 `WenQuanYi Micro Hei`。已弃用 PingFang SC 等非商用字体
- 毛玻璃效果需要 `backdrop-filter`，Playwright Chromium 天然支持
- 噪点纹理用 SVG feTurbulence 实现，零外部依赖
- 什么值得买封面最小长度 1550px，横版模板已按此尺寸设计

---

## 横版排版适配指南（重要！）

### 问题：宽高比大的封面中间太空

知乎/头条号（1080×608）宽高比 1.78:1，公众号/什么值得买（1550×660）是 2.35:1。左右布局时，标题太短会导致中间大片空白。

### 解决方案

| 策略 | 做法 | 适用场景 |
|------|------|----------|
| **标题加长** | 标题不超过图宽 75% 的前提下尽量写长 | 标题本身有内容可展开时 |
| **卡片加宽** | `.right` 从 380px 加到 420px（1550版）或 360px（1080版） | 卡片文字多、需要不换行时 |
| **卡片文字不换行** | `.card-item { white-space: nowrap; }` + 缩小字号（22→19px 或 17px） | 文字换行导致卡片高度不均时 |
| **缩小间距** | padding 从 70px 减到 50px，gap 从 50px 减到 36px | 1080×608 窄版 |
| **字号分级** | 标题：1550版 46px / 1080版 40px；卡片文字：1550版 19px / 1080版 17px | 所有横版 |

### 尺寸参数速查（2026-05-20 校准）

| 平台 | 尺寸 | 宽高比 | 卡片宽 | 标题字号 | 卡片文字 | 卡片padding | 间距gap |
|------|------|--------|--------|----------|----------|-------------|---------|
| 公众号/什么值得买 | 1550×660 | 2.35:1 | 600px | 52px | 28px | 36px 34px | 50px |
| 知乎/头条号 | 1080×608 | 1.78:1 | 380px | 40-42px | 17px | 28px 26px | 36px |
| 小红书 | 1080×1440 | 0.75:1 | — | 82px | 30px | 24px 32px | 18px |

**注意**：卡片宽 600px 是用户调试后确认的最佳值（420→480→600），卡片文字 28px 是 19px 的 1.5 倍，高度自适应。

---

## 背景配色经验（参考图校准）

经过多次迭代，用户最终偏好的配色特征：

### 推荐方案：蓝紫底 + 右下暖色

```css
/* 背景渐变：左上冷色 → 中间暖紫过渡 → 右下暗红棕 */
linear-gradient(145deg, #0e0e28 0%, #141438 35%, #1c1640 60%, #221538 85%, #2a1530 100%)

/* 光斑（底部两角，克制） */
glow-1: #4ecdc4  bottom-left   opacity 0.18
glow-2: #c084fc  bottom-right  opacity 0.14

/* 色球（模糊背景层，增加色彩呼吸感） */
orb-red:    #e04060  左上    opacity 0.12  blur(70px)
orb-green:  #3abfa0  中间    opacity 0.08  blur(70px)
orb-purple: #9060d0  右下    opacity 0.10  blur(70px)
```

**关键点**：
- 背景不是纯蓝也不是纯紫，是**蓝紫混合 + 暖色收尾**
- 右下角的暗红棕（#2a1520）让画面不至于太冷
- 标题强调色用**绿色系**（#4ecdc4 → #a8e6cf），和冷色背景形成对比

### 用户最终确认的配色参数（2026-05-20）

**背景渐变**（暖紫调）：
```css
background:
  radial-gradient(ellipse at 15% 65%, #1e3850 0%, transparent 50%),
  radial-gradient(ellipse at 80% 80%, #3a1830 0%, transparent 45%),
  radial-gradient(ellipse at 50% 50%, #1a1a42 0%, transparent 60%),
  linear-gradient(145deg, #0e0e28 0%, #141438 35%, #1c1640 60%, #221538 85%, #2a1530 100%);
```

**5个奶色球**（blur 50px，radial-gradient 中心提亮边缘不变）：
| 色球 | 颜色（中心→边缘） | 尺寸 | 位置 | opacity | 说明 |
|------|------|------|------|---------|------|
| 奶红 | `#f09080 → #e06068` | 520px | top:-130 left:-110 | 0.3 | 最大最亮，左上 |
| 奶绿（右下） | `#80e8c0 → #40b898` | 400px | bottom:-100 left:900 | 0.25 | 青翠，右下 |
| 蓝紫 | `#9898d8 → #7878c0` | 300px | top:100 right:180 | 0.18 | 中右 |
| 奶绿（左下） | `#80e8c0 → #50c898` | 200px | bottom:50 left:-50 | 0.25 | 左下偏小 |
| 奶紫 | `#d0a8d8 → #b890c8` | 240px | top:50 left:82% | 0.25 | 右上 |

**色球 CSS**（必须用 radial-gradient，中心亮边缘暗）：
```css
.orb-1 { background: radial-gradient(circle, #f09080 0%, #e06068 100%); }
.orb-2 { background: radial-gradient(circle, #80e8c0 0%, #40b898 100%); }
.orb-3 { background: radial-gradient(circle, #9898d8 0%, #7878c0 100%); }
.orb-4 { background: radial-gradient(circle, #80e8c0 0%, #50c898 100%); }
.orb-5 { background: radial-gradient(circle, #d0a8d8 0%, #b890c8 100%); }
```

**毛玻璃面板**（极度通透，v25最终版）：
```css
background: rgba(255,255,255,0.018);
backdrop-filter: blur(8px);
border: 1px solid rgba(255,255,255,0.06);
```

**标签渐变**（深青蓝→浅青绿）：
```css
background: linear-gradient(90deg, #1a6b7a 0%, #3abfa0 50%, #7eecd4 100%);
border: 1px solid #1a6b7a;
```

**描述小字**（深蓝灰，不是亮白）：
```css
color: rgba(180,200,220,0.45);
```

### 踩过的坑

- ❌ 纯蓝底（#0c1a2e）→ 太冷，缺少层次
- ❌ 纯黑底（#080a1a）→ 太暗，光斑看不出来
- ❌ 背景提亮到 #141845 → 过曝，像没关灯的屏幕
- ❌ 色球 blur 70px → 太糊，边缘完全弥散
- ❌ 色球用高饱和色（#d84048, #208868）→ 太艳，不像参考图
- ✅ 深蓝紫（#0e0e28）+ 暖色收尾（#2a1530）→ 用户认可
- ✅ 奶色球（加白降饱和）+ blur 50px → 接近参考图质感
- ✅ 毛玻璃 blur 8px + opacity 0.018 → 网格通透可见（v25最终版）

---

## 参考图风格（2026-05-20 新增，用户高度认可）

用户最终确认了一套**参考图风格**，与原始模板的左右分栏不同。核心特征：单块毛玻璃面板覆盖全幅 + 5 个模糊色球背景。

### 布局结构

```
┌─────────────────────────────────────────┐
│  ┌─ 毛玻璃面板（四周留 18-24px 边距）─┐  │
│  │                                      │  │
│  │  [标签行]  AI效率工具  AI工具         │  │
│  │                                      │  │
│  │  主标题（白色粗体 52px）              │  │
│  │  副标题（白色稍淡 36px）              │  │
│  │  描述文字                             │  │
│  │                                      │  │
│  │  ● 上下文隔离      ● 核心优势         │  │
│  │  ● 记忆天然共享    ● 功能卡片         │  │
│  │  ● Token消耗直线下降                  │  │
│  │                                      │  │
│  │  ● 设计虱聊科技（署名）               │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**关键差异**（vs 原始模板）：
- 不是左右分栏（左标题+右卡片），而是**一块整的毛玻璃面板**，内容从上到下排列
- 面板内 padding 较大（80px），内容不贴边
- 右侧功能区用小圆点 `●` 而不是 emoji/SVG 图标
- 面板顶部有微光高光线（`::before` pseudo-element）

### 5 个模糊色球（精确参数 v9 最终版）

背景中 5 个模糊色球是参考图最核心的视觉元素，让画面不单调。用 `radial-gradient` 实现中心亮边缘暗。

| # | 颜色（中心→边缘） | 直径 | 位置 | opacity | blur | 说明 |
|---|------|------|------|---------|------|------|
| 1 | `#f09080→#e06068` | 520px | top:-130 left:-110 | 0.3 | 50px | 奶红，最大最亮 |
| 2 | `#80e8c0→#40b898` | 400px | bottom:-100 left:900 | 0.25 | 50px | 奶绿，右下青翠 |
| 3 | `#9898d8→#7878c0` | 300px | top:100 right:180 | 0.18 | 50px | 蓝紫，中右 |
| 4 | `#80e8c0→#50c898` | 200px | bottom:50 left:-50 | 0.25 | 50px | 奶绿，左下偏小 |
| 5 | `#d0a8d8→#b890c8` | 240px | top:50 left:82% | 0.25 | 50px | 奶紫，右上 |

**层叠关系**（从底到顶）：奶绿(2) → 蓝紫(3) → 奶绿(4) → 奶紫(5) → 奶红(1)。HTML 中按此顺序写。

**色球 CSS**：
```css
.orb { position: absolute; border-radius: 50%; filter: blur(70px); }
```

**层叠关系**（从底到顶）：青绿(2) → 蓝紫(3) → 红紫(1)。HTML 中按此顺序写（后面的覆盖前面的）。

**色球颜色不准时的调试方向**：
- 用户说"不够亮不够大" → 加大直径 + 提高 opacity（0.1→0.2 级别）
- 用户说"太亮" → 降低 opacity（每次调 0.02-0.04）
- 用户说"没看见" → opacity 太低，提到 0.12 以上
- blur(70px) 是经过验证的值，太大（100+）会完全弥散看不出颜色

### 标签渐变（参考图风格）

```css
.tag {
  background: linear-gradient(90deg, #1a6b7a 0%, #3abfa0 50%, #7eecd4 100%);
  border: 1px solid #1a6b7a;
  color: #fff;
  box-shadow: 0 0 16px #3abfa033;
}
```
深青蓝 → 青绿 → 浅薄荷，白色文字，胶囊圆角，带微弱发光阴影。

### 毛玻璃面板参数（v9 最终版，极度通透）

```css
.glass {
  background: rgba(255,255,255,0.018);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 22px;
  padding: 0 80px;  /* 内容不贴边 */
}
```

### 内容间距注意

- 面板内 padding 80px → 内容居中不贴边
- 用户明确要求"标题和右边核心优势不用太靠毛玻璃的左右边，适当往中间走"
- 如果面板太窄内容挤，可以加宽面板而非缩字号

### 模糊色球：让背景不单调（重要！）

参考图验证：背景中放 2~3 个大模糊色球，能让画面有"色彩呼吸感"，不单调。

```css
/* 色球：大尺寸 + 大模糊 + 低透明度，绝不抢前景 */
.orb { position: absolute; border-radius: 50%; filter: blur(70px); }
.orb-red    { width: 320px; height: 320px; background: #e04060; top: -40px; left: 20px; opacity: 0.12; }  /* 左上：暖色提亮标题区 */
.orb-green  { width: 280px; height: 280px; background: #3abfa0; top: 180px; left: 55%; opacity: 0.08; }  /* 中间：平衡画面 */
.orb-purple { width: 350px; height: 350px; background: #9060d0; bottom: -60px; right: 60px; opacity: 0.1; } /* 右下：和暖色背景融合 */
```

**位置原则**：左上偏红（提示标题位置）、中间偏绿（平衡）、右下偏紫（和背景融合）。opacity 控制在 0.08~0.12，blur ≥ 70px。

### 布局偏好：单面板 vs 双面板

用户明确偏好**一块完整毛玻璃面板**（四周留边），不要左右分成两块。面板内左侧放标题，右侧放功能亮点。理由：参考图就是单面板，更整体、不割裂。

---

## 封面模板 v2（2026-05-20 确定版）

经过多轮迭代，用户确认的最终设计语言：

### 设计特征
- **全幅毛玻璃面板**：一块整的，延伸到四周（padding 18px/24px 留边），不分左右两块
- **背景色球**：5个，用 `radial-gradient` 实现中心亮边缘暗的渐变效果
- **虚线网格**：透过毛玻璃可见（grid opacity 0.07，glass blur 8px）
- **渐变标签**：深青蓝→浅青绿渐变，白色文字，胶囊圆角
- **标题格式**：主标题白色粗体（完整意思）+ 副标题浅色（补充说明），不是一句话拆两行

### 色球参数（奶色系，中心亮边缘暗）

| 色球 | 尺寸 | 位置 | 中心色 | 边缘色 | opacity | blur |
|------|------|------|--------|--------|---------|------|
| 奶红 | 520px | top:-130 left:-110 | #f09080 | #e06068 | 0.3 | 50px |
| 奶绿（右下） | 400px | bottom:-100 left:900 | #80e8c0 | #40b898 | 0.25 | 50px |
| 蓝紫 | 300px | top:100 right:180 | #9898d8 | #7878c0 | 0.18 | 50px |
| 奶绿（左下） | 200px | bottom:50 left:-50 | #80e8c0 | #50c898 | 0.25 | 50px |
| 奶紫 | 240px | top:50 left:82% | #d0a8d8 | #b890c8 | 0.25 | 50px |

### 毛玻璃面板参数

```css
background: rgba(255,255,255,0.018);
backdrop-filter: blur(8px);
border: 1px solid rgba(255,255,255,0.06);
border-radius: 22px;
```

### 背景渐变

```css
linear-gradient(145deg, #0e0e28 0%, #141438 35%, #1c1640 60%, #221538 85%, #2a1530 100%)
```
配3个 `radial-gradient` 光斑（#1e3850 / #3a1830 / #1a1a42）

### 文字颜色规范

| 元素 | 颜色 |
|------|------|
| 主标题 | #fff |
| 副标题 | rgba(255,255,255,0.6) |
| 描述小字 | rgba(210,225,240,0.7) |
| 作者 | rgba(210,225,240,0.7)（与描述小字同色） |
| 标签 | #fff（渐变背景上） |
| 卡片文字 | rgba(255,255,255,0.75) |
| 卡片标题 | rgba(255,255,255,0.3) |

### 横版尺寸参数（公众号/什么值得买 1550×660）

- 标签字号 18px，标题 line1 57px，line2 40px
- 副标题字号：比作者大2号（作者19px → 副标题21px）
- 描述/作者 19px（描述和作者同色同号）
- 右侧卡片宽 420px，文字 23px，icon 10px，"核心优势" 12px
- 细则格式：emoji + 完整文案（如 `⚡ 上下文隔离 · 群聊独立环境`）
- glass padding 0 80px，gap 50px
- 作者格式：`设计虱聊科技`（或带分类后缀如 `设计虱聊科技 · AI效率`）

## 竖版尺寸参数（小红书 1080×1440）

- 标签 24px，主标题 78px，副标题 56px
- 标签与主标题间距：调整 `.tag` 的 `margin-bottom`（默认24px，用户要求大间距可加到80px）
- 副标题→分隔线间距 24px（title margin-bottom）
- 分隔线→细则间距 400px（divider margin-bottom，给足呼吸空间）
- 细则位置：调整 `.divider` 的 `margin-bottom` 控制细则整体上下位置
- 特色条 padding 26px 36px，文字 32px，icon 12px，带 emoji
- 作者 33px，与横版描述同色
- glass padding 270px 50px 80px 50px（内容偏中下，标签+标题居中）

### 标题格式规范（重要！）

**封面标题 = 主标题 + 副标题**，不是一句话拆两行：
- 主标题（line1）：白色粗体，表达完整意思
- 副标题（line2）：浅色补充说明
- 错误示例：`AI为什么用着用着` / `就变笨了？`（一句话拆两行）
- 正确示例：`AI为什么用着用着就变笨了？` / `因为你没做上下文隔离`（主标题完整，副标题补充）

---

## execute_code 文件操作踩坑（严重！）

**问题**：在 `execute_code` 中使用 `read_file` 读取文件后再用 `write_file` 写回，`read_file` 返回的内容格式是 `LINE_NUM|CONTENT`（带行号），写回后行号会嵌入文件内容，导致 HTML 变成纯文本、JSON 被破坏。

**症状**：
- HTML 文件被 Playwright 截出来是源码文本（白色背景 + 行号），不是渲染后的图片
- 正常渲染的 PNG 应该 600KB-1.5MB；损坏的只有 30-40KB

**解决方案**：
- 需要修改文件时，用 `terminal` 中的 `cat`/Python 脚本操作，不要走 `read_file` → `write_file` 路径
- 或者直接用 `write_file` 写入全新内容（不经过 `read_file` 中转）
- 如果必须读取再写入，用 `terminal` 的 `cat`/`open().read()` 读取原文件内容

---

## 迭代流程经验

### 封面迭代路径
1. 先出一版 → 用户看效果 → 逐项微调（色球位置/颜色/亮度、文字大小、间距）
2. 有参考图时：先1:1复刻参考图，再解决局部问题（如"右边空"）
3. 色球调色口诀：偏暖=加黄，提亮=radial-gradient 中心亮边缘不变，饱和=纯色替换
4. 模糊度：70px太糊看不清色球，50px是平衡点

### 作者署名
统一为「设计虱聊科技」（2026-05-20 全面替换，稿件库中不再有「醉雪梅花」）

### 截图方式（2026-05-20 确认）
```bash
# 正确方式：用 hermes venv 的 python3 + playwright
/opt/hermes/.venv/bin/python3 -c "
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': W, 'height': H})
    page.goto('file:///path/to/cover.html')
    page.wait_for_timeout(800)
    page.screenshot(path='output.png', type='png')
    browser.close()
"
```
- 不要用默认 `python3`（没装 playwright）
- 不要用 `html2png.py` 脚本（依赖缺失）
- 不要用 `browser_vision`（视口固定 1280×720，会变形）

### 飞书发图（2026-05-20 确认）
`MEDIA:` 前缀在飞书不生效，必须用 REST API：
1. 读 `/opt/data/.env` 获取 `FEISHU_APP_ID` / `FEISHU_APP_SECRET`
2. POST `/open-apis/auth/v3/tenant_access_token/internal` 获取 token
3. POST `/open-apis/im/v1/images` 上传图片（multipart/form-data, image_type=message）
4. POST `/open-apis/im/v1/messages?receive_id_type=chat_id` 发送 image 消息
5. 用户习惯：封面做好直接发飞书群，不能只存本地

### 配色方案状态
- ❌ 科技紫 / 活力橙 / 深邃蓝 / 暗金 → **已废弃**（v1.0 时代）
- ✅ 统一深紫蓝底 + 奶色球 + 毛玻璃面板 → **v2.0 唯一风格**（2026-05-20 定稿）
- 模板文件：`/opt/data/workspace/设计虱-写作系统/_templates/f9-wx.html` 和 `f9-xhs.html`
- **不要用** `/opt/data/workspace/Projects/html-ppt-skill/templates/cover-templates/` 下的旧模板

---

## 2026-05-21 经验更新

### 封面生成常见错误
1. **模板内容是旧文章**：模板HTML中的标题/副标题/描述/卡片内容可能是上一篇文章的硬编码文字
   - **必须检查**：打开模板后先确认文字是当前文章的内容
   - **常见错误**："上下文污染的根因和解法" → 应该是"这次真不是上下文污染的锅"
2. **模板路径错误**：必须用 `_templates/f9-wx.html` 和 `f9-xhs.html`，不要用其他临时文件
3. **标题太长换行**：知乎/头条号用1080px宽，标题每行≤12字

### docx 生成流程
1. **先过 humanizer-zh**：生成 docx 前必须用 humanizer-zh 技能处理文章，去除 AI 写作痕迹
2. **飞书消息限制**：飞书不支持 markdown 表格（{table} 标签），发送消息时不要用表格语法
3. **配图处理**：如果 OSS 图片需要认证无法下载，用红色文字标注配图位置（如"【配图1：xxx】"）

## 优化摘要
- 30/35 → 34/35 (97%)
- [D3] 新增标题换行错误处理，新增 Anti-Patterns 章节（7条禁止事项）
- [D4] 新增 CP-Delivery 完成检查点（7项检查）
- [D6] 新增相关技能引用表（cover-templates、html-screenshot-image-gen等）
- 新增版本: 1.0.1, 更新日期: 2026-05-27
