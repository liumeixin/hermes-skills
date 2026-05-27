#!/usr/bin/env python3
"""HTML 截图脚本 - 使用 Playwright 生成 PNG"""

import sys
from playwright.sync_api import sync_playwright


def screenshot_html(html_path: str, output_path: str, width: int = 1080, height: int = 1440):
    """
    截图 HTML 文件为 PNG

    参数:
        html_path: HTML 文件路径 (file:// 协议)
        output_path: 输出 PNG 路径
        width: 视口宽度 (默认 1080)
        height: 视口高度 (默认 1440)
    """
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.goto(html_path)
        page.wait_for_timeout(800)  # 等待渲染完成
        page.screenshot(path=output_path, type='png')
        browser.close()
    print(f"✅ 截图已保存: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("用法: python playwright-screenshot.py <html_path> <output_path> [width] [height]")
        sys.exit(1)

    html_path = sys.argv[1]
    output_path = sys.argv[2]
    width = int(sys.argv[3]) if len(sys.argv) > 3 else 1080
    height = int(sys.argv) if len(sys.argv) > 4 else 1440

    screenshot_html(html_path, output_path, width, height)
