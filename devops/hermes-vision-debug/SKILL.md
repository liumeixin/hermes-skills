---
name: hermes-vision-debug
description: Hermes Vision 故障排查与 MiniMax 启用指南
tags: [vision, debug, minimax, auxiliary]
---

# Hermes Vision 故障排查与 MiniMax 启用

## 诊断命令

```bash
# 1. 检查 Vision 是否可用
cd /opt/hermes && .venv/bin/python -c "
from tools.vision_tools import check_vision_requirements
print(f'Vision 可用: {check_vision_requirements()}')
"

# 2. 检查配置
cd /opt/hermes && .venv/bin/python -c "
from hermes_cli.config import load_config
from agent.credential_pool import read_credential_pool
cfg = load_config()
print('Auxiliary Vision:', cfg.get('auxiliary', {}).get('vision', {}))
print('Credential Pool:', list(read_credential_pool().keys()))
"

# 3. 检查 vision 后端解析
cd /opt/hermes && .venv/bin/python -c "
from agent.auxiliary_client import resolve_vision_provider_client
provider, client, model = resolve_vision_provider_client()
print(f'Provider: {provider}, Client: {client}, Model: {model}')
"
```

## 问题 1: 无 API Key

**症状**: Vision 返回 False

**排查**:
- 检查 OPENROUTER_API_KEY 或 MINIMAX_API_KEY 是否配置
- `env | grep -i minimax` 或 `env | grep -i openrouter`

**解决**: 配置相应的 API Key

## 问题 2: MiniMax-CN 不可用于 Vision

**症状**: resolve_vision_provider_client 返回 None/False

**原因**: `auxiliary_client.py` 的 vision 后端没有 MiniMax

**代码位置**: `/opt/hermes/agent/auxiliary_client.py`

### 修复步骤

#### 1. 添加到自动检测列表

在 `_VISION_AUTO_PROVIDER_ORDER` (约第 1926 行) 添加 `"minimax-cn"`

#### 2. 添加分支到 _resolve_strict_vision_backend

```python
if provider == "minimax-cn":
    return _try_minimax_cn(vision=True)
```

#### 3. 实现 _try_minimax_cn 函数

VLM 端点: `https://api.minimaxi.com/v1/coding_plan/vlm`
模型: `video-01`

**重要**: MiniMax Vision 使用非标准 API 格式:
```python
{"model": "video-01", "prompt": "描述图片", "image_url": "data:image/png;base64,..."}
```

这需要在 vision_tools.py 或 async_call_llm 中额外适配调用格式。

## 问题 3: credential_pool 读不到 .env 变量

**症状**: `read_credential_pool('minimax-cn')` 返回空列表，尽管 .env 文件中有 API Key

**原因**: `credential_pool.py` 没有加载 .env 文件

**修复** - 在 `/opt/hermes/agent/credential_pool.py` 顶部添加（约第 1-5 行）:
```python
from dotenv import load_dotenv
load_dotenv()  # 加载 /opt/data/.env
```

## 问题 4: MiniMax 返回 404 找不到端点

**症状**: 
- 所有 MiniMax Messages API 端点都返回 404
- `/v1/messages` → 404
- `/anthropic/messages` → 404  
- `/v1/text/chat` → 404

**原因**: MiniMax 图像理解使用独立的 VLM 端点，不是标准 Messages API

**解决**: 使用 `/v1/coding_plan/vlm` 端点

```python
url = "https://api.minimaxi.com/v1/coding_plan/vlm"
payload = {
    "prompt": "描述图片",
    "image_url": "data:image/png;base64,xxx"  # 必须是完整 data URL
}
```

## Vision 模型映射

| Provider | Vision Model | 支持 Vision |
|----------|--------------|-------------|
| minimax-cn | MiniMax-M2.5 | ❌ 需确认模型名 |
| minimax | MiniMax-M2.5 | ❌ 需确认模型名 |
| openrouter | google/gemini-2-flash-preview | ✅ |
| nous | (免费 vision 模型) | ❓ |

**重要**: MiniMax-M2.7 **不支持 vision**。需要使用带 vision 的模型名（如有）。

## 验证

修复后运行:
```bash
cd /opt/hermes && .venv/bin/python -c "
from agent.auxiliary_client import resolve_vision_provider_client
provider, client, model = resolve_vision_provider_client(provider='minimax-cn')
print(f'Provider: {provider}, Client: {client is not None}, Model: {model}')
"
```

应该输出: `Provider: minimax-cn, Client: True, Model: MiniMax-M2.7`