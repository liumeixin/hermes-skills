---
name: web-scraping-diagnosis
description: 诊断网页抓取失败的常见原因，识别反爬虫保护措施
triggers:
  - "抓取失败"
  - "网页爬取"
  - "scraping"
  - "anti-bot"
  - "验证码"
  - "微信文章"
  - "微信公众号"
---

# 网页抓取诊断技能

## 快速诊断流程

### 1. 检查控制台日志
```javascript
page.on('console', msg => console.log('Console:', msg.type(), msg.text()));
page.on('pageerror', err => console.log('Error:', err.message));
```

### 2. 常见反爬虫特征

| 特征 | 说明 |
|------|------|
| `TencentCaptcha` | 腾讯验证码，需要人工验证 |
| `waf_probe` | WAF 防护探测 |
| `setFp, window will reload` | 反爬虫 fingerprint 检测 |
| 空白 body 或 minimal HTML | 可能是反爬虫重定向 |
| `webdriver` 检测 | Selenium/Playwright 被检测 |

### 3. 已知的难以抓取的网站

| 网站 | 保护方式 | 备注 |
|------|----------|------|
| smzdm.com | 腾讯验证码 | 需要人工验证 |
| 微信文章 | 腾讯验证码 | 常触发（cap_appid 2003810213），需用户配合或粘贴内容 |
| 知乎 | 较宽松 | 可能需要登录 |

### 4. 绕过思路（仅供参考）

#### 4.1 基础绕过
```javascript
await page.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
  window.navigator.chrome = true;
});
```

#### 4.2 使用真实浏览器指纹
- 设置真实的 viewport、deviceScaleFactor
- 使用常见 User-Agent

#### 4.3 验证码处理
- 验证码基本无法自动化绕过
- 可考虑人工打码服务（不推荐，可能违规）
- **微信文章**：`window.cgiData {register_code: 4, cap_appid: 2003810213}` 表示触发腾讯验证码，Playwright 无法自动通过。此时应请求用户协助（手动验证或粘贴正文）

### 5. 诊断命令模板

```bash
PLAYWRIGHT_BROWSERS_PATH=/opt/data/home/.playwright node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ 
    headless: true, 
    executablePath: '/opt/data/home/.playwright/chromium-1217/chrome-linux64/chrome'
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('Console:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('Error:', err.message));
  
  await page.goto('YOUR_URL_HERE', {timeout: 45000, waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(8000);
  
  console.log('Final URL:', page.url());
  const html = await page.content();
  console.log('HTML size:', html.length);
  
  await browser.close();
})();
"
```

### 6. 判断成功/失败

**成功标志**：
- HTML size > 50000 字节
- URL 正确且无重定向
- body 包含实际内容

**失败标志**：
- HTML size < 20000 字节
- 出现验证码相关代码
- Console 显示 `waf_probe` 或 `setFp`

---

### 7. SPA 内容提取（浏览器不可用时的后备方案）

当 Playwright 不可用（如缺少 `libnspr4.so`）且页面是 JS 渲染的 SPA 时，可以从 JS bundle 中提取嵌入的内容。

**识别特征**：curl 抓到的 HTML 只有空 `<div id="root"></div>` 和一个 `<script src="assets/xxx.js">`，没有实际内容。

**提取流程**：

```bash
# 1. 下载 JS bundle
curl -sL 'https://example.com/assets/index-xxx.js' > /tmp/page.js

# 2. 从 JS 中提取中文内容块（SPA 通常把内容作为字符串嵌入）
python3 -c "
import re
with open('/tmp/page.js','r') as f: content = f.read()
# 方法A：grep 有意义的中文字符串（50+字符）
for m in re.finditer(r'[\u4e00-\u9fff]{10,}', content):
    start, end = max(0, m.start()-80), min(len(content), m.end()+80)
    print(content[start:end])
    print('---')
# 方法B：如果是 JSON 格式嵌入，提取 id/level/content 结构
blocks = re.findall(r\"content:'((?:[^'\\\\]|\\\\.)*?)'\", content)
for b in blocks: print(b.encode().decode('unicode_escape'))
"
```

**适用场景**：文档站、产品介绍页、博客（部分 SSR 失败时）。内容通常以字符串字面量、JSON 对象或模板字符串形式嵌入 JS。

**局限**：只能提取构建时嵌入的静态内容，动态 API 加载的数据需要找到对应的 fetch 端点。

## 相关工具

- Playwright 安装路径: `/opt/data/home/.playwright/chromium-1217/chrome-linux64/chrome`
- 截图保存: `/opt/data/home/.hermes/`