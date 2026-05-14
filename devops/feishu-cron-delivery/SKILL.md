---
name: feishu-cron-delivery
version: 1.0.0
description: Send messages to Feishu group chats from Hermes cron jobs using direct Feishu Open API calls
metadata:
  emoji: "📨"
  keywords: ["feishu", "cron", "lark", "group chat"]
  created: "2026-05-13"
---

# Feishu Cron Delivery Skill

Send messages to Feishu group chats from Hermes cron jobs running in the execute_code context.

## Problem

When running as a cron job with Feishu connected, the `send_message_tool` may fail with "Platform 'feishu' is not configured" because the platform config isn't loaded in the execute_code sandbox. However, Feishu credentials ARE available as environment variables in the cron job context.

## Solution: Direct Feishu Open API Call

```python
import os, json, urllib.request

app_id = os.environ['FEISHU_APP_ID']
app_secret = os.environ['FEISHU_APP_SECRET']
chat_id = os.environ.get('HERMES_CRON_AUTO_DELIVER_CHAT_ID', '<default_chat_id>')

# Get access token
url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
data = json.dumps({"app_id": app_id, "app_secret": app_secret}).encode()
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    token = json.loads(resp.read())["tenant_access_token"]

# Send message
send_url = "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id"
payload = json.dumps({
    "receive_id": chat_id,
    "msg_type": "text",
    "content": json.dumps({"text": message})
}).encode()

req = urllib.request.Request(send_url, data=payload)
req.add_header("Authorization", f"Bearer {token}")
req.add_header("Content-Type", "application/json")

with urllib.request.urlopen(req) as resp:
    result = json.loads(resp.read())
    # Success: result["code"] == 0
```

## Chat ID Format

- Group chats: start with `oc_` (e.g., `oc_2abe398e83a9758c72451ed260170088`)
- Private chats: start with `ou_`

## Verification

Check credentials in environment:
```bash
env | grep FEISHU_
```
