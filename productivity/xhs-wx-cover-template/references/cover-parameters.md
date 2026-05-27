# 封面参数速查

## 平台尺寸

| 平台 | 尺寸 | 宽高比 | 模板文件 |
|------|------|--------|---------|
| 微信公众号 | 1550×660 | 2.35:1 | f9-wx.html |
| 什么值得买 | 1550×660 | 2.35:1 | f9-wx.html |
| 知乎 | 1080×608 | 1.78:1 | f9-wx.html（缩放） |
| 小红书 | 1080×1440 | 0.75:1 | f9-xhs.html |

## 模板路径

```
✅ 正确：/opt/data/workspace/设计虱-写作系统/_templates/f9-wx.html
✅ 正确：/opt/data/workspace/设计虱-写作系统/_templates/f9-xhs.html
❌ 错误：/tmp/cover-output/（临时文件）
❌ 错误：/opt/data/workspace/Projects/html-ppt-skill/templates/cover-templates/（旧模板）
```

## 文字内容检查点

打开模板后必须确认以下内容已替换为当前文章：

- [ ] line1（主标题）
- [ ] line2（副标题）
- [ ] .desc / .subtitle（描述文字）
- [ ] .tag（标签）
- [ ] .tag-side（副标签，横向模板）
- [ ] .card-title（卡片标题）
- [ ] .card-items / .feat（卡片内容，3条）
- [ ] 作者署名（统一用「设计虱聊科技」）

## 尺寸参数速查

### 横版（公众号/什么值得买 1550×660）
- 标签字号：18px
- 标题 line1：57px
- 标题 line2：40px
- 副标题：21px
- 描述/作者：19px
- 右侧卡片宽：600px
- 卡片文字：28px
- 卡片 padding：36px 34px
- 间距 gap：50px

### 竖版（小红书 1080×1440）
- 标签：24px
- 主标题：78px
- 副标题：56px
- 特色条 padding：26px 36px
- 特色条文字：32px
- 作者：33px
- glass padding：270px 50px 80px 50px

## 截图命令

```bash
/opt/hermes/.venv/bin/python3 -c "
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': WIDTH, 'height': HEIGHT})
    page.goto('file:///path/to/cover.html')
    page.wait_for_timeout(800)
    page.screenshot(path='output.png', type='png')
    browser.close()
"
```

## 输出目录

```
✅ 正确：/opt/data/workspace/设计虱-写作系统/稿件库/已适配/YYYY-MM-DD-文章标题/
❌ 错误：配图子目录（直接放根目录）
```
