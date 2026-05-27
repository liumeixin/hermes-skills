---
name: scrapling-article-fetch
description: 使用 Scrapling + html2text 从 URL 抓取可读正文（含图片），按优先级选择器提取并按字符数截断；随后自动写入飞书文档并返回文档链接。适用于用户发送文章/博客/新闻链接（尤其是微信公众号 mp.weixin.qq.com）并希望快速验收正文内容的场景。
version: 2.0
updated: 2026-05-28
---

> ⚠️ **Golden Rule — 永远用 venv Python**
> 所有脚本调用一律使用 **`/opt/hermes/.venv/bin/python`**，不要用系统 `python3`。
> 系统 Python（PEP 668）无法 `pip install`，且 `check_python_env.py` 报告 OK ≠ 能被所有解释器导入。
> 以下各节不再重复此警告。

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

## 依赖安装（版本参考：scrapling≥0.4.0, html2text≥0.2.0）

> 版本锁定：`scrapling[fetchers]>=0.4.0`, `html2text>=0.2.0`

若需在 venv 中安装依赖：

```bash
/opt/hermes/.venv/bin/python -m pip install scrapling html2text
```

## 依赖安装排障（externally-managed-environment）

如遇 `externally-managed-environment`，说明系统 Python 被锁定。直接使用 venv Python 即可（见上方 Golden Rule）。
不推荐 `python3 --break-system-packages` 绕过方式。

## 执行命令（抓取）

```bash
/opt/hermes/.venv/bin/python /opt/data/skills/scrapling-article-fetch/scripts/scrapling_fetch.py <url> [max_chars]
```

默认 `max_chars=30000`。
也可用 `--json` 输出结构化结果（便于后续写飞书文档和管道检查点验证）：

```bash
/opt/hermes/.venv/bin/python /opt/data/skills/scrapling-article-fetch/scripts/scrapling_fetch.py <url> --json
```

## 执行方式（Markdown → 飞书文档）

当需要写入飞书文档时，使用：

```bash
/opt/hermes/.venv/bin/python /opt/data/skills/scrapling-article-fetch/scripts/md_to_feishu_doc.py <title_or_json> <src_url> <markdown_file> [doc_id] [user_open_id]
```

- **飞书场景默认传 `.json` 文件路径**，让脚本直接读取 `title` 字段
- `user_open_id` 传当前用户 open_id，自动获得编辑权限
- `doc_id` 可选；传入时覆盖更新已有文档，不传则新建

## 管道检查点（Pipeline Checkpoints）

脚本执行过程分为 3 个检查点，确保每步可验证：

### CP1: 抓取后验证（Post-Fetch）
抓取完成后立即检查：
1. **内容非空**：HTML 页面拉取成功，`scrapling_fetch.py --json` 输出中 `content_len > 0`
2. **选择器匹配**：确认至少一个选择器命中正文（`selector_hit: true`）
- 若为空或未命中 → 触发 CP2 回退

### CP2: 回退触发（Fallback）
CP1 失败时自动尝试：
1. 用 `DynamicFetcher` 替代 `Fetcher` 拉取（处理 JS 渲染页面）
2. 若仍为空 → 输出明确错误，不静默吞掉
- **触发条件**：`content_len == 0` 或 `selector_hit == false`

### CP3: 交付确认（Post-Delivery）
交付前最终校验：
1. Markdown 输出长度 > 100 字符（排除空白/错误页）
2. 标题字段非空
3. 飞书文档创建成功后返回 `doc_id`（若有）
- 若不满足 → 向用户说明失败原因，不输出空文档

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

用户发来公众号/文章链接时，按以下流程（含检查点）执行：

1. **检查依赖**：运行 `check_python_env.py` ✅ CP0
2. **抓取**：`scrapling_fetch.py <url> --json` → ✅ CP1 验证
3. **CP1 失败？** → 尝试 DynamicFetcher → ✅ CP2 验证
4. **判断渠道**：
   - **飞书**：调用 `md_to_feishu_doc.py`，传入 `.json` 文件路径，自动创建飞书文档
   - **非飞书**：用 Markdown 代码块直接回复
5. **交付用户**：至少包含原文链接、标题、完整正文（含图片）→ ✅ CP3 确认

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

- 输出格式保持稳定，便于与原文逐段对照验收
- 飞书写入脚本自动解析当前 agent 飞书账号，不要手动传凭证

## 相关链接

- **Scrapling 文档**: https://github.com/D4Vinci/Scrapling
- **html2text 文档**: https://github.com/Alir3z4/html2text
- **Scrapling PyPI**: https://pypi.org/project/scrapling/
- **html2text PyPI**: https://pypi.org/project/html2text/
