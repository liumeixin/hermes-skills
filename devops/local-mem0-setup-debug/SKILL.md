---
name: local-mem0-setup-debug
description: 本地 Mem0 插件安装与故障排查 - Hermes 本地化记忆系统
trigger: local_mem0 安装、Mem0 本地、记忆插件故障
---

# 本地 Mem0 插件安装与故障排查

**路径**：`/opt/hermes/plugins/memory/local_mem0/`

## 安装流程

### 1. 启用插件

```bash
# 设置使用 local_mem0 作为记忆提供者
hermes config set memory.provider local_mem0

# 重启 Hermes Gateway 使配置生效
docker restart hermes
```

### 2. 验证安装

```bash
cd /opt/hermes && HERMES_HOME=/opt/data/hermes .venv/bin/python -c "
from plugins.memory.local_mem0 import LocalMem0MemoryProvider
p = LocalMem0MemoryProvider()
result = p.handle_tool_call('local_mem0_search', {'query': 'test'})
print(result)
"
```

## 常见问题排查

### 问题 1：插件无法加载

**错误**：`ModuleNotFoundError: No module named 'openai'`

**解决**：使用正确的 Python 虚拟环境
```bash
cd /opt/hermes && .venv/bin/python -c "from plugins.memory.local_mem0 import ..."
```

---

### 问题 2：ImportError: cannot import name 'XXX' from 'hermes_state'

**错误**：`ImportError: cannot import name 'HermesState' from 'hermes_state'`

**原因**：代码中使用了错误的类名。HermesState.py 实际类名是 `SessionDB`

**解决**：修改 `/opt/hermes/plugins/memory/local_mem0/__init__.py`
```python
# 错误的
from hermes_state import HermesState
self._db = HermesState()

# 正确的
from hermes_state import SessionDB
self._db = SessionDB()
```

---

### 问题 3：memories 表不存在

**错误**：`no such table: memories`

**原因**：数据库迁移脚本未正确执行

**解决**：手动创建表
```bash
cd /opt/hermes && .venv/bin/python -c "
import sqlite3
conn = sqlite3.connect('/opt/data/hermes/state.db')
cursor = conn.cursor()

cursor.execute('''
CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    vector BLOB NOT NULL,
    user_id TEXT DEFAULT \"default\",
    session_id TEXT,
    created_at REAL DEFAULT 0
)
''')

cursor.execute('CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id)')
cursor.execute('CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at)')

conn.commit()
conn.close()
print('memories 表创建成功')
"
```

---

### 问题 4：Wiki 向量搜索失败

**错误**：`struct.error: unpack requires a buffer of XXX bytes`

**原因**：wiki_embeddings 表中存在不同维度的向量（768维 和 4000+维），搜索时未过滤

**解决**：修改 `hermes_state.py` 的 `search_wiki` 方法，过滤维度不匹配的向量
```python
# 在计算相似度前添加维度检查
vec_dim = len(vec_bytes) // 4

# 跳过维度不匹配的向量
if vec_dim != query_dim:
    continue

vec = struct.unpack(f"{vec_dim}f", vec_bytes)
```

---

## 提供的工具

| 工具 | 功能 |
|------|------|
| `local_mem0_search` | 语义搜索已存储的记忆 |
| `local_mem0_profile` | 查看所有记忆 |
| `local_mem0_conclude` | 手动存储记忆 |
| `local_mem0_delete` | 删除记忆 |
| `wiki_search` | 搜索知识库（需要预先向量化） |

## 外部依赖

| 依赖 | 说明 |
|------|------|
| Ollama | 需要运行在 localhost:11434 |
| dmeta-embedding-zh | 向量模型，需提前安装：`ollama pull herald/dmeta-embedding-zh` |

## 数据存储

- 数据库：`$HERMES_HOME/state.db`
- 表：`memories` - 存储用户记忆
- 表：`wiki_embeddings` - 存储知识库向量

## 与 session_search 的关系

local_mem0 和 session_search 是**互补关系**：

- **session_search**：搜索历史对话消息（messages 表）
- **local_mem0**：搜索提取的记忆（memories 表）

两者用途不同，建议都保留启用。