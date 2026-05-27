# 飞书 API 参考

## 获取 tenant_access_token

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

# 获取 token
token_url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
token_data = json.dumps({"app_id": app_id, "app_secret": app_secret}).encode()
req = Request(token_url, data=token_data, headers={"Content-Type": "application/json"})
resp = urlopen(req)
tenant_token = json.loads(resp.read().decode())["tenant_access_token"]
```

## 发送文本消息

```python
def send_text(chat_id, text, tenant_token):
    """发送文本消息到群组"""
    send_url = "https://open.feishu.cn/open-apis/im/v1/messages"
    send_data = json.dumps({
        "receive_id": chat_id,
        "msg_type": "text",
        "content": json.dumps({"text": text})
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
    result = json.loads(resp.read().decode())
    return result.get("code") == 0
```

## 上传图片

```python
def upload_image(filepath, tenant_token):
    """上传图片到飞书，返回 image_key"""
    import os
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
```

## 发送图片消息

```python
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
