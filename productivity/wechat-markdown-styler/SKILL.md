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
claude, cli, color-pop, cyber, **dark-green**🆕, default, fireworks, girl-pink, grass, lavender-purple, macarons, newyear, notebook-purple🆕, parrotalk, purple-yellow-pop, sunrise, winter

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

### 根因
`parse_markdown_for_wechat` 输出混入 `<style>` 标签，微信不支持。

### 修复
```python
# 开头强制移除所有 <style> 标签
html = re.sub(r'<style[^>]*>[\s\S]*?</style>', '', html, flags=re.IGNORECASE)
# <div id="wenyan"> 加内联样式
html = re.sub(r'<div id="wenyan">', '<div id="wenyan" style="max-width:700px;...">', html)
```

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

### 常见问题

### Flask 找不到模块
venv 里没装 flask → `/opt/hermes/.venv/bin/python3 -m pip install flask`

### Git push 失败 "could not read Password"
Token 过期或未配置 → 重新生成 GitHub PAT（需 `repo` scope）→ 更新 remote URL：
```bash
git remote set-url origin "https://liumeixin:${TOKEN}@github.com/liumeixin/wenyan-editor.git"
```
或用 SSH key（需先 `ssh-keygen` + 添加到 GitHub Settings → Keys）

### __pycache__ 导致旧代码
`rm -rf __pycache__` 后重启

### 文件丢失
项目曾被 git refactor 清空过 `wenyan-data/`，需从备份恢复或重建
