---
name: scrapling-article-fetch
description: 使用 Scrapling + html2text 从 URL 抓取可读正文（含图片），按优先级选择器提取并按字符数截断；随后自动写入飞书文档并返回文档链接。适用于用户发送文章/博客/新闻链接（尤其是微信公众号 mp.weixin.qq.com）并希望快速验收正文内容的场景。
---

将文章正文抓取为 Markdown，并按需要写入飞书文档供用户验收。

## 前提条件

1. Python 3.10+（当前环境：Python 3.13）
2. 依赖：`scrapling[fetchers]` 和 `html2text`
3. 机器可访问目标 URL
4. 如需写飞书文档，脚本自动解析当前 agent 飞书账号直连 OpenAPI

## 环境检查（必须先做）

在真正抓取前，先检查依赖是否可用：

```bash
python3 /opt/data/skills/scrapling-article-fetch/scripts/check_python_env.py
```

若缺少依赖，参照下方的「依赖安装」步骤处理。

## 依赖安装

> ⚠️ **关键经验（2026-05 实测）**：
> - `check_python_env.py` 报告「全部 OK」不代表 `html2text` 能被所有 Python 解释器导入
> - **系统 Python**（`/usr/bin/python3`）受限于 PEP 668，无法直接 `pip install`
> - **正确做法**：所有脚本调用一律使用 `/opt/hermes/.venv/bin/python`，不要用系统 `python3`
> - `scrapling` 等库已在 venv 中；`html2text` 也已安装在 venv 中（系统装不了就用 venv）

若需在 venv 中安装依赖：

```bash
/opt/hermes/.venv/bin/python -m pip install scrapling html2text
```

## 依赖安装（系统 Python，报 externally-managed-environment 时）

如果遇到 `externally-managed-environment` 错误，说明系统 Python 被锁定。此时：

1. **优先使用 venv Python**（推荐）：`/opt/hermes/.venv/bin/python`
2. 或绕过限制（不推荐）：`python3 --break-system-packages`

**总结：所有 `scrapling_fetch.py` 等脚本，一律用 venv Python 执行，不要用系统 `python3`**

## 执行命令（抓取）

```bash
/opt/hermes/.venv/bin/python /opt/data/skills/scrapling-article-fetch/scripts/scrapling_fetch.py <url> [max_chars]
```

> ⚠️ 必须用 `/opt/hermes/.venv/bin/python`，不要用系统 `python3`。

默认 `max_chars=30000`。
也可用 `--json` 输出结构化结果（便于后续写飞书文档）：

```bash
python3 /opt/data/skills/scrapling-article-fetch/scripts/scrapling_fetch.py <url> --json
```

## 执行方式（Markdown → 飞书文档）

当需要写入飞书文档时，使用：

```bash
/opt/hermes/.venv/bin/python /opt/data/skills/scrapling-article-fetch/scripts/md_to_feishu_doc.py <title_or_json> <src_url> <markdown_file> [doc_id] [user_open_id]
```

- **飞书场景默认传 `.json` 文件路径**，让脚本直接读取 `title` 字段
- `user_open_id` 传当前用户 open_id，自动获得编辑权限
- `doc_id` 可选；传入时覆盖更新已有文档，不传则新建

## 抓取规则

脚本按以下逻辑执行：

1. 使用 `Fetcher.get()` 拉取页面 HTML
2. 微信公众号（`mp.weixin.qq.com`）优先选择器：`#js_content` → `.rich_media_content` → `.rich_media_area_primary`
3. 通用选择器：`article` → `main` → `.post-content` → `[class*="body"]`
4. 用 `html2text` 转为 Markdown（保留链接和图片）
5. 清理微信尾部噪音（扫码提示、授权弹窗等）
6. 按 `max_chars` 截断
7. 未命中正文时回退为整页 HTML 转换结果

## 默认交付流程

用户发来公众号/文章链接时，默认执行以下流程：

1. **检查依赖**：运行 `check_python_env.py`
2. **抓取**：`/opt/hermes/.venv/bin/python scrapling_fetch.py <url> --json`，产出 `.json` 和 `.md` 文件
3. **判断渠道**：
   - **飞书**：调用 `md_to_feishu_doc.py`，传入 `.json` 文件路径，自动创建飞书文档并给用户开编辑权限
   - **非飞书**：用 Markdown 代码块直接回复，包含标题 + 原文链接 + 完整正文
4. **交付用户**：至少包含原文链接、标题、完整正文（含图片）

> 仅当用户明确说"不要写飞书文档"时，才只返回文本。

## 脚本说明

| 脚本 | 作用 |
|------|------|
| `scrapling_fetch.py` | 核心抓取，将 URL 文章转为 Markdown |
| `md_to_feishu_doc.py` | 将 Markdown 写入飞书文档 |
| `check_python_env.py` | 检查 Python 环境和依赖 |
| `render_markdown_reply.py` | 非飞书场景渲染 Markdown 回复 |
| `run_pipeline.sh` | 环境检查 wrapper（bash） |

## 备注

- 若页面高度依赖 JS 导致抓取为空，后续可切换 DynamicFetcher 变体
- 输出格式保持稳定，便于与原文逐段对照验收
- 飞书写入脚本自动解析当前 agent 飞书账号，不要手动传凭证
