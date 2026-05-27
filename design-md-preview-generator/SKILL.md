---
name: design-md-preview-generator
description: 从 DESIGN.md 生成预览图并截图的工作流 - 解决 Playwright 浏览器路径问题和 YAML 解析
category: productivity
---

# DESIGN.md 预览图生成

从 DESIGN.md 设计规范文件生成可视化预览并截图的工作流。

## 适用场景
- 设计虱自媒体封面模板需要参考各网站设计风格
- 需要批量生成设计系统预览图
- VoltAgent/awesome-design-md 类仓库（只有 DESIGN.md 没有 preview.html）

## 关键发现

### 问题 1：仓库没有 preview.html
awesome-design-md 仓库只包含 DESIGN.md 文件，需要解析 YAML frontmatter 提取颜色和字体信息后动态生成 preview.html。

### 问题 2：Playwright 浏览器路径
系统已安装的 Playwright 浏览器位于非标准路径：
```
/opt/hermes/.playwright/chromium_headless_shell-1217/chrome-headless-shell-linux64/chrome-headless-shell
```
新版本 Playwright 默认查找 `chromium_headless_shell-1223`，需要在代码中指定 `executablePath`。

## 完整流程

### 1. 克隆仓库
```bash
cd /opt/data/workspace && git clone https://github.com/VoltAgent/awesome-design-md/
```

### 2. 安装依赖
```bash
pip install pyyaml jinja2 --break-system-packages -q
cd /opt/data/workspace/awesome-design-md
npm install playwright@1.56.0 --silent
```
注意：使用 1.56.0 版本兼容性更好

### 3. 生成 preview.html
从 DESIGN.md 解析 YAML，生成 HTML 预览页面：

```python
#!/usr/bin/env python3
import os
import re
import yaml
from pathlib import Path

def parse_design_md(design_md_path):
    content = design_md_path.read_text()
    yaml_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not yaml_match:
        return None
    try:
        return yaml.safe_load(yaml_match.group(1))
    except:
        return None
```

### 4. Playwright 截图
```javascript
const { chromium } = require('playwright');

const browser = await chromium.launch({ 
    headless: true,
    executablePath: '/opt/hermes/.playwright/chromium_headless_shell-1217/chrome-headless-shell-linux64/chrome-headless-shell'
});
```

## 验证步骤
```bash
ls /opt/data/workspace/awesome-design-md/previews/ | wc -l  # 确认截图数量
tar -czvf previews.tar.gz previews/  # 打包发送
```

## 常见问题

| 问题 | 解决方案 |
|------|----------|
| Playwright 浏览器不存在 | 指定已有浏览器的 `executablePath` |
| 端口占用 | 使用不同端口如 8765 |
| Python 模块缺失 | `pip install pyyaml jinja2 --break-system-packages` |