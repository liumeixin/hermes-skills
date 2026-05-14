---
name: playwright-headless-install
description: 在受限环境（无 root、容器）安装 Playwright 无头浏览器
---
# 在受限环境安装 Playwright 无头浏览器

## 适用场景
- 容器环境没有预装浏览器
- 没有 root 权限，无法用 apt-get
- npm 全局安装被拒绝

## 安装步骤

### 1. 本地安装 Playwright
```bash
npm install playwright
```

### 2. 设置自定义浏览器缓存路径
```bash
mkdir -p /opt/data/home/.playwright
export PLAYWRIGHT_BROWSERS_PATH=/opt/data/home/.playwright
```

### 3. 下载 Chromium（可能需要多次尝试）
```bash
PLAYWRIGHT_BROWSERS_PATH=/opt/data/home/.playwright npx playwright install chromium
```

如果超时，可以分步执行：
```bash
# 先下载主浏览器
PLAYWRIGHT_BROWSERS_PATH=/opt/data/home/.playwright npx playwright install chromium
# 再下载 headless shell（如果需要）
PLAYWRIGHT_BROWSERS_PATH=/opt/data/home/.playwright npx playwright install chromium-headless-shell
```

### 4. 使用时指定 executablePath
```javascript
const { chromium } = require('playwright');

const browser = await chromium.launch({
  headless: true,
  executablePath: '/opt/data/home/.playwright/chromium-1217/chrome-linux64/chrome'
});

const page = await browser.newPage();
await page.goto('https://example.com');
console.log(await page.title());
await browser.close();
```

## 常见问题

| 问题 | 解决 |
|------|------|
| npm 全局安装权限被拒 | 用 `npm install playwright` 本地安装 |
| 下载超时 | 分步执行，或者多试几次 |
| headless shell 没下载完 | 指定 executablePath 使用已下载的 chrome |
| 浏览器路径不对 | 用 `ls /opt/data/home/.playwright/` 检查 |

## 验证
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ 
    headless: true, 
    executablePath: '/opt/data/home/.playwright/chromium-1217/chrome-linux64/chrome' 
  });
  const page = await browser.newPage();
  await page.goto('https://www.baidu.com');
  console.log('Title:', await page.title());
  await browser.close();
})();
"
```