---
name: local-mem0-setup
description: 本地 Mem0 记忆插件安装与故障排查 - Hermes 跨会话记忆系统
trigger: local_mem0 启用 / local mem0 安装 / 记忆插件问题
---

# Local Mem0 安装与故障排查

## 插件位置

```
/opt/hermes/plugins/memory/local_mem0/
└── __init__.py   # 374 行
```

## 启用方式

```bash
hermes config set memory.provider local_mem0
# 然后重启 Hermes gateway
```

## 已知 Bug

### Bug 1: 导入错误

**问题**: 代码尝试导入 `HermesState`，但实际类名是 `SessionDB`

**位置**: `/opt/hermes/plugins/memory/local_mem0/__init__.py` 第 170-171 行

**修复**:
```python
# 错误
from hermes_state import HermesState
self._db = HermesState()

# 正确
from hermes_state import SessionDB
self._db = SessionDB()
```

### Bug 2: 数据库迁移未创建表

**问题**: v8 迁移代码存在，但 memories 表未创建

**症状**: `search_memories` 返回 "no such table: memories"

**修复**: 手动创建表
```python
import sqlite3
conn = sqlite3.connect('/opt/data/hermes/state.db')
cursor = conn.cursor()

cursor.execute('''
CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    vector BLOB NOT NULL,
    user_id TEXT DEFAULT 'default',
    session_id TEXT,
    created_at REAL DEFAULT 0
)
''')
cursor.execute('CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id)')
cursor.execute('CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at)')
conn.commit()
```

## 测试命令

```python
import os
os.environ['HERMES_HOME'] = '/opt/data/hermes'

from plugins.memory.local_mem0 import LocalMem0MemoryProvider
p = LocalMem0MemoryProvider()

# 测试存储
p.handle_tool_call('local_mem0_conclude', {'fact': '测试记忆'})

# 测试搜索
p.handle_tool_call('local_mem0_search', {'query': '测试'})

# 测试查看全部
p.handle_tool_call('local_mem0_profile', {})
```

## 数据库结构

| 路径 | 大小 | 用途 |
|------|------|------|
| /opt/data/hermes/state.db | ~70KB | local_mem0 (memories 表) |
| /opt/data/state.db | ~90MB | 历史对话 (messages + message_embeddings) |

## 两个数据库的区别

- **memories 表**: local_mem0 专用，存提取后的记忆（自动或手动存入）
- **message_embeddings 表**: session_search 向量搜索用，存历史消息向量（需单独跑批量任务）

## 工作原理

1. 对话结束 → 后台线程等待 2 秒
2. 调用 auxiliary 模型提取记忆（Prompt 定义提取规则）
3. 用 dmeta-embedding-zh 向量化
4. 存入 SQLite memories 表

## 可用工具

- `local_mem0_search` - 语义搜索记忆
- `local_mem0_profile` - 查看所有记忆
- `local_mem0_conclude` - 手动存储记忆
- `local_mem0_delete` - 删除记忆

## 向量模型

使用 Ollama 的 `herald/dmeta-embedding-zh`，输出 **768 维向量**（不是 1024 维）。

## 注意事项

- dmeta-embedding-zh 需在 Ollama 中已部署
- 如果 Ollama 未启动或模型未加载，向量操作会静默失败
- 记忆提取是异步的，不会阻塞对话响应