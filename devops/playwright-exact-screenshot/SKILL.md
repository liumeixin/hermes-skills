---
name: playwright-exact-screenshot
description: 用 Playwright 精确尺寸截图 HTML 页面，解决 browser_vision 视口固定 1280×720 导致的白边/缩放问题。触发词：精确截图、指定尺寸截图、HTML转PNG、封面生成
trigger: 需要按精确像素尺寸截图 HTML 页面时
---

# Playwright 精确尺寸截图

## 问题背景

`browser_vision` 截图基于浏览器工具，视口固定 1280×720。当 HTML 设计稿尺寸大于或不等于视口时，会出现：
- 白边（body < 视口，右侧/底部露出 html 默认白底）
- 缩放变形（CSS scale 方案把设计缩到视口大小，文字变小）
- 内容截断（body > 视口，溢出部分不可见）

## 解决方案

用 Playwright 脚本直接指定 viewport 尺寸，HTML 无需任何 hack。

### 截图脚本

路径：`/opt/data/scripts/html2png.py`

```python
#!/usr/bin/env python3
"""HTML → PNG 截图工具，精确指定输出尺寸，无白边"""
import sys
from playwright.sync_api import sync_playwright

def screenshot_html(html_path, output_path, width, height):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto(f"file://{html_path}")
        page.wait_for_timeout(500)
        page.screenshot(path=output_path, type="png")
        browser.close()
        print(f"OK: {output_path} ({width}x{height})")

if __name__ == "__main__":
    screenshot_html(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]))
```

### 调用方式

```bash
/opt/hermes/.venv/bin/python /opt/data/scripts/html2png.py <html_path> <output_png> <width> <height>
```

示例：
```bash
# 小红书竖版封面
/opt/hermes/.venv/bin/python /opt/data/scripts/html2png.py /tmp/cover.html /tmp/cover.png 1080 1440

# 微信公众号横版封面
/opt/hermes/.venv/bin/python /opt/data/scripts/html2png.py /tmp/cover.html /tmp/cover.png 1550 660
```

### HTML 模板要点

使用此方案时，HTML **不需要**任何 scale hack、`100vw/vh`、canvas 容器。直接写设计稿原始尺寸：

```css
html, body { width: 1080px; height: 1440px; overflow: hidden; }
body { /* 设计内容 */ }
```

Playwright 会以指定的 viewport 尺寸渲染页面，截图即原始像素。

## 依赖

- Playwright Python：`/opt/hermes/.venv/bin/python -c "from playwright.sync_api import sync_playwright"`
- 首次使用需确保 Chromium 浏览器已安装：`playwright install chromium`

### ⚠️ NAS 环境浏览器路径问题

**问题症状**：
```
playwright._impl._errors.Error: BrowserType.launch: Executable doesn't exist 
at /opt/data/home/.cache/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-linux64/chrome-headless-shell
```

**原因**：Playwright 默认查找路径 `/opt/data/home/.cache/ms-playwright/`，但 NAS 上浏览器实际位于 `/opt/hermes/.playwright/`

**解决方案**：在脚本开头设置环境变量
```python
import os
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/opt/hermes/.playwright'

from playwright.sync_api import sync_playwright
# ... 后续代码不变
```

或在终端设置后执行：
```bash
PLAYWRIGHT_BROWSERS_PATH=/opt/hermes/.playwright /opt/hermes/.venv/bin/python /opt/data/scripts/html2png.py ...
```

## 注意事项

- `page.wait_for_timeout(500)` 等待字体加载和渲染完成，Google Fonts 等外部字体可能需要更长
- 如果页面有 JS 动态内容，可增加等待时间或改用 `page.wait_for_load_state('networkidle')`
- 输出 PNG 无 EXIF/AI 元数据，与手动设计的图片在文件层面无区别
