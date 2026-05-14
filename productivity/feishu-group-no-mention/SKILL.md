---
name: 飞书群免@自动响应
description: 让 Hermes 在飞书群里自动响应任何人的消息，无需 @mention
tags: [feishu, 飞书, 群消息, 免@]
trigger: 飞书群需要自动响应不@的消息
---

# 飞书群免@自动响应

飞书群消息默认需要 @mention 才响应，本技能让 Hermes 在群里自动响应任何人的消息，无需 @。

> ⚠️ 注意：之前旧版本修改的是第 3080 行（现已失效），新版本需修改第 3627 行的 `_should_accept_group_message` 函数。

## 适用场景

- 飞书群想让 Hermes 自动响应群里任何消息
- 不需要每次都 @Hermes

## 修改位置

文件：`/opt/hermes/gateway/platforms/feishu.py`
函数：`_should_accept_group_message`（约第 3627 行）

## 修改方法

将原函数体整体替换为：

```python
def _should_accept_group_message(self, message: Any, sender_id: Any, chat_id: str = "") -> bool:
    """Require an explicit @mention before group messages enter the agent."""
    if not self._allow_group_message(sender_id, chat_id):
        return False
    # @_all is Feishu's @everyone placeholder — always route to the bot.
    raw_content = getattr(message, "content", "") or ""
    if "@_all" in raw_content:
        return True
    mentions = getattr(message, "mentions", None) or []
    if mentions:
        return self._message_mentions_bot(mentions)
    normalized = normalize_feishu_message(
        message_type=getattr(message, "message_type", "") or "",
        raw_content=raw_content,
        mentions=getattr(message, "mentions", None),
        bot=self._bot_identity(),
    )
    return self._post_mentions_bot(normalized.mentions)
```

替换为简化版本：

```python
def _should_accept_group_message(self, message: Any, sender_id: Any, chat_id: str = "") -> bool:
    """Accept all group messages without requiring @mention."""
    # 群里任何消息都直接接收，无需 @mention
    return True
```

## 验证

修改后重启 Hermes，在群里发送一条普通消息，Hermes 应该自动回复。

## 相关配置

- 群策略默认值可通过环境变量 `FEISHU_GROUP_POLICY` 设置（`open`/`allowlist`/`disabled`）
- 也可在 config.yaml 中通过 `default_group_policy` 设置