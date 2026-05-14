---
name: design-shi-knowledge-base-ops
description: 设计虱知识库运维操作 — raw文章批量入库、来源页/概念页/实体页创建规范、自检脚本
tags: [knowledge-base, design-shi, ingestion]
created: 2026-05-14
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
