---
name: github-actions-secrets
description: 通过 GitHub API + Python/nacl 设置 Actions Secrets，避免 gh CLI 不可用时的手动操作。核心难点：nacl SealedBox 加密格式。
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [GitHub, Actions, Secrets, nacl, Docker]
    related_skills: [github-repo-management]
---

# 通过 API 设置 GitHub Actions Secrets

当 gh CLI 不可用、又无法访问 GitHub 网页时，通过 GitHub REST API + Python nacl 库加密并设置 Secrets。

## 环境

- nacl 库可用（`from nacl.public import PublicKey, SealedBox`）
- 需要有 GitHub PAT（需 `repo` + `workflow` 权限）

## 完整流程

```python
import base64
import requests
from nacl.public import PublicKey, SealedBox

GH_TOKEN = "ghp_xxxx"
OWNER = "username"
REPO = "repo-name"
SECRET_NAME = "MY_SECRET"
SECRET_VALUE = "my-secret-value"

headers = {
    "Authorization": f"token {GH_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

# 1. 获取仓库的 public key（用于加密）
key_resp = requests.get(
    f"https://api.github.com/repos/{OWNER}/{REPO}/actions/secrets/public-key",
    headers=headers
)
key_data = key_resp.json()
pub_key_b64 = key_data['key']
key_id = key_data['key_id']

# 2. 用 nacl SealedBox 加密 secret
pub_key_bytes = base64.b64decode(pub_key_b64)
public_key = PublicKey(pub_key_bytes)
sealed_box = SealedBox(public_key)

# ⚠️ 关键：直接用 encrypt() 返回 raw bytes，不要传 encoder=Base64Encoder
encrypted = sealed_box.encrypt(SECRET_VALUE.encode('utf-8'))
encrypted_value = base64.b64encode(encrypted).decode('utf-8')

# 3. 设置 secret
resp = requests.put(
    f"https://api.github.com/repos/{OWNER}/{REPO}/actions/secrets/{SECRET_NAME}",
    headers=headers,
    json={"encrypted_value": encrypted_value, "key_id": key_id}
)
print(f"Status: {resp.status_code}")  # 201 = 成功
```

## 坑：nacl 版本差异

某些 nacl 版本 SealedBox.encrypt() 不接受 encoder 参数，正确的写法：

```python
# ❌ 错误
encrypted = sealed_box.encrypt(secret, encoder=Base64Encoder)
encrypted_value = base64.b64encode(encrypted).decode('utf-8')

# ✅ 正确（nacl 1.5.0 测试通过）
encrypted = sealed_box.encrypt(secret)  # 直接返回 bytes
encrypted_value = base64.b64encode(encrypted).decode('utf-8')
```

## Docker Hub Secrets 场景

使用 GitHub Actions 推送到 Docker Hub（替代 ghcr.io 需要登录的问题）：

1. 获取 Docker Hub Access Token：https://hub.docker.com/settings/security
2. 通过 API 设置两个 Secrets：
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`

Workflow 中使用：
```yaml
- name: Log in to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

## 验证 secret 是否生效

触发 workflow：
```python
resp = requests.post(
    f"https://api.github.com/repos/{OWNER}/{REPO}/actions/workflows/{workflow_name}/dispatches",
    headers=headers,
    json={"ref": "main"}
)
# 204 = 成功触发
```