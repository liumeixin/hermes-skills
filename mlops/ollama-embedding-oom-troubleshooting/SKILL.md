---
name: ollama-embedding-oom-troubleshooting
description: Ollama embedding 在 NAS/Docker 容器环境下因内存限制（OOM）失败的诊断与解决。关键特征：sys=9 signal killed，Swap 满，cgroup 4GB 限制。
trigger: Ollama 超时 / embedding 失败 / signal killed / swap 满 / 向量化卡死
---

# Ollama Embedding OOM Troubleshooting

## 关键日志特征

### Ollama 服务端日志
```
level=WARN source=server.go:1305 msg="llama runner process no longer running" sys=9 string="signal: killed"
```
**sys=9 = OOM killer，不是 timeout，不是模型拒绝，是内存不足被系统强制杀死。**

### 伴随现象
- Swap 100% 满：`free -h` 显示 swap used ≈ total swap
- cgroup 内存上限：容器内 `cat /sys/fs/cgroup/memory.max` → 4294967296 (4GB)
- 每次请求都重新加载模型：runner 进程反复 start → killed → start
- `400 Bad Request` 但错误信息是 EOF 或 connection reset

## 诊断步骤

```bash
# 1. 检查内存和 swap
free -h

# 2. 检查 cgroup 内存限制
cat /sys/fs/cgroup/memory.max

# 3. 检查 Ollama 日志中的 sys=9 kills
docker logs ollama 2>&1 | grep "signal: killed"

### 4. 检查 Ollama 进程
ps aux | grep -E "ollama|llama" | grep -v grep

### 5. 检查数据库中已存储的向量维度（推断当前模型）
```python
import sqlite3

conn = sqlite3.connect('/opt/data/state.db')
cursor = conn.cursor()

# message_embeddings 向量维度
cursor.execute("SELECT vector FROM message_embeddings LIMIT 1")
row = cursor.fetchone()
if row and row[0]:
    dim = len(row[0]) // 4
    print(f"message_embeddings 向量维度: {dim}")

# wiki_embeddings 向量维度
cursor.execute("SELECT embedding FROM wiki_embeddings LIMIT 1")
row = cursor.fetchone()
if row and row[0]:
    dim = len(row[0]) // 4
    print(f"wiki_embeddings 向量维度: {dim}")

# 常见维度对应模型：
# 768 维 → bge-base-zh 或 text2vec-base-chinese
# 1024 维 → herald/dmeta-embedding-zh 或 bge-m3
```
```

## 排查方向（按优先级）

### 1. 确认是 OOM 而非其他问题
- sys=9 killed → OOM，解决方案是减少内存占用，不是调 timeout
- HTTP 400 + 超长耗时 → runner 被 kill 后 client 收到 EOF

### 2. 检查容器内存限制
- Docker cgroup 限制（如 4GB）+ Ollama 模型加载需 ~1.3GB = 容易 OOM

### 3. 降低 Ollama 内存占用
- 设置 `OMP_NUM_THREADS=2`（docker-compose environment），减少线程数降低内存峰值
- **关键：换用更小的 embedding 模型**（见下方模型选择）
- 使用 Lima VM 4GB 限制下，runner 内存峰值应控制在 < 300MB

### 4. API 端点必须匹配模型
**不同模型用不同的端点和字段名：**
- `/v1/embeddings` + `"input"` 字段：OpenAI 兼容格式，适用于 qwen3-embedding 等
- `/api/embeddings` + `"prompt"` 字段：Ollama 原生格式，适用于 herald/dmeta-embedding-zh
- 用错端点 → 微秒级 400 拒绝（不是超时，是立刻返回）

### 5. 客户端脚本优化（batch_embed_v3.py 模式）
- 超长文本必须切片（MAX_CHARS=500 for CPU N5105），按句子边界切
- 使用 nohup 后台运行，不阻塞前台交互
- TIMEOUT 至少 180 秒（N5105 单 chunk 约 17~22 秒）
- 不要在 OOM 时继续重试，会加重系统负担

### 6. 等待系统恢复
- Swap 满时需要等 OOM killer 平静下来
- 建议停掉所有任务，等 5~10 分钟后再试

### 7. 并行策略
- **不要并行**：N5105 4核心已满载，单请求串行是最优解
- 多请求并行只会导致 CPU 争抢 + 内存翻倍，更慢且更易 OOM

## 模型选择（2026-05 实测）

| 模型 | 大小 | 内存峰值 | N5105 可用性 | 推荐度 |
|------|------|---------|-------------|--------|
| qwen3-embedding:0.6b | 609MB | ~1.3GB | ❌ OOM | 废弃 |
| bge-m3 | 1104MB | 未知 | ❌ 可能OOM | 废弃 |
| mxbai-embed-large | 638MB | 未知 | ❌ 未完成测试 | 废弃 |
| **herald/dmeta-embedding-zh** | 195MB | ~289MB | ✅ 稳定 | **生产使用** |

**最终选型结论**：在 Lima VM 4GB 限制下，195MB 的 dmeta-embedding-zh 是唯一能稳定运行的 embedding 模型。

## 脚本路径（设计虱 NAS）
- 批量向量化脚本：`/opt/data/scripts/batch_embed_v3.py`
- 日志：`/opt/data/scripts/batch_embed_v3.log`
- 启动命令（后台）：`nohup python3 /opt/data/scripts/batch_embed_v3.py >> /opt/data/scripts/batch_embed_v3.log 2>&1 &`
- Ollama 地址：`http://localhost:11434/api/embeddings`
- 当前使用模型：`herald/dmeta-embedding-zh:latest`（195MB，F16）

## 诊断过程（本次实战）

### 1. Lima VM cgroup 4GB 限制发现路径
```
# 在容器内执行
cat /sys/fs/cgroup/memory.max
→ 4294967296  (= 4GB)

# 查看内存压力
cat /sys/fs/cgroup/memory.current
# 观察是否接近上限
```
这是 Lima 虚拟机层面的限制（绿联 UGOS Pro 无法修改），不是 Docker 容器限制。

### 2. qwen3-embedding 为什么 OOM
Lima VM 总共只有 4GB，系统占用 ~1GB，剩余 ~3GB 给所有容器共享。
qwen3-embedding:0.6b 加载需 ~1.3GB runner 内存，加上切片后的并发处理（17~22秒/block），
在 Swap 满的情况下触发 OOM killer。

### 3. 为什么换 dmeta 模型后 API 一直 400
换了 dmeta 模型后忘记换端点：
- qwen3-embedding 用 `/v1/embeddings` + `"input"`
- dmeta 模型用 `/api/embeddings` + `"prompt"`
不是超时，是立刻返回 400。

### 4. 为什么 N5105 单核切片优于并行
N5105 是 4 核心无 GPU 并发能力弱，MAX_CHARS=500（约 350~700 tokens）时单块处理最稳定。
当 51 个 chunk 并行时内存翻倍，单块 17~22 秒反而比串行更慢。

### 5. 向量化后台运行模式
```bash
# 标准后台启动命令
nohup python3 /opt/data/scripts/batch_embed_v3.py \
  >> /opt/data/scripts/batch_embed_v3.log 2>&1 &

# 实时查看进度
tail -f /opt/data/scripts/batch_embed_v3.log

# 检查进程是否存活
ps aux | grep batch_embed | grep -v grep
```

### 6. 已知 bug：日志出现两次 "Batch embed v3 starting ==="
如果看到连续两行完全相同的启动日志（如本例），说明脚本被启动了两次。
检查方法：
```bash
ps aux | grep batch_embed_v3 | grep -v grep
# 应该只有一个进程
```
重复启动会导致任务被处理两次。

## 本次教训
- **根本原因**：Lima VM 4GB 内存限制，qwen3-embedding:0.6b 内存峰值 1.3GB，runner 被 OOM killer 杀死
- **关键转折**：换用 herald/dmeta-embedding-zh（195MB，289MB 峰值）解决问题
- **误判**：之前所有 timeout 调整都是在错误方向上努力，根本不是超时问题
- **API 端点**：换了 dmeta 模型后端点从 `/v1/embeddings` 变为 `/api/embeddings`，字段名从 `input` 变为 `prompt`
- **并行无意义**：N5105 已满载，串行是最优策略
