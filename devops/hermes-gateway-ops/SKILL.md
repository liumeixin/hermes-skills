---
name: hermes-gateway-ops
description: Hermes Gateway 运维操作 — 重启、飞书平台代码关键位置、热修改生效
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

修改 `feishu.py` 等平台代码后，必须重启网关才能生效：
```bash
hermes gateway run --replace
```

## Hermes 路径与环境（容器/Docker 环境）

当前环境（群晖 Docker）：
- hermes CLI 实际路径：`/opt/hermes/.venv/bin/hermes`
- 不在系统 PATH 中，任何调用 `hermes ...` 的脚本会报"未安装"
- 容器内执行 hermes 命令需显式指定 PATH：
  ```bash
  PATH="/opt/hermes/.venv/bin:$PATH" hermes gateway status
  ```

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
