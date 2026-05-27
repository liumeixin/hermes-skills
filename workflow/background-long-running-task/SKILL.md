---
name: background-long-running-task
title: 长时任务后台执行
description: Python脚本执行超时时的后台模式解决方案 - 配合notify_on_complete和process工具监控完成状态
trigger: 运行超时、后台执行、长时任务
---

# 长时任务后台执行

当 Python 脚本执行时间超过 600s 前台限制时，使用后台模式。

## 执行步骤

1. **启动后台任务**
```python
terminal(
    command="python3 /opt/data/scripts/wiki_embed.py",
    background=True,
    notify_on_complete=True
)
```

2. **监控状态**
```python
# 方式1: poll 检查状态
process(action="poll", session_id="proc_xxx")

# 方式2: wait 等待完成 (最大阻塞60s)
process(action="wait", session_id="proc_xxx", timeout=120)
```

3. **检查输出**
```python
terminal(command="tail -20 /opt/data/scripts/wiki_embed.log")
```

## 关键点

- `notify_on_complete=true` 让任务完成时自动通知
- 前台模式 timeout 上限 600s，超过会强制终止
- 后台模式无此限制
- process 的 wait 有 60s 硬上限，建议用 poll + tail 日志组合监控

## 验证任务完成

看到日志中出现 `=== 完成:` 或 `数据库总计:` 即表示成功完成。