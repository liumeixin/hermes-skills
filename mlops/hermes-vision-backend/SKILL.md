---
name: hermes-vision-backend
description: 为 Hermes Agent 配置自定义 vision 后端（如 MiniMax），解决某些 API 不支持 base64 图片的问题
tags: [hermes, vision, minimax, llm, multimodal]
---

# Hermes Vision 后端配置

## 背景
某些 vision API（如 MiniMax）不接受 base64 编码的图片，只接受远程图片 URL。Hermes 默认把所有图片转成 base64，需要修改配置来支持这类后端。

## 修改步骤

### 1. 添加 vision 模型映射
在 `agent/auxiliary_client.py` 中找到 `_PROVIDER_VISION_MODELS` 字典，添加你的 provider：

```python
_PROVIDER_VISION_MODELS: Dict[str, str] = {
    "xiaomi": "mimo-v2-omni",
    "zai": "glm-5v-turbo",
    "minimax": "minimax-vl-01",  # 添加这行
    "minimax-cn": "minimax-vl-01",
}
```

### 2. 添加到 auto 检测顺序（可选）
如果想让该 provider 在 vision auto 模式中被自动尝试，添加到 `_VISION_AUTO_PROVIDER_ORDER`：

```python
_VISION_AUTO_PROVIDER_ORDER = (
    "minimax-cn",  # 新增
    "openrouter",
    "nous",
)
```

### 3. 解决 base64 问题
对于不支持 base64 的 API（如 MiniMax），有两种方案：

**方案 A：使用图床**
- 配置阿里云 OSS 或其他图床服务
- vision 调用前先上传图片到 OSS，获取公网 URL
- 用 URL 代替 base64 发送给 API

**方案 B：使用专用 VLM 端点（推荐）**
- 某些 provider（如 MiniMax）提供独立的 VLM 端点处理 vision
- 端点格式和响应不同于标准 chat completions API
- 需要创建封装类适配现有 infrastructure

## 测试方法
重启 Hermes 后，用 vision_analyze 工具测试图片识别：

```python
vision_analyze(
    image_url="/path/to/image.jpg",
    question="描述这张图片"
)
```

## 常见问题
- **unknown model 错误**：检查模型名称是否正确（大小写敏感）
- **API 返回"没有图片"**：说明 API 不支持 base64，需要用远程 URL
- **401 认证错误**：检查 API Key 环境变量是否正确设置

## MiniMax 完整配置案例（2025-04）

### 问题现象
- MiniMax 返回错误: `invalid params, unknown model 'minimax-m2.7-multimodal'`
- 或者回复"抱歉，我看不到图片"

### 解决方案

**Step 1: 添加 vision 模型映射**
在 `agent/auxiliary_client.py` 中添加：
```python
_PROVIDER_VISION_MODELS: Dict[str, str] = {
    "xiaomi": "mimo-v2-omni",
    "zai": "glm-5v-turbo",
    "minimax-cn": "MiniMax-m2.7",  # 注意：不是 M2.7-multimodal！
}
```

**Step 2: 添加 OSS 上传函数**
在 `tools/vision_tools.py` 添加 `_upload_to_oss` 函数：
- 使用 `hashlib` + `hmac` 进行 OSS 签名（HMAC-SHA1）
- 使用 `urllib.request` 发送 PUT 请求上传图片
- 从环境变量读取 OSS 配置（OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET, OSS_ENDPOINT, OSS_PATH_PREFIX）
- 上传成功后返回公网 URL

**Step 3: 修改 vision 调用逻辑**
在 `vision_analyze_tool` 函数的图片处理部分，添加检测逻辑：
- 检测当前 provider 是否为 minimax-cn
- 如果是，先调用 `_upload_to_oss` 上传到 OSS
- 用返回的 URL 代替 base64 data URL

**Step 4: 设置环境变量**
在 .env 或启动环境中添加 OSS 配置

**Step 5: 重启生效**
```bash
pkill -f "hermes gateway" && /opt/hermes/.venv/bin/python3 /opt/hermes/.venv/bin/hermes gateway run &
```

### 关键发现

**重要更新 (2025-04)**：MiniMax vision 必须使用专用的 VLM 端点！

- 标准 Messages API 端点（`/v1/messages`、`/anthropic/messages`）全部返回 404
- MiniMax 的图像理解通过 **独立的 VLM 端点** `/v1/coding_plan/vlm` 实现
- 这不是 MCP 工具，而是直接的 REST API 调用

### VLM 端点方案（当前实现）

**端点**: `POST https://api.minimaxi.com/v1/coding_plan/vlm`

**请求格式**:
```json
{
    "prompt": "描述这张图片",
    "image_url": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Headers 需要**:
- `Authorization: Bearer {API_KEY}`
- `Content-Type: application/json`
- `MM-API-Source: Hermes-Vision` (可选标识来源)

**API Key**: 从环境变量读取 `MINIMAX_API_KEY`（需 Token Plan API Key，非按量付费 Key）

### 响应格式

```json
{
    "content": "图片分析结果文本",
    "base_resp": {"status_code": 0, "status_msg": "success"}
}
```

### 实现代码位置

在 `/opt/hermes/agent/auxiliary_client.py` 中：

1. `MiniMaxVisionClient` 类 - 封装 VLM 端点调用
2. `_try_minimax_vision()` - 工厂函数创建客户端
3. `_MINIMAX_VLM_BASE_URL` - 端点常量
4. 已在 `_PROVIDER_VISION_MODELS` 和 `_VISION_AUTO_PROVIDER_ORDER` 中注册

### 使用方式

配置 `MINIMAX_API_KEY` 环境变量，然后：
- 自动回退：当主 provider 是 MiniMax 时自动使用 MiniMax vision
- 手动指定：在 config.yaml 中设置 `auxiliary.vision.provider: minimax`

### 测试命令

```bash
cd /opt/hermes && .venv/bin/python -c "
from agent.auxiliary_client import resolve_vision_provider_client
provider, client, model = resolve_vision_provider_client(provider='minimax', async_mode=True)
print(f'Provider: {provider}, Client: {type(client).__name__}, Model: {model}')
"
```

### 关键发现

| 方案 | 端点 | 状态 |
|------|-----|------|
| Messages API | /v1/messages | ❌ 404 |
| Anthropic API | /anthropic/messages | ❌ 404 |
| 文本 chat API | /v1/text/chatcompletion_v2 | ❌ 不支持 vision |
| **VLM 端点** | /v1/coding_plan/vlm | ✅ 200 |

---

## 添加自定义 OCR 服务

除了 vision 图像理解，Hermes 也支持添加自定义 OCR 服务。

### 场景
- 用户部署了自己的 OCR API（如 Cloudflare Worker）
- 需要让 Hermes 能够调用这个 OCR 服务识别图片文字

### 实现步骤

**Step 1: 修改 vision_tools.py**

在 `/opt/hermes/tools/vision_tools.py` 末尾添加 OCR 工具：

```python
import httpx
import os
from pathlib import Path
import asyncio

_OCR_API_URL = os.getenv("HERMES_CUSTOM_OCR_URL", "https://your-ocr-api.com")

async def _ocr_analyze_from_url(image_url: str) -> str:
    """从 URL 下载图片并调用 OCR API"""
    from tools.vision_tools import _download_image
    
    temp_dir = Path("/tmp/hermes_vision")
    temp_dir.mkdir(parents=True, exist_ok=True)
    temp_path = temp_dir / f"ocr_{os.urandom(8).hex()}.png"
    
    try:
        await _download_image(image_url, temp_path)
        return await _ocr_analyze_from_file(temp_path)
    except Exception as e:
        raise RuntimeError(f"OCR 下载图片失败: {e}")
    finally:
        if temp_path.exists():
            temp_path.unlink(missing_ok=True)

async def _ocr_analyze_from_file(image_path: Path) -> str:
    """调用自定义 OCR API 分析图片"""
    if not image_path.exists():
        raise FileNotFoundError(f"图片文件不存在: {image_path}")
    
    image_content = image_path.read_bytes()
    
    # 检测 MIME 类型
    mime_type = "image/png"
    if image_path.suffix.lower() in (".jpg", ".jpeg"):
        mime_type = "image/jpeg"
    elif image_path.suffix.lower() == ".gif":
        mime_type = "image/gif"
    elif image_path.suffix.lower() == ".webp":
        mime_type = "image/webp"
    
    files = {"file": (image_path.name, image_content, mime_type)}
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(_OCR_API_URL, files=files)
        response.raise_for_status()
        result = response.json()
        text = result.get("text", "")
        if not text:
            return "OCR 识别结果为空（图片中未发现文字）"
        return text.strip()

async def custom_ocr_tool(image_url: str = None, image_path: str = None) -> str:
    """使用自定义 OCR API 识别图片中的文字"""
    if not image_url and not image_path:
        raise ValueError("必须提供 image_url 或 image_path")
    
    if image_url:
        if image_url.startswith("http://") or image_url.startswith("https://"):
            result = await _ocr_analyze_from_url(image_url)
        elif image_url.startswith("file://"):
            local_path = Path(image_url.replace("file://", ""))
            result = await _ocr_analyze_from_file(local_path)
        else:
            raise ValueError(f"不支持的 URL 格式: {image_url}")
    else:
        result = await _ocr_analyze_from_file(Path(image_path))
    
    return result

# 注册工具 - 使用 registry.register 不是 register_tool
registry.register(
    name="custom_ocr",
    toolset="vision",
    schema={
        "type": "object",
        "properties": {
            "image_url": {"type": "string", "description": "图片的 HTTP/HTTPS URL"},
            "image_path": {"type": "string", "description": "本地图片文件路径"}
        },
        "required": [],
    },
    handler=custom_ocr_tool,
    emoji="📝",
)
```

**Step 2: 更新 toolsets.py**

将 `custom_ocr` 添加到 vision toolset：

```python
"vision": {
    "description": "Image analysis and vision tools",
    "tools": ["vision_analyze", "custom_ocr"],
    "includes": []
},
```

**Step 3: 环境变量**

- `HERMES_CUSTOM_OCR_URL` - OCR API 地址（默认 https://ocr.868715.xyz）

### 返回格式要求

自定义 OCR API 应返回 JSON 格式：
```json
{"text": "识别到的文字内容"}
```

**重要**：JSONPath 应配置为 `$.text`（不是 ocr.space 的 `$.ParsedResults[0].ParsedText`）

### 常见问题

- **错误 `AttributeError: 'ToolRegistry' object has no attribute 'get_all_tools'`**：这是正常的，使用 `registry.get_all_tool_names()` 检查
- **导入错误 `cannot import name 'register_tool'`**：使用 `registry.register` 而不是 `register_tool`