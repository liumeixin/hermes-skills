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

```python
# 确认向量化服务在线
curl -s http://localhost:11434/api/embeddings \
  -d '{"model":"herald/dmeta-embedding-zh:latest","prompt":"test"}' \
  | python -c "import sys,json; d=json.load(sys.stdin); print('OK, dim=',len(d['embedding']))"
```

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

## 故障模式

| 症状 | 原因 | 处理 |
|------|------|------|
| OOM（signal 9） | 模型太大或并发太高 | 换小模型（如 0.6b）或减小并发数 |
| 卡住无输出 | 进程死锁或 API 超时 | 查看 tail 日志，kill 重启 |
| 飞书私聊显示"正在忙" | 在对话通道内跑了耗时任务 | 切后台 |
| 向量化结果为空 | 模型加载失败或 API 报错 | 检查 ollama 服务状态 |

## 已在知识库记录的关键结论

- Lima VM 内存上限 4GB（cgroup memory.max = 4294967296），qwen3-embedding:0.6b 会 OOM，herald/dmeta-embedding-zh (~288MB) 可用
- 向量化维度由 API 返回值自动确定，无需硬编码
