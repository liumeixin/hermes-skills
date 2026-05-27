---
name: feishu-send-message
version: 1.1.0
slug: feishu-send-message
description: |
  通过 Feishu REST API 发送消息到群组，适用于 cron 任务和无 gateway 直连的场景。
  触发词：「飞书发消息」「发送到飞书群」「飞书群消息」「cron发飞书」。
  当用户提到发送飞书消息、群组通知、cron任务发消息时使用。
metadata: {"emoji": "📮", "keywords": ["feishu", "飞书", "send_message", "群消息", "cron"]}
---

# Feishu Send Message

通过 Feishu Open API 发送消息到群组，适用于 cron 任务、脚本等无法直接调用 gateway 的场景。

## 参考资源

本技能配套以下参考文件（位于 `references/` 目录）：

- `references/api-reference.md` — API 参考（获取token、发送消息、上传图片）
- `references/chat-id-lookup.md` — 群组 chat_id 查询表

---

## 凭证

```
位置：/opt/data/.env
字段：FEISHU_APP_ID、FEISHU_APP_SECRET
```

---

## 发送流程

### 1. 获取 tenant_access_token

```python
import json
from urllib.request import Request, urlopen

# 读取凭证
app_id = app_secret = None
with open('/opt/data/.env', 'r') as f:
    for line in f:
        line = line.strip()
        if line.startswith('FEISHU_APP_ID='):
            app_id = line.split('=', 1)[1]
        elif line.startswith('FEISHU_APP_SECRET='):
            app_secret = line.split('=', 1)[1]

# 获取 token（有效期 7200 秒，cron 任务每次重新获取）
token_url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
token_data = json.dumps({"app_id": app_id, "app_secret": app_secret}).encode()
req = Request(token_url, data=token_data, headers={"Content-Type": "application/json"})
resp = urlopen(req)
tenant_token = json.loads(resp.read().decode())["tenant_access_token"]
```

### 2. 发送文本消息

```python
chat_id = "oc_xxx"  # 目标群组 chat_id（见下方已知群组表）
send_url = "https://open.feishu.cn/open-apis/im/v1/messages"
send_data = json.dumps({
    "receive_id": chat_id,
    "msg_type": "text",
    "content": json.dumps({"text": "消息内容"})
}).encode()

req = Request(
    f"{send_url}?receive_id_type=chat_id",
    data=send_data,
    headers={
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": f"Bearer {tenant_token}"
    }
)
resp = urlopen(req)
send_resp = json.loads(resp.read().decode())
# send_resp["code"] == 0 表示成功
```

### 3. 上传并发送图片

飞书发送图片需要**先上传获取 image_key，再发送图片消息**。`MEDIA:` 前缀在飞书端不可靠，必须用 REST API。

```python
import os

def upload_image(filepath, tenant_token):
    """上传图片到飞书，返回 image_key"""
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    filename = os.path.basename(filepath)
    with open(filepath, 'rb') as f:
        file_data = f.read()
    body = (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="image_type"\r\n\r\n'
        f'message\r\n'
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="image"; filename="{filename}"\r\n'
        f'Content-Type: image/png\r\n\r\n'
    ).encode() + file_data + f'\r\n--{boundary}--\r\n'.encode()
    req = Request(
        "https://open.feishu.cn/open-apis/im/v1/images",
        data=body,
        headers={
            "Authorization": f"Bearer {tenant_token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}"
        }
    )
    resp = urlopen(req)
    result = json.loads(resp.read().decode())
    if result.get("code") == 0:
        return result["data"]["image_key"]
    raise Exception(f"Upload failed: {result}")

def send_image(chat_id, image_key, tenant_token):
    """发送图片消息到群组"""
    send_data = json.dumps({
        "receive_id": chat_id,
        "msg_type": "image",
        "content": json.dumps({"image_key": image_key})
    }).encode()
    req = Request(
        "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id",
        data=send_data,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": f"Bearer {tenant_token}"
        }
    )
    resp = urlopen(req)
    result = json.loads(resp.read().decode())
    return result.get("code") == 0
```

**批量发送图片**：

```python
for fname, label in covers:
    fpath = os.path.join(ARTICLE_DIR, fname)
    send_text(chat_id, label)
    image_key = upload_image(fpath, tenant_token)
    send_image(chat_id, image_key, tenant_token)
```

### 完整可运行脚本

以下是发送文本消息的完整脚本，可直接在 `execute_code` 中运行：

```python
import json
from urllib.request import Request, urlopen

# 1. 读取凭证
app_id = app_secret = None
with open('/opt/data/.env', 'r') as f:
    for line in f:
        line = line.strip()
        if line.startswith('FEISHU_APP_ID='):
            app_id = line.split('=', 1)[1]
        elif line.startswith('FEISHU_APP_SECRET='):
            app_secret = line.split('=', 1)[1]

if not app_id or not app_secret:
    raise ValueError("FEISHU_APP_ID or FEISHU_APP_SECRET not found in /opt/data/.env")

# 2. 获取 token
token_resp = json.loads(urlopen(Request(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    data=json.dumps({"app_id": app_id, "app_secret": app_secret}).encode(),
    headers={"Content-Type": "application/json"}
)).read().decode())
tenant_token = token_resp["tenant_access_token"]

# 3. 发送消息
chat_id = "oc_xxx"  # ← 替换为目标群组
message = "Hello from Hermes!"  # ← 替换为实际内容

send_resp = json.loads(urlopen(Request(
    f"https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id",
    data=json.dumps({
        "receive_id": chat_id,
        "msg_type": "text",
        "content": json.dumps({"text": message})
    }).encode(),
    headers={
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": f"Bearer {tenant_token}"
    }
)).read().decode())

print(f"Status: {'✅ Success' if send_resp.get('code') == 0 else '❌ Failed'}")
print(f"Response: {json.dumps(send_resp, ensure_ascii=False, indent=2)}")
```

---

## 已知群组 chat_id

```
家庭账本    oc_2abe398e83a9758c72451ed260170088
```

完整列表见 `references/chat-id-lookup.md`。

---

## 检查点

### 检查点：凭证检查前
- [ ] 确认 /opt/data/.env 存在
- [ ] 确认 FEISHU_APP_ID 和 FEISHU_APP_SECRET 已配置
- [ ] 确认 token 获取成功（tenant_access_token 非空）

### 检查点：发送前
- [ ] 确认目标群组 chat_id 正确（查群组表）
- [ ] 确认消息内容不超过 2000 字符
- [ ] 确认消息类型（文本/图片）

### 检查点：图片上传前
- [ ] 确认图片文件存在且非空
- [ ] 确认图片格式支持（PNG/JPG）
- [ ] 确认图片大小不超过 10MB
- [ ] 确认 multipart/form-data boundary 一致

### 检查点：完成后
- [ ] 确认消息发送成功（code == 0）
- [ ] 确认 image_key 获取成功（如发送图片）
- [ ] 记录发送结果供后续排查

---

## 错误处理

### 凭证文件缺失
```
/opt/data/.env 文件不存在或缺少必要字段
→ 检查文件是否存在
→ 验证 FEISHU_APP_ID 和 FEISHU_APP_SECRET 是否配置
→ 提供错误信息给用户
```

### Token 获取失败
```
API 返回认证错误
→ 检查 APP_ID 和 APP_SECRET 是否正确
→ 验证应用是否已发布
→ 提供错误信息给用户
```

### 消息发送失败
```
API 返回发送错误
→ 检查 chat_id 是否正确
→ 验证机器人是否在群组中
→ 检查消息格式是否正确
→ 提供错误信息给用户
```

### 图片上传失败
```
multipart/form-data 格式错误
→ 检查 boundary 是否一致
→ 验证图片文件是否存在
→ 检查图片格式是否支持
→ 提供错误信息给用户
```

---

## Pitfalls

1. **execute_code 中不能直接用 hermes send_message**：cron 任务运行在独立 session，没有 Feishu 工具可用，必须用 REST API
2. **read_file 在 execute_code 中需要 import**：`from hermes_tools import read_file`，否则 NameError
3. **token 有效期 7200 秒**：cron 任务每次重新获取即可
4. **消息长度限制**：Feishu 单条文本消息建议不超过 2000 字符
5. **receive_id_type 必须是 `chat_id`**：发送群消息时 query 参数必须带 `receive_id_type=chat_id`
6. **`MEDIA:` 前缀发图在飞书不可靠**：send_message 的 MEDIA: 前缀在飞书端经常丢图，必须用 REST API 上传+发送
7. **multipart/form-data boundary**：上传图片时 Content-Type 的 boundary 必须和 body 里的一致
8. **send_feishu_card 发图也需要 imageKey**：卡片消息中的图片不能直接用本地路径，必须先上传获取 image_key 再传入

---

## 与 family-ledger 的关系

家庭账本月度汇总 cron 任务使用此方法发送报告到飞书群。流程：
1. 读取 daily.json → 计算本月汇总 → 生成报告文本
2. 调用本技能的 Feishu API 发送报告
