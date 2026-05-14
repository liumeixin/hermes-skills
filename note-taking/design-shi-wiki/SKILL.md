---
name: design-shi-wiki
description: 设计虱知识库管理 - 知识入库、索引更新、内容迁移
---

# 设计虱知识库管理

**路径：** `/opt/data/workspace/设计虱-知识库/`

**知识库结构：**

```
设计虱-知识库/
├── AGENT.md      ← 行为配置（每次先读）
├── raw/ ← 原始资料层（只读，不可修改）
├── wiki/ ← 知识库层（AI Agent 全权维护）
│   ├── index.md ← 内容索引
│   ├── log.md ← 变更日志
│   ├── 实体/ ← 人、公司、产品等
│   ├── 概念/ ← 原理、方法论、技术术语
│   ├── 来源/ ← 原始资料摘要
│   └── 对比/ ← 横向对比分析
└── 技术/ ← 技术层
```

---

## 查看知识库

```bash
# 查看目录结构
ls -la /opt/data/workspace/设计虱-知识库/

# 查看 wiki 目录
ls -la /opt/data/workspace/设计虱-知识库/wiki/

# 查看索引
cat /opt/data/workspace/设计虱-知识库/wiki/index.md
```

---

## 知识入库

### 入库检查清单（每次入库必做）

收到新文章时，按以下顺序操作：

0. **可读性预检** → 先 `ls -la raw/`，检查文件 owner 和权限。owner 非当前用户（如 uucp）或权限为 0 的文件无法读取，列出清单报告给用户，不要逐个尝试
0. **入库前先查重** → 用 `search_files` 搜索 wiki/ 目录中是否已有相关页面（按关键词/实体名搜）。**若有，必须增强现有页面（合并新内容到已有页），而不是创建新的重复页面**
0. **判断入库还是更新** → 若现有页面内容已覆盖新文章核心信息，只补充 relates_to 反向链接；若现有页面信息不足，在其基础上扩充
1. **写入新页面** → `wiki/来源/来源-标题.md`，Frontmatter 必须包含 `confidence`、`memory_layer`、`relates_to`
2. **索引** → 更新 `wiki/index.md`，在对应分类下追加
3. **双向链接** → 检查现有相关页面，在其 `relates_to` 字段追加反向链接
4. **变更日志** → 以 `## YYYY-MM-DD` 分组格式追加到 `wiki/log.md`

### 1. 保存原始资料 → raw/

```bash
# 移动或复制原始文件到 raw/
cp /source/path/file.md /opt/data/workspace/设计虱-知识库/raw/文件名.md
```

**raw/ 目录管理约定（重要）**：

- `raw/` 是未处理的原始文章存放处，**不可删除、不可修改**
- 已完成入库的文章统一移动到 `raw/processed/` 子目录
- `raw/processed/` 保留原始文件存档，方便以后参考查阅
- **不要用 `.processed` 后缀**（影响其他阅读器打开体验）
- 每次执行"检查 raw 并入库"任务时，同步将已处理文件移到 `raw/processed/`

### 2. 创建来源摘要 → wiki/来源/

文件名格式：`来源-标题.md`

Frontmatter：
```yaml
---
type: source
tags: [tag1, tag2]
sources: [原始文件名或 URL]
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: 0.5
memory_layer: episodic
relates_to:
  - [implements, [[目标概念]]]
  - [example_of, [[相关实体]]]
---
```

### mhtml 文件解析（微信公众号导出格式）

微信导出的 `.mhtml` 文件是 MIME 多部分格式，用 Python `email` 库解析：

```python
import email
from email import policy
import re

with open('xxx.mhtml', 'rb') as f:
    raw_data = f.read()

msg = email.message_from_bytes(raw_data, policy=policy.default)
html_content = None
for part in msg.walk():
    if part.get_content_type() == 'text/html':
        payload = part.get_payload(decode=True)
        if payload:
            charset = part.get_content_charset() or 'utf-8'
            html_content = payload.decode(charset, errors='replace')
            break

# Strip HTML tags
text = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL)
text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
text = re.sub(r'<[^>]+>', '', text)
text = re.sub(r'\\n{3,}', '\\n\\n', text)
text = text.strip()
```

常用查找路径：
- `/opt/data/cache/documents/` — 飞书/微信转发文件常在此
- `/opt/data/shared-context/` — 共享文件
- `find / -name "*.mhtml" 2>/dev/null` — 全盘搜索

### Web 抓取失败时的备选方案

当目标文档是 SPA（单页应用）时，curl 和 web_extract 均无法获取正文内容。

**备选路径优先级：**
1. **GitHub 替代**：很多项目的 README/docs 同时托管在 GitHub，URL 格式 `github.com/{org}/{repo}/blob/main/{path}`
2. **搜索引擎**：用 `site:github.com {项目名}` 或 `site:docs.{域名}.com` 找镜像
3. **Web Archive**：搜索 `web.archive.org` 看是否有历史快照
4. **搜索引擎摘要**：Google/Bing 搜索结果片段通常包含关键信息

**platform.sensenova.cn 实测记录：** 官方文档是 Next.js SPA，`curl` 和 `web_extract` 均返回 404 或空内容。实际分析改用 GitHub（SenseNova-Skills 仓库）+ 搜索引擎（商汤/火山引擎相关文章）。

### 3. 创建知识页面 → wiki/实体/、wiki/概念/、wiki/对比/

根据内容类型选择目录：
- **实体**：`wiki/实体/人名.md` 或 `wiki/实体/公司名.md`
- **概念**：`wiki/概念/概念名.md`
- **对比**：`wiki/对比/对比-主题.md`

Frontmatter：
```yaml
---
type: entity | concept | comparison
tags: [tag1, tag2]
sources: [来源文件名]
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: 0.5
memory_layer: semantic
relates_to:
  - [refines, [[相关概念]]]
  - [relates_to, [[hot.md]]]
---
```

**对比页额外字段**：
```yaml
sources: [[概念A]], [[概念B]]  # 引用对比的源页面
```

对比页内容模板：
```markdown
# {概念A} vs {概念B}

## 核心区别

| 维度 | {概念A} | {概念B} |
|------|---------|---------|

## {适用场景/优势}

## {适用场景/优势}

## 关键洞察
> 一句话总结
```

### 4. 同步双向 relates_to 链接

创建新页面后，必须检查相关页面是否需要追加反向链接：

```python
# 例如：新增了来源页 [[微信转发自动编入LLM Wiki]]
# 需要在以下页面追加反向链接：
# - wiki/概念/LLM-Wiki.md → relates_to 添加 [refines, [[微信转发自动编入LLM Wiki知识库]]]
# - wiki/实体/Hermes-Agent.md → relates_to 添加 [relates_to, [[微信转发自动编入LLM Wiki知识库]]]
```

### 5. 必须创建的文件：hot.md

首次入库或发现缺失时，必须创建 `wiki/hot.md`：

```yaml
---
type: hot-cache
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Hot Cache — 会话热缓存

> 本文件记录当前工作上下文，约 500 词。会话结束时由 AI Agent 自动更新。
> 下次新会话开始时，Agent 先读此文件，直接接上之前的工作。

## 当前会话

- 日期：YYYY-MM-DD
- 主题：...
- 进展：...

## 待处理

- [ ] ...

## 知识库结构备注

- 路径：/opt/data/workspace/设计虱-知识库/
- skill：design-shi-wiki


---

## 索引更新

每次入库后，必须更新 `wiki/index.md`：

```bash
# 查看当前索引
cat /opt/data/workspace/设计虱-知识库/wiki/index.md

# 手动编辑添加新条目
vim /opt/data/workspace/设计虱-知识库/wiki/index.md
```

索引格式参考（按类别分组）：
```markdown
## 实体
- [[实体名]]

## 概念
- [[概念名]]

## 来源
- [[来源名]]
```

---

## 变更日志

每次操作后以 `## YYYY-MM-DD` 分组格式追加到 `wiki/log.md`：

```markdown
## YYYY-MM-DD

* 操作描述
* 操作描述
```

**注意**：不要用裸文字无分组的形式，所有历史条目必须归在某个 `## 日期` 下。

---

## 知识库体检（定期 Review）

当用户说"看看知识库能不能优化"或"review 一下知识库"时，执行以下检查：

### 必须检查的 6 项

1. **hot.md 是否存在** — 若缺失则创建
2. **对比目录是否为空** — 若为空则评估是否需要建对比页（如 LLM Wiki vs RAG）
3. **实体页是否过少** — 核心工具/人物应建实体页
4. **来源页是否有双向链接** — relates_to 是否与相关概念页/实体页互相指向
5. **log.md 格式是否统一** — 是否统一用 `## 日期` 分组格式
6. **index.md 最近更新是否同步** — 最近更新条目是否反映真实情况

### 优先级参考

| 优先级 | 动作 |
|--------|------|
| 高 | hot.md 缺失 |
| 高 | relates_to 双向链接缺失 |
| 中 | 对比页/实体页缺失 |
| 低 | log.md 格式不统一 |

---

## 质量检查

每入库 5-10 篇内容后，检查：

1. **长度检查**：有没有空壳（<15行）？
2. **结构检查**：页面按主题而非时间组织？
3. **孤立检查**：有没有页面未被链接？
4. **frontmatter 检查**：sources 是否完整？

---

## 知识质量标注（必填字段）

### Frontmatter 增强字段

```yaml
---
# 置信度评分（0.0 - 1.0）
# 0.1 = 临时笔记；0.3 = 论坛讨论；0.5 = 博客/公众号；0.7 = 行业报告；0.9 = 同行评审论文
confidence: 0.5

# 记忆层级（对应人脑四层记忆）
# working = 当前会话；episodic = 事件/笔记；semantic = 核心知识；procedural = 模板/流程
memory_layer: semantic

# 语义关系标签（自动补充，无需每次手动添加）
# 支持类型：supports / contradicts / refines / supersedes / relates_to / example_of / implements
relates_to:
  - [supersedes, [[RAG]]]
  - [implements, [[Andrej Karpathy]]]
---
```

### 置信度默认值（按来源类型）

| 页面类型 | 默认 confidence | 默认 memory_layer |
|---|---|---|
| 来源摘要 | 0.5 | episodic |
| 概念页 | 0.5 | semantic |
| 实体页 | 0.5 | semantic |
| 程序/流程 | 0.5 | procedural |

### relates_to 关系标签含义

| 标签 | 含义 |
|---|---|
| supports | 支持/佐证 |
| contradicts | 矛盾/反驳 |
| refines | 细化/深化 |
| supersedes | 取代/替代 |
| relates_to | 一般关联 |
| example_of | 实例 |
| implements | 实现 |

---

## 健康检查（Lint）

每次入库 5-10 篇后运行，或手动触发：

```python
# 检查脚本模板
import os, re, yaml
from collections import defaultdict

KB = "/opt/data/workspace/设计虱-知识库/wiki"
REQUIRED = ['type', 'tags', 'sources', 'created', 'updated']
V2_FIELDS = ['confidence', 'memory_layer']

# 1. 空壳检查：<15 行正文
# 2. 孤立检查：无 inbound wikilink 且不在 index.md
# 3. FM 完整性：必填字段缺失
# 4. V2 字段缺失
# 5. 矛盾标记：relates_to 含 contradicts/contradicted_by
# 6. 过长页面：>120 行
```

### 常见 frontmatter 错误模式

| 错误 | 原因 | 修复 |
|---|---|---|
| FM 字段解析失败 | 开头用了 `***` 而非 `---` | 把 `***\\n\\n` 替换为 `---\\n\\n` |
| 双层关闭符 | 插入 `---` 时重复 | 删除多余的 `---\\n---` 行 |
| V2 字段跑到正文里 | 关闭符 `---` 插入位置不对 | 确认 `updated:` 后紧跟 `---\\n` |
| `relates_to: []` 是空列表 | YAML 空值未正确填写 | 展开为多行列表格式 |
| relates_to 单行写法括号不闭合 | `[tag, [[页面]]` 少写 `]` | 建议展开为多行格式，或写完后验证 |
| 多行 YAML 列表某行缺 `-` 前缀 | 前缀横线被遗漏 | 检查每行是否以 `- ` 开头 |

### relates_to 空列表检查（避免误判）

正则检查 `relates_to:` 是否为空的正确方式——必须检查 YAML 多行列表格式中是否有实际 `-` 条目：

```python
# ❌ 错误方式：只检查字段存在
if 'relates_to:' in fm_text:
    issues.append(f"[空relates_to] {rel}")  # 误判！有内容的列表也会触发

# ✅ 正确方式：检查列表是否有实际条目
m = re.search(r'^relates_to:\s*\n((?:\s*-.*\n)*)', content, re.MULTILINE)
if m:
    items = m.group(1).strip()
    if not items:
        issues.append(f"[空relates_to] {rel}")
elif 'relates_to:' in fm_text:
    # 单行形式（如 relates_to: [[某页面]]）也可能有内容，需结合上下文判断
    pass
```

常见误判案例：
- `relates_to:\n  - [implements, [[LLM Wiki]]]` → 有内容，不是空列表
- `relates_to:\n  - [relates_to, [[Tailscale内网穿透安装]]]` → 有内容，不是空列表

### 常见 frontmatter 错误模式

## 注意事项

* 用户是建筑师，AI Agent 是园丁
* raw/ 只读，wiki/ 可写
* 质量 > 数量：与其 100 个空壳页面，不如 10 个有价值的页面
* 新会话开始时先读 `AGENT.md` + `wiki/index.md` 再操作
* 每次入库后必须更新 `wiki/index.md` 和 `wiki/log.md`