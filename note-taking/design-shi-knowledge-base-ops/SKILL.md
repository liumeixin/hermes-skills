---
name: design-shi-knowledge-base-ops
description: 设计虱知识库运维操作 — raw文章批量入库、来源页/概念页/实体页创建规范、自检脚本
tags: [knowledge-base, design-shi, ingestion]
created: 2026-05-14
notes: 本 skill 包含的表格是为阅读友好设计的，在飞书等不支持 markdown 表格的平台，请用代码块格式重述表格内容。
---

# 设计虱知识库运维操作

## 目录结构

```
wiki/
├── 实体/        # 有形实体（人/产品/工具）
├── 概念/        # 方法论/流程/概念
├── 来源/        # 文章来源摘要
├── 对比/        # 对比分析
├── 洞察/        # 定期洞察报告
├── index.md     # 内容索引（Agent维护）
└── log.md       # 操作日志（仅追加）
```

## 入库标准流程

### ⛔ 重要前提：IMA vs 本地知识库

| 知识库 | 维护者 | 操作 |
|--------|--------|------|
| IMA (ima.qq.com) | 其他智能体（自动抓取/整理） | **只读**，定期读取已整理的笔记 |
| 本地知识库 (/opt/data/workspace/设计虱-知识库/) | 我（Hermes） | 写入，包含来源页/概念页/实体页 |

**关键规则**：
- 不要往 IMA 写入任何内容
- 用户说"入库" = 直接按下面流程录入本地知识库，不需要经过 IMA
- 只有从 IMA 读取已整理好的笔记时才涉及 IMA（ima-skill）

### Step 1：扫描 raw 目录

```bash
ls -lt /opt/data/workspace/设计虱-知识库/raw/ | head -30
```

### Step 2：判断是否已处理

检查已入库记录（`log.md` 末尾），确认文章是否已入库。
已处理文章重命名为 `.processed` 后缀。

### Step 3：判断文章类型，创建对应页面

**实体页**（人/产品/工具/服务）
- frontmatter 必填：`type: entity`、`name`、`tags`、`sources`、`created`、`confidence`、`memory_layer`、`relates_to`
- 命名：产品名/工具名/公司名，如 `SenseNova.md`、`绿联DX4600.md`

**概念页**（方法论/流程/思维模型）
- frontmatter 必填：`type: concept`、`name`、`tags`、`sources`、`created`、`confidence`、`memory_layer`、`relates_to`
- 命名：方法名/问题名，如 `横纵分析法.md`、`多平台内容分发.md`

**来源页**（文章来源摘要）
- frontmatter 必填：`type: source`、`name`、`tags`、`sources`、`created`、`author`、`confidence`、`relates_to`
- 命名：`来源-{文章标题摘要}.md`
- 作用：记录原始文章的核心信息，不重复正文内容

### Step 4：判断是否需要合并到已有页面

- Garry Tan 铁律 → 合并到 `概念/OpenClaw关闭审批.md`
- 同一主题的多篇文章 → 主文建实体/概念，其余建来源页 + relates_to 引用主文

### Step 5：同步 index.md 和 log.md

**index.md** 同步：新增条目追加到对应分类下

**log.md** 同步：追加 `## YYYY-MM-DD` 章节，记录入库文件列表（用 `[[文件名]]` 格式）

### Step 6：自检（Python 脚本）

```python
import os, re, yaml

base = "/opt/data/workspace/设计虱-知识库/wiki"
issues = []

for root, dirs, files in os.walk(base):
    for f in files:
        if f.endswith(".md") and f not in ("index.md", "log.md"):
            path = os.path.join(root, f)
            with open(path, encoding="utf-8") as fh:
                content = fh.read()
            fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
            if not fm_match:
                issues.append(f"❌ 缺少frontmatter: {path}")
                continue
            try:
                fm = yaml.safe_load(fm_match.group(1))
            except yaml.YAMLError as e:
                issues.append(f"❌ YAML错误: {path} — {e}")
                continue

if not issues:
    print("✅ 自检通过")
else:
    for i in issues:
        print(i)
```

**注意**：relates_to 存的是语义名称（如 `"RAG"`、`"LLM Wiki"`），不是文件路径，检查脚本用文件路径匹配会误报。这是知识库设计预期用法，不算问题。

### Step 7：标记已处理

```bash
mv "原文件名.md" "原文件名.md.processed"
```

## frontmatter 规范

```yaml
# 实体页
---
type: entity
name: 实体名
tags: [标签1, 标签2]
sources: [./来源/来源-xxx.md, https://...]
created: 2026-05-14
confidence: 0.8
memory_layer: semantic  # semantic | episodic | procedural
relates_to:
  - [implements, [[实体B]]]
  - [relates_to, [[概念C]]]
---

# 概念页
---
type: concept
name: 概念名
tags: [标签1, 标签2]
sources: [./来源/来源-xxx.md, ...]
created: 2026-05-14
confidence: 0.8
memory_layer: procedural  # semantic | episodic | procedural
relates_to:
  - [invented_by, [[人名]]]
  - [implements, [[工具名]]]
---

# 来源页
---
type: source
name: 文章标题
tags: [标签1, 标签2]
sources: [https://原始链接]
created: 2026-05-14
author: 作者名
confidence: 0.8
relates_to:
  - [implements, [[概念名]]]
  - [relates_to, [[实体名]]]
---
```

## relates_to 关系类型

- `[implements, [概念]]` — 来源实现了某个方法/概念
- `[invented_by, [人名]]` — 由某人发明
- `[relates_to, [实体/概念]]` — 相关
- `[supersedes, [旧实体]]` — 取代了某个旧实体

---

## 知识库向量化

知识库 wiki/ 下的页面已全量向量化，支持语义检索（与 FTS5 关键词检索互补）。

### 脚本与配置

- **脚本**：`/opt/data/scripts/wiki_embed.py`
- **数据库**：`/opt/data/state.db` 的 `wiki_embeddings` 表
- **向量化模型**：`herald/dmeta-embedding-zh`（768维，195MB，通过 Ollama 本地运行）
- **定时任务**：`wiki-embed-daily`，每天凌晨 04:00 增量执行
- **日志**：`/opt/data/scripts/wiki_embed.log`

### 使用方式

```bash
# 增量模式（只处理新增/修改的文件，按 mtime 判断）
python3 /opt/data/scripts/wiki_embed.py

# 全量模式（重新向量化所有文件）
python3 /opt/data/scripts/wiki_embed.py --full
```

### 关键设计决策

1. **知识库页面直接 embedding，不需要摘要预处理**——因为知识库每页都是人工整理的高密度信息，信噪比接近 100%，不像聊天记录有 63% tool 噪声
2. **长文本切片**：dmeta 上下文窗口 1024 tokens，超过 500 字符的页面按句子边界切片（overlap=50），分别 embedding 后取平均向量
3. **增量更新**：比较文件 mtime 与数据库 updated_at，未变化的跳过
4. **跳过特殊文件**：index.md、log.md、hot.md 不向量化

### Cron 执行经验

- 每个页面 embedding 约 1.5-2 分钟（含 API 调用 + 写入），4 个新页面约 16 分钟
- **前台 300s 超时不够**：4 个新页面就刚好踩线。超过 5 个新页面应改用 `background=true` + `notify_on_complete=true`
- `wait` 工具最大 clamped 到 60s，长任务必须用 `tail -f` 或 `tail -20` 检查日志进度
- 日志中每条记录出现两次是因为多个 cron 实例同时写入（正常现象，幂等操作）

### 踩坑记录

- **⚠️ patch 工具更新 log.md 会产生 `@@` 残留**：用 `patch` 的 patch 模式追加 log.md 条目时，多次出现 diff 标记 `@@` 被写入文件的 bug。修复方法：log.md 追加改用 Python `str.replace()` 或 `read_file + write_file` 全量写入。index.md 的 patch 操作正常，不受影响。
- dmeta 必须用 Ollama 原生端点 `/api/embeddings` + `prompt` 参数，不支持 `/v1/embeddings` + `input`
- N5105 上单次 embedding 约 17-22 秒，68 个页面全量约 50 分钟
- 不需要并行，N5105 4 核已满载，串行是最优解
- 超时设为 120 秒（长文本切片后单 chunk 仍在 17-22 秒范围内）
