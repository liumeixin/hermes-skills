---
name: wechat-markdown-styler
description: 文言 Markdown 排版器 - 微信公众号/小红书排版工具，支持一键换肤、元素混搭、自定义主题
---

# 文言 Markdown 排版器 (wenyan-editor)

## 项目结构（2026.05 最终版）

```
wenyan-editor/                    # GitHub 仓库根目录
├── .github/workflows/docker-publish.yml  # GHCR 自动构建
├── docker-compose.yml            # 根目录（旧版，可忽略）
├── backend/
│   ├── app.py                    # Flask 应用（12 个 API）
│   ├── markdown_parser.py        # MD → 语义化 HTML / 内联样式 HTML
│   └── static/css/themes/        # 16 个主题 CSS 文件
├── frontend/
│   ├── index.html                # 前端 UI
│   ├── themes.json               # 主题 CSS 集合（key-value，CSS 字符串）
│   ├── dimensions.json           # 维度混搭配置（CSS 片段 per theme per dimension）
│   └── ...
└── wenyan-data/                  # Docker 部署目录（可独立运行）
    ├── app.py, markdown_parser.py, ...
    ├── docker-compose.yml        # image: ghcr.io/liumeixin/wenyan-data:latest
    └── custom_themes.json        # 自定义主题持久化
```

### 关键路径映射
- GitHub 仓库：`liumeixin/wenyan-editor`
- Docker 镜像：`ghcr.io/liumeixin/wenyan-data:latest`
- NAS 部署：`wenyan-editor/wenyan-data/` 目录
- 端口：NAS 18080 → 容器 8080

## 架构

### 双层主题系统
1. **内置主题**：`frontend/themes.json` 存储 CSS 字符串（key=主题名，value=完整 CSS）
2. **维度混搭**：`frontend/dimensions.json` 存储 CSS 片段（key=维度名，value={主题名: CSS片段}）
3. **自定义主题**：`wenyan-data/custom_themes.json` 服务端持久化

### 19 个维度（dimensions.json）
| 维度 | 说明 |
|------|------|
| background | 背景色/图案 |
| text-color | 正文颜色 |
| h1, h2, h3h6 | 标题样式 |
| bold, italic | 强调样式 |
| blockquote | 引用块 |
| inline-code, code-block | 代码样式 |
| ul, ol | 列表样式 |
| links | 链接样式 |
| table | 表格样式 |
| image | 图片样式 |
| hr | 分割线 |
| footnote | 脚注 |
| spacing | 间距 |
| **typography** | 排版（字号/行高/字间距/字体）🆕 |

### 17 个内置主题
claude, cli, color-pop, cyber, dark-green, default, fireworks, girl-pink, grass, lavender-purple, macarons, newyear, notebook-blue🆕, notebook-purple, parrotalk, purple-yellow-pop, sunrise, winter

### 8 个 API
| 接口 | 方法 | 说明 |
|------|------|------|
| `/convert` | POST | MD → 语义化 HTML（预览） |
| `/convert-inline` | POST | MD → 内联样式 HTML（公众号，**剥离 `<style>` 标签**） |
| `/api/themes` | GET | 主题列表 |
| `/api/dimensions` | GET | 维度配置 |
| `/api/theme-css/<id>` | GET | 主题 CSS |
| `/api/custom-themes` | GET/POST | 自定义主题 CRUD |
| `/api/custom-themes/<id>` | DELETE | 删除自定义主题 |

## 部署

### Docker（推荐）
```bash
git clone https://github.com/liumeixin/wenyan-editor.git
cd wenyan-editor/wenyan-data
docker compose up -d
# 访问 http://localhost:18080
```

### docker-compose.yml
```yaml
services:
  wenyan:
    image: ghcr.io/liumeixin/wenyan-data:latest
    container_name: wenyan
    restart: unless-stopped
    ports:
      - "18080:8080"
    volumes:
      - ./:/app
    environment:
      - TZ=Asia/Shanghai
```

### GitHub Actions
Push 到 main → 自动构建 Docker 镜像 → 推送到 GHCR
工作流：`.github/workflows/docker-publish.yml`

### 改代码不重建镜像
`docker-compose.yml` 用 volume 挂载整个项目目录，改代码只需 `docker restart wenyan`

## 微信公众号复制修复

### 问题 1：style 标签不支持
`parse_markdown_for_wechat` 输出混入 `<style>` 标签，微信不支持。

```python
# 开头强制移除所有 <style> 标签
html = re.sub(r'<style[^>]*>[\s\S]*?</style>', '', html, flags=re.IGNORECASE)
# <div id="wenyan"> 加内联样式
html = re.sub(r'<div id="wenyan">', '<div id="wenyan" style="max-width:700px;...">', html)
```

### 问题 2：复制按钮粘贴出纯文本代码（2026-05-16 修复）
**根因**：`copyHtml()` 用 `navigator.clipboard.writeText(fullHtml)` 复制 HTML，但 `writeText()` 把 HTML 当 **text/plain** 放入剪贴板。公众号编辑器粘贴时识别为纯文本，所以显示为代码。

**修复**：改用 selection + `execCommand('copy')`，浏览器会将选区的渲染 HTML 以 **text/html** MIME 写入剪贴板：

```javascript
// 核心思路：创建临时 div → 渲染 HTML → 选中 → 复制
const tmp = document.createElement('div');
tmp.innerHTML = fullHtml;
tmp.style.position = 'fixed';
tmp.style.left = '-9999px';
document.body.appendChild(tmp);

const range = document.createRange();
range.selectNodeContents(tmp);
const sel = window.getSelection();
sel.removeAllRanges();
sel.addRange(range);

let ok = false;
try { ok = document.execCommand('copy'); } catch (e) {}
sel.removeAllRanges();
document.body.removeChild(tmp);
// fallback: ClipboardItem with text/html MIME
```

**涉及文件**：`frontend/standalone.html` 和 `frontend/index.html` 的 `copyHtml()` 函数。两个文件要同步修改。

## dimensions.json 结构（重要！）

不是 CSS 变量，是 **CSS 片段 per theme**：
```json
{
  "background": {
    "claude": "#wenyan { background-color: #FAFAF8; }",
    "cli": "#wenyan { background-color: #121212; }",
    "dark-green": "#wenyan { background-color: #1e1e1e; }"
  },
  "typography": {
    "default": "#wenyan { font-size: 16px; line-height: 1.75; }",
    "elegant": "#wenyan { font-family: Georgia, serif; font-size: 17px; }",
    "tech": "#wenyan { font-family: monospace; font-size: 15px; }"
  }
}
```

## 新建主题工作流（Theme Development）

### CSS 源文件位置
- **源文件目录**：`/opt/data/cache/documents/xhs-css-extract/`
- 每个主题一个 `.css` 文件，命名即主题 ID（如 `notebook-purple.css`）
- `default (1).css` 会被 build 跳过（重复）

### 构建流程
```bash
# 1. 在源文件目录创建 CSS（参照 claude.css 格式）
# 2. 从 repo 根目录运行 build：
cd /path/to/wenyan-editor
python3 frontend/build.py
# 输出：themes.json, dimensions.json, manifest.json
# 3. 提交并推送到 GitHub → 自动触发 Docker 镜像构建
git add -A && git commit -m "feat: add XXX theme" && git push
```

### build.py 关键配置
- `CSS_DIR = Path("/opt/data/cache/documents/xhs-css-extract")` — CSS 源文件目录
- `theme_display` 字典 — 主题显示名（需手动添加，格式 `"id": "显示名"`）
- `DIMENSIONS` 字典 — 18 个维度的 CSS 选择器匹配规则

### CSS 文件格式规范
每个主题 CSS 需覆盖 `#wenyan` 下的所有选择器，build 脚本按维度自动分类：

```css
/* 主题名 */
#wenyan {
    font-family: var(--sans-serif-font);
    line-height: 1.8;
    font-size: 16px;
    color: #333333;
}
#wenyan h1 { /* ... */ }
#wenyan h1 span { /* ... */ }
#wenyan h1::before { /* 标题前缀 */ }
#wenyan h1::after { /* 标题后缀（如装饰线） */ }
#wenyan h2::before { /* 二级标题前缀（如左侧竖线） */ }
#wenyan h3 { /* 三级标题 */ }
#wenyan p strong { /* 加粗 */ }
#wenyan p em { /* 斜体 */ }
#wenyan blockquote { /* 引用块 */ }
#wenyan blockquote::before { /* 引用块前缀（如引号图标） */ }
#wenyan p code, #wenyan li code { /* 行内代码 */ }
#wenyan pre { /* 代码块外围 */ }
#wenyan pre code { /* 代码块内容 */ }
#wenyan ul > li::marker { /* 列表标记 */ }
#wenyan hr { /* 分割线 */ }
#wenyan a { /* 链接 */ }
#wenyan img { /* 图片 */ }
#wenyan table, #wenyan table th, #wenyan table td { /* 表格 */ }
```

### 维度匹配规则（DIMENSIONS 字典）
build.py 通过选择器正则将 CSS 块分类到 18 个维度：
| 维度 | 匹配的选择器 |
|------|------------|
| background | `#wenyan`（仅背景相关属性） |
| text-color | `#wenyan`（color/font-family/font-size） |
| h1 | `#wenyan h1`, `#wenyan h1 span`, `#wenyan h1::before/after` |
| h2 | `#wenyan h2`, `#wenyan h2::before/after` |
| h3h6 | `#wenyan h[3-6]` |
| bold | `#wenyan strong` |
| italic | `#wenyan em` |
| blockquote | `#wenyan blockquote`, `#wenyan blockquote p`, `blockquote::before/after` |
| inline-code | `#wenyan p code`, `#wenyan li code`（排除 `pre code`） |
| code-block | `#wenyan pre`, `#wenyan pre code`, `pre::before/after` |
| ul | `#wenyan ul`, `#wenyan ul li`, `ul li::before/marker` |
| ol | `#wenyan ol`, `#wenyan ol li`, `ol li::before/marker` |
| links | `#wenyan a` |
| table | `#wenyan table`, `table th/td/tr/thead` |
| image | `#wenyan img` |
| hr | `#wenyan hr`, `hr::before/after` |
| footnote | `.footnote`, `#footnotes`, `.footnote-num/txt` |
| spacing | `#wenyan p`（仅 letter-spacing） |

### 手机预览模式（2026-05-16 新增）

预览栏有「📱 手机」按钮，点击切换 375px 手机外壳模拟：

- **实现**：动态创建 `.phone-frame` div（圆角 32px + 刘海 + 状态栏），将 `#wenyan` 移入
- **CSS 关键**：`#preview-scroll.phone-mode #wenyan { max-width: 100% !important; }` 覆盖默认 700px
- **切换逻辑**：`togglePhonePreview()` 函数在 `standalone.html` 和 `index.html` 中同步实现
- **涉及文件**：`frontend/standalone.html`、`frontend/index.html`（CSS + HTML 按钮 + JS 函数）

## 微信公众号背景兼容性（2026-05-16 最终结论）

**核心结论**：微信公众号编辑器**只支持 `background-color`（纯色）**，所有背景图方案都会被剥离。

**三种方案全部验证失败**：
| 方案 | 结果 | 原因 |
|------|------|------|
| `background-image: linear-gradient(...)` inline style | ❌ | 微信不支持该 CSS 属性 |
| SVG data URI → 内联 `<svg>` 元素 | ❌ | 微信粘贴时剥离 `<svg>` 标签 |
| `<style>` 标签内 CSS | ❌ | 微信直接剥掉 `<style>` 标签 |

**微信支持的背景 CSS（实测确认）**：
| 属性 | 支持 | 说明 |
|------|------|------|
| `background-color` | ✅ | 唯一可用的背景方案 |
| `background-image` (任何形式) | ❌ | linear-gradient、SVG data URI 均不支持 |
| `border`, `border-radius`, `box-shadow` | ✅ | 装饰性属性可用 |

**xhs.pro 的真实行为**：
- 源码 `getExportHtml()` 主动调用 `removeProperty("background-image")` 剥离所有背景图
- 网格/图案背景**仅用于编辑器预览和小红书图片生成**，不进公众号
- 公众号粘贴后背景也会丢失，和我们的 wenyan 一样

**copyHtml() 最终实现**（仅提取 background-color）：
```javascript
// 只提取 background-color 和 padding，跳过 background-image
const bgProps = ['background-color', 'padding'];
```

**涉及文件**：`frontend/standalone.html` 和 `frontend/index.html` 的 `copyHtml()` 函数。两文件同步修改。

### Flask 304 缓存问题（2026-05-16）

Flask 开发服务器默认不设 `Cache-Control`，浏览器会缓存 JSON 文件。更新 CSS/主题后前端仍显示旧版本。

**修复**：在 `app.py` 的 `after_request` 中对 JSON 文件加 no-cache 头：
```python
@app.after_request
def after_request(response):
    if request.path.endswith('.json'):
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return response
```

### 剪贴板 API 调试注意

- `document.addEventListener('copy', ...)` 只能拦截 `document.execCommand('copy')`，**不能**拦截 `navigator.clipboard.write()`
- 用 `navigator.clipboard.read()` 读剪贴板需要页面焦点，控制台直接调会报 `NotAllowedError`
- 调试 xhs.pro 等使用 Clipboard API 的站点，需要覆盖 `navigator.clipboard.write` 原型

### 常见问题

### Flask 找不到模块
venv 里没装 flask → `/opt/hermes/.venv/bin/python3 -m pip install flask`

### Git push 失败 "could not read Password"
Token 过期或未配置。**用 `/opt/data/workspace/Projects/wenyan-editor`（remote URL 内嵌 token），不要用 `/tmp` 克隆的副本。**
```bash
# 正确路径（有 token）
cd /opt/data/workspace/Projects/wenyan-editor
# 从 /tmp 复制改动过去再 push
cp /tmp/wenyan-editor/wenyan-data/static/css/themes/XXX.css wenyan-data/static/css/themes/
cp /tmp/wenyan-editor/frontend/{build.py,themes.json,dimensions.json,manifest.json} frontend/
git add -A && git commit -m "..." && git push origin main
```
⚠️ `/opt/data/.env` 里的 `GITHUB_TOKEN` 已过期，不能用于 API 调用（401）。检查 CI 状态用公开 API 无 auth 即可（public repo）。如需 API 访问，重新生成 PAT 并更新 remote URL。

### __pycache__ 导致旧代码
`rm -rf __pycache__` 后重启

### 文件丢失
项目曾被 git refactor 清空过 `wenyan-data/`，需从备份恢复或重建
