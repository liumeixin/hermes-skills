---
name: batch-embedding-background
description: 批量向量化任务后台执行 SOP，避免在对话通道内运行耗时任务导致飞书私聊卡死
triggers:
  - 大量存量文章需要向量化
  - 批量入库
  - 预估耗时超过5分钟的任务
  - 100条以上待处理
---

# 批量向量化后台任务 SOP

## 触发条件

凡满足以下任一条件，必须走后台通道，禁止在对话通道直接运行：

1. 预估耗时超过 5 分钟的向量化任务
2. 待处理条目数量超过 100 条
3. 用户明确说"量大"、"跑一批"、"全部重新向量"
4. 存量文章/笔记批量入库

## 标准流程

### 1. 启动前确认

调用 Ollama embedding API 测试服务是否在线。

### 2. 启动后台任务

使用 `terminal(background=True)` 启动：

```python
terminal(
    command="cd /opt/data/scripts && nohup python -u batch_embed_v3.py > /opt/data/scripts/batch_embed_v3.log 2>&1 & echo $!",
    background=True,
    notify_on_complete=True,
    watch_patterns=["完成", "ERROR", "错误", "100%", "traceback"]
)
```

**关键点**：
- `nohup` + `&` + `echo $!` 确保进程与终端分离
- `-u` 参数让 Python stdout 无缓冲，日志实时写入
- 指定完整输出路径，便于后续追查
- `watch_patterns` 监控关键词，任务完成或出错时自动通知

### 3. 立即返回用户

回复格式：

> 向量化任务已后台启动，共 N 条，预计 X 分钟。
> 日志：`/opt/data/scripts/batch_embed_v3.log`
> PID：xxx（进程 ID）
> 有结果/出错时会通知你。

### 4. 进程管理

```bash
# 查看进程是否在跑
ps aux | grep batch_embed

# 查看实时日志
tail -f /opt/data/scripts/batch_embed_v3.log

# 手动终止（一般不需要）
kill <PID>
```

### 5. 完成验证

任务结束后，检查：
- 日志最后几行是否有错误
- 目标数据是否已写入（检查数据库/文件）
- 召回测试是否正常

## 故障排查 SOP（进程中断时）

进程停了但没有报错，按以下顺序排查：

### 1. 确认进程状态
```bash
ps aux | grep batch_embed
```

### 2. 查最后日志
```bash
tail -20 /opt/data/scripts/batch_embed_v3.log
```
找到最后一条记录的消息 ID，用 Python 检查该消息是否已写入 DB。

### 3. 检查 Ollama 服务
调用 embedding API 测试响应是否正常（用一个短文本测试）。

### 4. 检查内存压力
```bash
free -m
```

## 优化策略（CPU 温度敏感环境）

针对 CPU 长期满负荷导致温度过高，batch_embed_v3.py 已优化：

1. **跳过 tool 消息** — 工具返回内容语义价值低，占消息量 60%+
2. **长度门槛 200+ 字** — 短消息向量化意义不大
3. **时间窗口限制** — 默认只处理最近 N 天（当前 3 天）
4. **只处理 user+assistant** — 跳过 tool 角色

查询条件：
```sql
WHERE m.content IS NOT NULL AND LENGTH(m.content) > 200
AND m.id NOT IN (SELECT message_id FROM message_embeddings)
AND m.timestamp > ?
AND m.role IN ('user', 'assistant')
```

## 故障模式

| 症状 | 原因 | 处理 |
|------|------|------|
| OOM（signal 9） | 模型太大或并发太高 | 换小模型（如 0.6b）或减小并发数 |
| 卡住无输出 | 进程死锁或 API 超时 | 查看 tail 日志，kill 重启 |
| 终端命令持续 interrupted | 批量进程占满 CPU，终端响应不了 | kill 批量进程，等 CPU 回落后重试 |
| 飞书私聊显示"正在忙" | 在对话通道内跑了耗时任务 | 切后台 |
| 向量化结果为空 | 模型加载失败或 API 报错 | 检查 ollama 服务状态 |
| 进程中途退出无报错 | Ollama 请求卡住或系统 kill | 检查日志最后时间戳，重启 |
| 进程消失无报错 | Ollama 请求卡住或系统 OOM kill | 检查日志最后消息 ID，DB 是否已写入，确认需重启 |

## 性能优化策略（必读）

批量向量化前必须先分析待处理消息构成，避免无脑全量处理导致 CPU 过载。

### 消息过滤优先级

| 过滤条件 | 预期减少 | 说明 |
|----------|----------|------|
| 跳过 `tool` 角色消息 | ~60-70% | 工具返回内容（网页、搜索结果）语义价值低，用 FTS5 关键词匹配更合适 |
| 提高长度门槛 ≥200 chars | ~20-30% | 短消息向量化意义不大 |
| 仅处理最近 N 天 | 按需 | 避免历史全量处理导致长时间 CPU 满载 |

### 实际案例（2026-05-15）

待处理 2149 条消息中：
- `tool` 消息 1371 条（64%）→ 跳过
- 短消息 <100 chars 约 484 条 → 跳过
- 优化后剩余 ~300 条，几分钟可完成

### SQL 查询模板

```sql
SELECT m.id, m.content FROM messages m
WHERE m.content IS NOT NULL AND LENGTH(m.content) > 200
AND m.id NOT IN (SELECT message_id FROM message_embeddings)
AND m.role IN ('user', 'assistant')  -- 跳过 tool 消息
AND m.timestamp > ?  -- 只处理最近 N 天
ORDER BY m.id
```

### 启动前分析命令

```python
python3 -c "
import sqlite3, time
conn = sqlite3.connect('/opt/data/state.db')
cutoff = time.time() - (3 * 86400)  # 最近3天
# 按角色统计
for role, cnt in conn.execute('''
    SELECT role, COUNT(*) FROM messages 
    WHERE content IS NOT NULL AND LENGTH(content) > 10 
    AND id NOT IN (SELECT message_id FROM message_embeddings) 
    AND timestamp > ?
    GROUP BY role
''', (cutoff,)).fetchall():
    print(f'{role}: {cnt}')
conn.close()
"
```

## ⚠️ 关键兼容性问题（2026-05-15 发现）

**批量脚本和 Gateway 实时向量化使用不同模型和存储格式，导致向量搜索不兼容！**

| 组件 | 模型 | 维度 | 存储格式 |
|------|------|------|----------|
| batch_embed_v3.py | herald/dmeta-embedding-zh | 768 | JSON 字符串 `json.dumps(vec).encode()` |
| Gateway hermes_state.py | mxbai-embed-large | 1024 | float32 二进制 `struct.pack` |

**后果：** 批量脚本生成的向量无法被 Gateway 的 `search_messages_vector()` 正确读取和匹配。

**修复方案（二选一）：**
1. 统一用 mxbai-embed-large + float32 二进制存储（推荐，和 Gateway 一致）
2. 或统一用 herald/dmeta-embedding-zh + JSON 存储，并修改 Gateway 的 `_embed_text()` 和 `search_messages_vector()`

修复后需清空 `message_embeddings` 表重新向量化。

## 已在知识库记录的关键结论

- Lima VM 内存上限 4GB（cgroup memory.max = 4294967296），qwen3-embedding:0.6b 会 OOM，herald/dmeta-embedding-zh (~288MB) 可用
- 向量化维度由 API 返回值自动确定，无需硬编码
- `tool` 角色消息占比可达 60%+，向量化价值低，批量处理时应跳过
- **批量脚本与 Gateway 向量不兼容**：模型不同（herald vs mxbai）+ 格式不同（JSON vs float32 binary），必须统一后重新向量化

## 架构演进：消息级 → 对话级摘要（2026-05-15）

### 问题
消息级向量化在 N5105 上太慢（2000 条消息需 20+ 分钟），且 63% 的 tool 消息是噪音。

### 新方案：对话级摘要
改为对每个已结束 session 生成一条结构化摘要，只向量化摘要。

**优势：**
- 向量化量从 2000+ 条降至 ~50 条摘要（减少 95%+）
- 摘要语义连贯，检索精度更高
- 每日增量处理 < 1 分钟

**摘要格式：**
```json
{
  "topic": "简短主题",
  "conclusion": "核心结论/决策",
  "key_data": ["金额", "日期", "配置参数"],
  "action_items": ["待办事项"],
  "timestamp": "ISO时间",
  "message_ids": ["原始消息ID"]
}
```

**存储位置：**
- `conversation_summaries` 表：摘要内容 + embedding blob
- 原始消息保留在 `messages` 表供 FTS 精确检索

**Cron 任务：**
- 每 30 分钟运行 `session_summarizer.py`
- 处理已结束但未摘要的 session
- 脚本路径：`/opt/data/scripts/session_summarizer.py`

**性能数据（N5105）：**
- 单次 embedding 耗时：10-16 秒
- 单个 session 摘要生成（LLM + embedding）：10-15 秒
- 44 个历史 session 全量处理：约 10 分钟

## 分层记忆架构（已实现）

| 层级 | 存储 | 检索方式 | 数据 |
|------|------|----------|------|
| 热存储 | messages 表 | FTS5 关键词 | 最近对话原始消息 |
| 温存储 | conversation_summaries | 向量语义 | 对话摘要 |
| 冷存储 | 无（可选压缩） | — | 7天前原始消息可丢弃 |