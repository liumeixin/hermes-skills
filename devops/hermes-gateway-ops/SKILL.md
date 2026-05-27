---
name: hermes-gateway-ops
description: Hermes Gateway 运维操作 — 重启、飞书平台代码关键位置、热修改生效
notes: 本 skill 包含配置示例和表格，在飞书等不支持 markdown 表格的平台，请用代码块格式重述。
---

## 群晖 Docker 部署代码修改生效流程
修改 /opt/hermes 代码后，必须同步到 Docker 容器并重启：

```bash
# 复制修改后的文件到容器
docker cp /opt/hermes/gateway/platforms/feishu.py hermes:/opt/hermes/gateway/platforms/feishu.py
# 重启容器
docker restart hermes
```

## 飞书群策略配置
飞书群消息策略控制文件：`/opt/hermes/gateway/platforms/feishu.py`

关键位置：
- 第 388 行：`default_group_policy` 配置字段定义
- 第 1461 行：`default_group_policy` 配置解析
- 第 3628-3631 行：`_should_accept_group_message` 函数（群聊免@核心逻辑）

群策略选项：open（任何人）、allowlist（白名单）、admin_only、disabled

### 群里免@自动响应（最新）
函数 `_should_accept_group_message`（第 3628 行）决定群消息是否需要 @mention。

**简化版直接返回 True**（实现免@自动响应）：
```python
def _should_accept_group_message(self, message: Any, sender_id: Any, chat_id: str = "") -> bool:
    """Accept all group messages without requiring @mention."""
    # 群里任何消息都直接接收，无需 @mention
    return True
```

生效方式：重启 Hermes Gateway

## 重启网关（Docker 容器内）

容器内 PID 1 是 init 进程，普通 `kill` 信号无效。

```bash
# 正确方式：使用 --replace 热重启
hermes gateway run --replace &
```

注意：新进程会拉起后在前台运行，加 `&` 放入后台。

### ⚠️ PID 1 环境下的陷阱

**症状**：`hermes gateway run --replace` 报错 `OSError: [Errno 98] address already in use on port 18643`

**原因**：Hermes 本身就是容器的 PID 1（init 进程），已经绑定了端口，`--replace` 无法重复绑定。

**表现**：
- `ps aux | grep hermes` 显示 PID 1 正在运行 `hermes gateway run`
- 多次 `hermes gateway restart` 会产生大量 defunct 僵尸进程
- 原 Hermes 仍然正常运行，飞书连接不断

**处理方式**：
1. **配置变更（.env、auxiliary_client.py 等）不需要重启**——下次 API 调用时自动生效
2. 如果必须重启（比如要加载全新代码），在 NAS 宿主机上执行：
   ```bash
   docker restart hermes
   ```
3. 清理僵尸进程（无害但难看）：
   ```bash
   kill -9 <zombie_pid>  # 僵尸进程的 PPID 已被 PID 1 回收，无需处理
   ```

## 飞书平台代码关键位置

文件：`/opt/hermes/gateway/platforms/feishu.py`

### 群聊免@响应控制
- **函数**：`_should_accept_group_message`（第 3628 行）✅ 当前版本
- **旧版本**：第 3063 行（已失效，代码结构已变更）
- **逻辑**：
  - DM (p2p) 不走此函数，天然免@
  - 群聊必须调用此函数判断是否放行
- **核心逻辑**：函数直接返回 `True` = 不@也放行；返回 `False` = 不@就拒绝

### 群聊消息入口
- **第 1791 行**：`if chat_type != "p2p" and not self._should_accept_group_message(...)`
- 只有非 DM 才走 mention gate

## 并发模型

- **per-chat 锁**：同群消息串行处理（`_handle_message_with_guards` 第 2065 行）
- **跨群**：无全局并发上限，有多少群同时发消息就可以同时处理多少个
- **AIAgent 实例缓存**：`run_agent.py` 第 608 行，按 session_key 缓存，复用 prompt caching

## 热修改代码后生效

修改以下内容后，**不需要重启 Hermes**，下次 API 调用时自动生效：
- `config.yaml` 配置变更
- `.env` 中的 API endpoint 修改
- `auxiliary_client.py` 中的模型映射（主模型、辅助模型、vision 模型等）
- 任何 Python 文件中的配置类修改（`_PROVIDER_XXX` 字典等）

只有修改飞书平台代码（`feishu.py`）后，才需要重启：
```bash
hermes gateway run --replace
```

## 重启注意事项：僵尸进程循环

**危险操作序列**：`hermes gateway run --replace` 如果端口被占用（`address already in use`），会报端口冲突并退出，但原进程（PID 1）仍在跑。反复执行会产生多个 defunct 进程并耗尽终端 TTY，导致**所有前台命令永久卡住**（exit code 130）。

**正确做法**：
1. 先 `ps aux | grep hermes | grep -v grep` 确认是否有残留进程
2. 如果有 defunct + restart 进程，用 `kill -9 <PID>` 清理掉再重启
3. 如果终端已经卡住，用 `process(action='list')` → `process(action='kill', session_id='xxx')` 逐个杀残留 session
4. `pgrep -a hermes` 可以绕过 TTY 阻塞快速确认进程状态

## Hermes 路径与环境（容器/Docker 环境）

当前环境（群晖 Docker）：
- hermes CLI 实际路径：`/opt/hermes/.venv/bin/hermes`
- 不在系统 PATH 中，任何调用 `hermes ...` 的脚本会报"未安装"
- 容器内执行 hermes 命令需显式指定 PATH：
  ```bash
  PATH="/opt/hermes/.venv/bin:$PATH" hermes gateway status
  ```

### ⚠️ 配置文件唯一路径（易混淆）

`get_hermes_home()` 返回 **`/opt/data`**（不是 `/opt/data/home` 也不是 `/root`），所以：

- **`/opt/data/config.yaml`** — ✅ **唯一权威配置**（394行完整配置），Gateway 和所有插件都读这个
- **`/opt/data/hermes/config.yaml`** — ❌ **不存在或为孤立片段**（可能只有 2 行 memory 配置），没有任何代码读取
- **`/opt/hermes/`** — ❌ **代码安装目录**，不含 config.yaml（只有 cli-config.yaml）

**编辑配置只看 `/opt/data/config.yaml`，不要在其他位置找。**

验证方法：
```bash
# 确认 get_hermes_home() 返回值
/opt/hermes/.venv/bin/python3 -c "from hermes_cli.config import get_hermes_home; print(get_hermes_home())"
# 输出: /opt/data
```

## Hermes Auxiliary 模型配置（完整指南）

### 三个辅助模型配置

在 `config.yaml` 的 `auxiliary` 节点下配置：

```yaml
auxiliary:
  vision:        # 看图（图生文）必需多模态模型
    provider: ecloud
    model: Minimax-M2.5  # 纯文本，不支持看图！
    # 如果需要看图，用 glm-4v-flash（需配置 ZHIPU_API_KEY）

  compression:   # 上下文压缩，必须用非推理模型
    provider: ecloud
    model: Minimax-M2.5  # 推理模型会报错导致"失忆"
    # 建议用 glm-4.5-flash（需配置 ZHIPU_API_KEY）

  web_extract:   # 网页提取，auto 即可
    provider: auto
```

### 常见错误及解决方案

#### 1. vision 报错 "is not a multimodal model"
- **原因**：配置的主模型（如 MiniMax-M2.5）只能处理文字，不支持看图
- **错误信息**：`'/workspace/cache/aiops-model/aiops-model/base/MiniMax-M2.5 is not a multimodal model'`
- **解决**：给 vision 配置独立的多模态模型，如 glm-4v-flash

#### 2. compression 导致"失忆"
- **原因**：推理模型做压缩摘要需要传回 reasoning_content，但压缩是独立单轮调用
- **错误信息**：`'The reasoning_content in the thinking mode must be passed back to the API.'`
- **解决**：compression 必须用非推理模型（如 glm-4.5-flash）

#### 3. 401 令牌过期错误
- **原因**：配置的 API Key 无效或已过期
- **错误信息**：`'令牌已过期或验证不正确' (code: 401)`
- **解决**：检查 api_key 是否正确配置，或改用有效的模型

### ⚠️ 重要：Docker 容器环境变量更新

当 Hermes 运行在 Docker 容器中时，直接在宿主机上创建 `.env` 文件**不会生效**，因为容器内的进程无法读取宿主机的 .env 文件。

**正确做法（二选一）**：

1. **通过群晖 Docker 界面更新**：
   - 容器 → 编辑 → 环境变量
   - 添加或更新 `GLM_API_KEY=your-new-key`

2. **通过 SSH 命令更新**（临时，重启后失效）：
   ```bash
   # 方式A：重启容器时带上新环境变量（需要先停止容器）
   docker stop hermes && docker run --env GLM_API_KEY=your-key ... hermes
   
   # 方式B：通过群晖修改容器配置后重新启动
   ```

**验证是否生效**：在容器内执行 `env | grep GLM_API_KEY` 确认能看到 key。

### 配置原则

| 任务类型 | 模型要求 | 推荐模型 |
|---------|---------|---------|
| vision 看图 | 多模态模型 | glm-4v-flash |
| compression 压缩 | 非推理模型 | glm-4.5-flash |
| web_extract | 任意文本模型 | auto |

**如果只有 MiniMax-M2.5**：必须放弃看图功能，compression 可能会导致失忆（取决于 API 是否严格检查 reasoning_content）。

## providers.context_length 控制定价档位

mimo-v2.5 等模型有分段定价（≤256K 便宜，256K-1M 贵一倍）。在 `config.yaml` 的 `providers` 中设置 `context_length` 可以限制上下文窗口，锁在便宜档：

```yaml
providers:
  xiaomi:
    base_url: https://token-plan-cn.xiaomimimo.com/v1
    api_key_env: XIAOMI_API_KEY
    context_length: 256000   # 限制为 256K，锁定 ≤256K 价格档
```

生效机制：`get_model_context_length()` 的第 0 步就是读 `custom_providers` 中的 `context_length`，优先级最高。配合 `compression.threshold: 0.75`，压缩在 192K 触发，不会超 256K。

## 定时任务投递失败排查

### 症状
定时任务运行成功（`last_status: ok`）但投递失败：
```
last_delivery_error: "Feishu send failed: [230001] ext=invalid receive_id"
```

### 根因
投递目标名称无法解析为有效的 chat_id。常见情况：
- `feishu:Hermes-工作` ❌ - 名称在 cron 上下文中无法解析
- `feishu:工作` ❌ - 同上
- `feishu:oc_42e9d293025cb75aa45c1d092d862be7` ✅ - 使用真实 chat_id

### 排查步骤

1. **查看 cron job 当前配置**：`cronjob action=list`
2. **从日志查找真实 chat_id**：`grep "Inbound group message" /opt/data/logs/agent.log | tail -20`
3. **列出可用投递目标**：`send_message action=list`
4. **更新为真实 chat_id**：`cronjob action=update job_id=<job_id> deliver=feishu:oc_xxxxx`

### 关键发现
- `send_message list` 显示已连接过的群组，不是所有群组
- 日志里的 `chat_id` 是最可靠的实际运行时 ID
- cron 投递必须用 `oc_xxxxx` 格式，不能用群名称

## 飞书私聊回复失败排查（2026-05-23）

### 症状
- 用户私聊发消息，Hermes 能收到（Inbound 日志有）
- 没有任何 Outbound 回复

### 根因
飞书报错 `Your request contains an invalid request parameter, ext=invalid message content, ext=message_content has wrong tag:{table}`

- 回复内容包含 `{table}` 标签（JSON 表格数据），飞书不支持
- 发送失败后 fallback 到纯文本时，也没有过滤掉这个标签，导致重试也失败

### 排查步骤

1. **查看日志**：`grep -i "send failed\|230001" /opt/data/logs/agent.log | tail -20`

2. **定位代码**：错误检测在 `handler.py`，需要增加 `{table}` 错误识别

3. **修复位置**：`/opt/hermes/app/app/feishu/handler.py`
   - 扩展错误检测正则，识别 `{table}` 错误
   - fallback 纯文本转换时，过滤 `{xxx}` 格式的标签

4. **生效**：重启 Gateway `docker restart hermes-gateway`
