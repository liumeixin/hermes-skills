---
name: design-shi-wiki
description: 设计虱知识库管理 - 知识入库、索引更新、内容迁移
notes: 本 skill 包含的表格是为阅读友好设计的，在飞书等不支持 markdown 表格的平台，请用代码块格式重述表格内容。
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

### 置信度分级规则（实测有效）

批量更新置信度时，按以下规则分类（**优先用文件名启发式，不要依赖 `sources` 字段**）：

**⚠️ `sources` 字段格式陷阱**：来源页的 `sources` 字段可能是 URL（`https://github.com/...`）也可能是 wikilink（`[[某页面]]`），wikilink 格式不包含 URL。基于 `sources` 字段解析来源平台类型会导致误判。

**来源页（type: source）分级**：
| 来源特征 | confidence | 判断依据 |
|---|---|---|
| GitHub 开源项目 | 0.7 | 文件名含 GitHub/开源/具体项目名 |
| 工具官网文档 | 0.7 | 文件名含安装/部署/配置 + 已知工具名 |
| 微信公众号 | 0.5 | 文件名含公众号/微信，或标签含自媒体 |
| 知乎专栏 | 0.5 | 文件名含知乎 |
| 百度经验/论坛 | 0.3 | 文件名含百度经验/论坛 |
| 软件下载站 | 0.5 | 如 yutu.cn 等 |
| 信息源不明确 | 0.5 | 兜底值 |

**概念页（type: concept）分级**：
| 特征 | confidence |
|---|---|
| 核心方法论（LLM-Wiki、RAG、横纵分析法等） | 0.7 |
| 实操指南（含安装/部署/配置/步骤） | 0.6 |
| 一般概念 | 0.5 |

**实体页（type: entity）分级**：
| 特征 | confidence |
|---|---|
| 核心工具/产品（Hermes-Agent、SenseNova、MiniMax 等） | 0.7 |
| 知名人物 | 0.7 |
| 一般实体 | 0.5 |

### 批量更新置信度脚本模板

```python
# ⚠️ 批量更新时用文件名启发式，不要解析 sources 字段
# 来源页：通过文件名判断平台（公众号/知乎/GitHub/百度经验）
# 概念页：通过内容关键词判断（安装/部署/步骤 → 0.6）
# 实体页：通过文件名匹配核心工具列表 → 0.7
# 执行后验证：统计各置信度档位的页面数量分布
```

### relates_to 关系标签含义

语义关系标签用于建立页面之间的关联，帮助知识库形成网络：

| 标签 | 含义 | 示例 |
|------|------|------|
| supports | 支持/佐证 | "[[AI绘图]] supports [[AIGC]]" |
| contradicts | 矛盾/反驳 | "[[某观点]] contradicts [[传统认知]]" |
| refines | 细化/深化 | "「上下文压缩」 refines 「LLM工作原理」" |
| supersedes | 取代/替代 | "「MiniMax-M2.5」 supersedes 「mimo-v2.5」" |
| relates_to | 一般关联 | "「NAS」 relates_to 「Docker」" |
| example_of | 实例 | "「设计虱」 example_of 「自媒体博主」" |
| implements | 实现 | "「Hermes」 implements 「Agent工作流」" |

**注意**：relates_to 存的是语义名称（如 "RAG"、"LLM Wiki"），不是文件路径。

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
| FM 字段解析失败 | 开头用了 `***` 而非 `---` | 把 `***\n\n` 替换为 `---\n\n` |
| 双层关闭符 | 插入 `---` 时重复 | 删除多余的 `---\n---` 行 |
| V2 字段跑到正文里 | 关闭符 `---` 插入位置不对 | 确认 `updated:` 后紧跟 `---\n` |
| `relates_to: []` 是空列表 | YAML 空值未正确填写 | 展开为多行列表格式 |
| relates_to 单行写法括号不闭合 | `[tag, [[页面]]` 少写 `]` | 建议展开为多行格式，或写完后验证 |
| 多行 YAML 列表某行缺 `-` 前缀 | 前缀横线被遗漏 | 检查每行是否以 `- ` 开头 |

### ⚠️ 双层关闭符检测的假阳性陷阱

自动检测"双层关闭符"时，直接用 `content.count('---') >= 4` 会产生大量误判。**Markdown 表格的分隔符 `| --- | --- |` 会被错误识别为 frontmatter 关闭符**。

正确做法：先提取 frontmatter 区域，然后在 frontmatter 结束后的正文中查找 `---` 时，检查其前面几行是否在表格上下文（包含 `|` 符号）：

```python
def check_real_double_closer(fpath):
    """检查真正的双层关闭符：frontmatter结束后正文又有 --- 分隔符"""
    with open(fpath, 'r', encoding='utf-8') as fh:
        content = fh.read()
    
    # 找到 frontmatter 结束位置
    fm_match = re.search(r'^---\s*\n(.*?)\n---', content, re.DOTALL | re.MULTILINE)
    if not fm_match:
        return False
    
    frontmatter_end = fm_match.end()
    after_fm = content[frontmatter_end:]
    
    # 查找不在表格中的 --- 行
    for i, line in enumerate(after_fm.split('\n')):
        stripped = line.strip()
        if stripped == '---':
            lines_before = after_fm.split('\n')[:i]
            # 如果前面没有 | ，则是真正的分隔符
            if not any('|' in l for l in lines_before[-3:] if l):
                return True
    return False
```

**经验**：大多数"双层关闭符"警报实际上是 Markdown 水平线（Horizontal Rule），这是正常的内容分隔符，无需修复。

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

### ⚠️ 空壳页面检查的假阳性

统计页面行数时，必须先排除 frontmatter 再计数，否则会把 30+ 行的正常页面误判为空壳：

```python
def count_lines(content):
    """统计行数（排除 frontmatter）"""
    lines = content.split('\n')
    in_fm = False
    count = 0
    for line in lines:
        if line.strip() == '---':
            in_fm = not in_fm
            continue
        if not in_fm and line.strip():
            count += 1
    return count

# 过滤 frontmatter 行后再统计，否则 30+ 行正常内容会被误判为 <15 行
```

**实测经验**：cron 报告的"120个页面缺少 relates_to"是误判，实际只有 28 个；报告的"6个空壳页面"也是脚本 bug，实际都是正常内容。

### 常见 frontmatter 错误模式

## 知识库向量化

wiki/ 下所有页面已通过 `wiki_embed.py` 向量化，支持语义检索。

### 架构
- **脚本**：`/opt/data/scripts/wiki_embed.py`
- **数据库表**：`wiki_embeddings`（page_path, page_title, content_text, embedding, updated_at）
- **向量模型**：herald/dmeta-embedding-zh（768维，Ollama 本地部署）
- **定时任务**：每天凌晨 4:00 全量 re-embed（cron ID 待确认）

### 使用方式
```bash
# 增量模式（只处理新增/修改的文件，按 mtime 比较）
python3 /opt/data/scripts/wiki_embed.py

# 全量模式（重新向量化所有文件）
python3 /opt/data/scripts/wiki_embed.py --full
```

### ⚠️ 关键坑点：切片
herald/dmeta-embedding-zh 上下文窗口 **1024 tokens（约 500 中文字符）**。超过此长度的页面会 500 错误或超时。

脚本已内置切片逻辑：长文本按 500 字符（句子边界）切分，分别 embedding 后取平均向量。**不要去掉切片逻辑**。

### 检索方式
知识库检索为混合模式：FTS5 全文搜索（关键词）+ 向量相似度（语义），按 page_path 去重合并。

---

## 批量读取与 Frontmatter 解析（批量分析场景）

当需要遍历 wiki/ 下所有 .md 文件提取 frontmatter 时（如生成周报、健康检查），注意以下坑点：

### ⚠️ `execute_code` 50 次工具调用限制

`read_file` 每次调用消耗 1 个工具调用。85 个文件 = 85 次调用，远超 50 次上限。

**正确做法：写一个自包含 Python 脚本，通过 `terminal()` 一次性执行：**

```python
# 在 execute_code 中：
script = r'''
import os, re, json

kb = "/opt/data/workspace/设计虱-知识库/wiki/"
pages = []

def manual_yaml(text):
    """不依赖 PyYAML 的 frontmatter 手动解析"""
    fm = {}
    for key in ['type', 'created', 'updated', 'confidence', 'memory_layer']:
        m = re.search(rf'^{key}:\s*(.+)$', text, re.MULTILINE)
        if m:
            val = m.group(1).strip().strip('"').strip("'")
            if key == 'confidence':
                try: val = float(val)
                except: val = 0.5
            fm[key] = val

    tm = re.search(r'^tags:\s*\[([^\]]*)\]', text, re.MULTILINE)
    if tm:
        raw = tm.group(1)
        tags = [t.strip().strip('"').strip("'").strip("\\") for t in raw.split(',')]
        fm['tags'] = [t for t in tags if t and len(t) > 1 and t not in (',', '\\', '[', ']')]
    else:
        fm['tags'] = []

    rt = []
    in_rt = False
    for line in text.split('\n'):
        if line.strip().startswith('relates_to:'):
            in_rt = True
            continue
        if in_rt:
            if line.strip().startswith('- '):
                rt.append(line.strip()[2:])
            elif line.strip() and not line.startswith(' '):
                in_rt = False
    fm['relates_to'] = rt
    return fm

for root, dirs, files in os.walk(kb):
    for f in files:
        if not f.endswith('.md'):
            continue
        fpath = os.path.join(root, f)
        try:
            with open(fpath, 'r', encoding='utf-8') as fh:
                content = fh.read(3000)
            fm_match = re.search(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
            if not fm_match:
                continue
            fm = manual_yaml(fm_match.group(1))
            relpath = os.path.relpath(fpath, kb)
            pages.append({
                'name': f, 'path': relpath,
                'type': fm.get('type', 'unknown'),
                'tags': fm.get('tags', []),
                'created': str(fm.get('created', '')),
                'updated': str(fm.get('updated', '')),
                'confidence': fm.get('confidence', 0.5),
                'memory_layer': fm.get('memory_layer', 'semantic'),
                'relates_to': fm.get('relates_to', []),
            })
        except:
            pass

print(json.dumps(pages, ensure_ascii=False))
'''

with open('/tmp/extract_fm.py', 'w') as fh:
    fh.write(script)
result = terminal("python3 /tmp/extract_fm.py", timeout=30)
pages = json.loads(result['output'])
```

### ⚠️ `read_file` 行号前缀

`read_file` 返回格式为 `     1|---\n     2|type: entity\n...`，解析前需剥离行号：

```python
lines = []
for line in raw.split('\n'):
    m = re.match(r'\s*\d+\|(.*)$', line)
    lines.append(m.group(1) if m else line)
content = '\n'.join(lines)
```

### ⚠️ YAML `safe_load` 对 wikilink 的兼容性

Frontmatter 中 `sources` 和 `relates_to` 字段常含 wikilink `[xxx](./path/xxx.md)` 格式，`yaml.safe_load()` 会解析失败。**必须用 `manual_yaml()` 正则手动提取**，不要依赖 PyYAML。

### 周报生成的周次计算

- 报告文件名用 **当前周** 的 ISO 周次（如 `2026-W20.md`）
- 报告内容覆盖 **本周** 的变更（当前周 Monday ~ Sunday）
- 如果当前周还在进行中，覆盖的是本周已有的变更
- 如果有上一周的报告，对比上周数据做趋势分析

---

## 注意事项

* 用户是建筑师，AI Agent 是园丁
* raw/ 只读，wiki/ 可写
* 质量 > 数量：与其 100 个空壳页面，不如 10 个有价值的页面
* 新会话开始时先读 `AGENT.md` + `wiki/index.md` 再操作
* 每次入库后必须更新 `wiki/index.md` 和 `wiki/log.md`