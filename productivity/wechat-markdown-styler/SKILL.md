---
name: wechat-markdown-styler
description: 微信公众号 Markdown 排版工具 - 将 MD 转换为微信公众号可用的 HTML（纯 body + 内联样式）
---

# WeChat Markdown Styler
- 路径：productivity/wechat-markdown-styler
description: 微信公众号 Markdown 排版工具 - 将 MD 转换为微信公众号可用的 HTML（纯 body + 内联样式）

## 项目位置
- 本地代码：`/opt/data/wechat-md-styler/`
- 本地新项目：`/opt/data/workspace/Projects/wechat-md-styler/`
- NAS 代码：`/volume1/AgentShared/wechat-md-styler/`
- NAS 新项目：`/volume1/docker/hermes/hermes/workspace/Projects/wechat-md-styler/`
- 启动方式：`cd /opt/data/wechat-md-styler && python3 app.py`
- Docker 部署：参考 docker-compose.yml（端口 18888）

## 目录映射关系（重要！）
- 容器内 `/opt/data/` ⇔ NAS 上 `/volume1/docker/hermes/hermes/`
- 所有发给用户的路径都需要做此映射

## Docker 重建命令（NAS 上运行）
```
docker stop wechat-styler 2>/dev/null; docker rm wechat-styler 2>/dev/null; docker build -t wechat-md-styler:latest /volume1/docker/hermes/hermes/workspace/Projects/wechat-md-styler/ && docker run -d -p 18888:8080 --name wechat-styler wechat-md-styler:latest
```

**注意**：Flask 默认端口是 8080，docker 映射为 18888:8080。

## 支持的模板
- elegant: 优雅紫主题（默认）
- mdnice: mdnice 编辑器风格（淡背景渐变，参考"别人的 Hermes"文章）
- techdoc: 技术文档风格（左边距8px，字间距0.1em，红色标题线）
- minimal: 简约风
- tech: 技术风
- warm: 暖色调

## 常用样式修改

### 1. 字体（无衬线→衬线）
修改 `templates/elegant.css` 中的 body 字体：
```css
/* 无衬线（默认）*/
body { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif; }

/* 衬线（推荐中文写作）*/
body { font-family: "Georgia", "Times New Roman", "Songti SC", "SimSun", serif; }
```

### 2. 标题颜色
```css
h1, h2, h3, h4, h5, h6 {
  color: rgb(65, 105, 225);  /* 蓝色 */
}
```

### 4. 方格子背景（正确的CSS写法！）

❗ 之前用 `background-image: linear-gradient(...), linear-gradient(...)` 是错的！
正确写法是用 `background:` 简写，两个渐变值用逗号分隔：

```css
/* 正确写法（抄自"别人的Hermes有记忆会画图还省钱"文章） */
body {
    background-color: #fafafa;
    background-image: 
        linear-gradient(90deg, rgba(50, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0) 6.76%), 
        linear-gradient(360deg, rgba(50, 0, 0, 0.05) 0%, rgba(249, 247, 252, 0) 9.46%);
    background-repeat: repeat, repeat;
    background-size: 20px 20px, 20px 20px;
}

/* 或者用 background 简写（推荐，参考文章用的这种） */
body {
    background: linear-gradient(90deg, rgba(50, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0) 6.76%) left top / 20px 20px repeat scroll padding-box border-box,
                linear-gradient(360deg, rgba(50, 0, 0, 0.05) 0%, rgba(249, 247, 252, 0) 9.46%) 0% 0% / 20px 20px repeat rgba(0, 0, 0, 0);
}
```

两个渐变分别实现：
- `90deg` 水平渐变 → 竖线效果
- `360deg` 垂直渐变 → 横线效果
- 5%深色(rgba(50,0,0,0.05)) + 95%透明 → 网格交叉点效果

### 5. 小标题居中 + 紫色下划线（2026.04.30 最终方案）

❌ 错误：`display: inline-block` 会导致 `text-align: center` 失效，下划线反而拉长到整行。

✅ 正确方案：用 `<span>` 包住文字，边框加在 span 上，h2/h3 本身保持居中：

```python
# H2: ## 标题 - 居中 + 紫色下划线 + 深灰字
elif line.startswith('## '):
    new_lines.append(f'<h2 style="text-align: center; font-size: 20px; color: rgb(80, 80, 80); margin: 1em auto; font-weight: bold;"><span style="display: inline-block; border-bottom: 2px solid rgb(176, 159, 218); padding-bottom: 8px;">{line[3:]}</span></h2>')

# H3: ### 标题 - 居中 + 紫色下划线 + 深灰字
elif line.startswith('### '):
    title_text = line[4:]
    new_lines.append(f'<h3 style="text-align: center; font-size: 18px; color: rgb(80, 80, 80); margin: 1em auto; font-weight: bold;"><span style="display: inline-block; border-bottom: 2px solid rgb(176, 159, 218); padding-bottom: 8px;">{title_text}</span></h3>')
```

对应前端预览CSS：
```css
section[data-tool="wechat-styler"] h2 { text-align: center; font-size: 20px; color: rgb(80, 80, 80); margin: 1em auto; border: none; }
section[data-tool="wechat-styler"] h2 span { display: inline-block; border-bottom: 2px solid rgb(176, 159, 218); padding-bottom: 8px; }
section[data-tool="wechat-styler"] h3 { text-align: center; font-size: 18px; color: rgb(80, 80, 80); margin: 1em auto; border: none; }
section[data-tool="wechat-styler"] h3 span { display: inline-block; border-bottom: 2px solid rgb(176, 159, 218); padding-bottom: 8px; }
```

关键颜色值：
- 下划线紫色：`rgb(176, 159, 218)`（#B09FDA，比之前的 #9169D5 更浅）
- 标题字体：`rgb(80, 80, 80)`（深灰色，不是蓝色）
- 行内代码：`rgb(145, 109, 213)`（紫色，不是橙色 rgb(233,105,0)）

### 5.4 微信公众号背景过滤限制

**根本原因**：微信公众号编辑器粘贴时过滤 HTML 元素上的 `style` 属性中的某些 CSS 属性。

**已知会被过滤的 CSS**：
- `background-image: url(...)` — PNG/SVG/任何图片 URL 都会被过滤
- `background-image: linear-gradient(...)` — gradient 也被当 image 过滤

**可能保留的 CSS（待验证）**：
- `background:` 简写属性（不拆成 `background-image`）— 2026.04.30 正在测试
- 格式：`background: #FFF linear-gradient(...) linear-gradient(...) center center / 20px 20px;`

**135编辑器能做到的背景显示**：
- 135 用 Windows 原生 API 写剪贴板（不是浏览器的 `navigator.clipboard`），写入专有 RTF 格式
- 只有微信编辑器能解析，Notepad/飞书粘贴出来都是纯文字
- 这是 135 和微信的深度合作，Web App 无法复制

**135编辑器实际输出的验证方法**：
1. 135 里做个带网格的排版
2. 点"复制到公众号"
3. 粘贴到微信公众平台图文编辑框
4. F12 选择文章内容元素，看 `element.style` 中的实际内联 style

**当前最新代码（v2026.04.30.1900+）**：
```python
root_style = (
    'margin: 0px; '
    'padding: 10px; '
    'background: #FFF '
        'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px) '
        'linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px) '
        'center center / 20px 20px; '
    ...
)
```

**已尝试的方案总结**：
| 方案 | 预览 | 复制到微信 |
|------|------|-----------|
| PNG/SVG data URI (background-image) | ✅ | ❌ |
| 135editor 代理 URL (background-image) | ❌/✅ | ❌ |
| CSS gradient (background-image) | ✅ | ❌ |
| CSS gradient (background 简写) | ✅ | 🔄待验证 |

### 6. 方格子背景（_wrap_html 中的内联样式）

elegant 模板使用 135editor 代理 URL（当前最新方案）：

```python
# 在 _wrap_html 中（当前最新代码）
grid_png = "http://image2.135editor.com/cache/remote/aHR0cHM6Ly9tbWJpei5xcGljLmNuL21tYml6X3BuZy9mZ25reGZHbm5rVGRKVFFpYWpiaWNSWUVuOGxGYWs1QXpuZ01kY2R4WkZjdWZOcTRKaWJRZThHOHhnTTdYWVNnZmdJMERqR2w2dDZhZHh5SXZNUU5pY0Z4aWJpY0EvNjQwP3d4X2ZtdD1wbmc="

root_style = (
    'margin: 0px; '
    'padding: 10px; '
    'background-color: #FFF; '
    f'background-image: url("{grid_png}"); '
    'background-repeat: repeat; '
    'background-size: auto; '
    'background-position: center center; '
    'width: auto; '
    ...
    'box-sizing: border-box; '
    'overflow-x: hidden; '
)
```

❗ **关键**：微信公众号样式必须写在 Python 代码的内联样式中，只改 CSS 文件没用！

### 3. 版本时间
修改 `templates_flask/index.html` 右上角版本号：
```html
<div class="header-right" id="version-info">v2026.04.30</div>
```

### 4. 预览框透明背景（重要！）
如果预览框看不到方格子背景效果，检查 `.preview` 容器样式：
```css
.preview {
    background: transparent;  /* 不是 white，否则覆盖 body 背景 */
}

### 文件位置（注意有两份代码）

### 目录映射关系（重要！每次都要用这个转换）
- 容器内 `/opt/data/` ⇔ NAS 上 `/volume1/docker/hermes/hermes/`
- 本地开发：`/opt/data/workspace/Projects/wechat-md-styler/`
- NAS Docker：`/volume1/docker/hermes/hermes/workspace/Projects/wechat-md-styler/`

❗ **修改后必须重新构建镜像**，因为 Docker 镜像是静态打包的，不是动态挂载的！

## 从微信文章提取样式的方法
当用户分享微信文章 HTML 时，分析排版样式的步骤：

```python
import zipfile
import re

path = "xxx.zip"
with zipfile.ZipFile(path, 'r') as z:
    html = z.read('xxx.html').decode('utf-8')

# 提取正文
m = re.search(r'class="rich_media_content[^"]*"[^>]*>(.*?)</div>', html, re.DOTALL)
if m:
    content = m.group(1)
    
    # 提取 section 样式（正文背景）
    section = re.search(r'<section[^>]*style="([^"]+)"', content)
    if section:
        print(section.group(1))
    
    # 提取 p 样式（段落）
    p = re.search(r'<p[^>]*style="([^"]+)"', content)
    if p:
        print(p.group(1))
    
    # 提取标题样式
    h1 = re.search(r'<h[1-4][^>]*style="([^"]+)"', content)
    if h1:
        print(h1.group(1))
```

关键 CSS 属性对应：
- `font-size`: 字号
- `color`: 文字颜色（rgb(89,89,89)灰色）
- `line-height`: 行高
- `letter-spacing`: 字间距
- `padding`: 内边距（8px左边距）
- `text-align`: 对齐方式（justify两端对齐）
- `border-bottom`: 标题下边框（红色 rgb(250,81,81)）

## Flask CSP 配置（允许外链图片）
在 app.py 中添加 after_request hook：
```python
@app.after_request
def after_request(response):
    response.headers['Content-Security-Policy'] = "img-src * data: blob:;"
    return response
```

## 图片处理（重要！）
必须直接用 `<img>` 标签，不要用 `<figure>` 包裹。同时添加 referrerpolicy 解决跨域问题：
```python
html = re.sub(
    r'!\[([^\]]*)\]\(([^)]+)\)',
    r'<img referrerpolicy="no-referrer" src="\2" alt="\1" style="max-width:100%;display:block;margin:8px auto;">',
    html
)
```

## 功能按钮
- **一键复制到公众号**：使用 Clipboard API 复制富文本 HTML
- **导出HTML**：下载完整 HTML 文档（`<!DOCTYPE html>` 包装）

## 核心要点

### 0. 关键：正则处理顺序（图片必须最先）
```python
# 0. 去除 frontmatter (--- ... ---) - 必须最先处理
# 例：文章开头的 ---
# title: xxx
# tags: [xx, xx]
# ---
# 这种元数据会被误当段落，需要先去掉
html = re.sub(r'^---\n[\s\S]*?\n---\n', '', html)

# 1. 图片处理必须最先（优先于标题、代码块等）
html = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', r'<figure>...</figure>', html)

# 然后才是代码块、标题、链接...
```

### 1. 微信公众号只接受 body 内容（纯 body + 内联样式）
输出格式为 `<div class="output_wrapper" id="output_wrapper_id" style="...">...</div>`，不带 `<html>`, `<head>`, `<style>`。

### 2. 样式参照 md2all
- 外层 div 带基础样式：`font-size: 16px; color: rgb(62, 62, 62); line-height: 1.6; font-family: "Helvetica Neue", Helvetica, "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif`
- 所有元素使用内联 style，不用外部 CSS

### 3. 小标题格式（####）
- 自动添加蓝色 (`#4169E1`) + 竖线 `|`
- 如果用户已写 `|`，只加蓝色不重复添加

### 3. 各元素样式
| 元素 | 样式 |
|-----|------|
| frontmatter | 自动跳过 `---` 之间的 YAML 元数据 |
| H1-H3 | 黑色字，内联样式 |
| H3（###）mdnice | 紫色下边框 `border-bottom-color: rgb(222, 198, 251)` |
| H4（####） | 蓝色 #4169E1 + 竖线 `|` |
| 引用块 | 灰底 rgb(242,247,251) + 左边框 rgb(220,230,240) |
| 代码块 | 灰底 rgb(248,248,248) + 黑字，用 `<pre>` 包裹 |
| 行内代码 | 紫色 rgb(145,109,213) + 灰底，用 `<code>` 包裹 |
| 分割线 | 虚线 dashed |
| **图片 | 直接用 `<img src="url" ...>`，不要用 `<figure>` 包裹（figure 在预览界面不显示）** |

### 4. 段落处理：特殊元素独立成行
```python
# 关键：段落之间用换行分隔，否则微信公众号渲染时段首会连着上一段段尾
compact_content = '\n'.join(processed_lines)  # 而非 ''.join()

# 代码块用 <pre> 开头判断，行内代码 <code> 不触发代码块状态（避免行内代码被误当代码块）
if line.startswith('<pre>'):  # 而非 startswith('<pre') or startswith('<code')
    in_pre = True
```

### 5. 复制到微信公众号显示代码问题（重要bug！）

**根因**：输出HTML用了 `<div class="xxx">` 而不是纯内联样式。微信公众号不认class，只认style内联属性。

**修复方法**：后端 `_wrap_html` 必须输出：
```python
# ❌ 错误：用class（微信公众号会显示代码）
return f'<div class="elegant-preview" style="{base_style}">{content}</div>'

# ✅ 正确：用section标签 + 纯内联样式
return f'<section data-tool="wechat-styler" style="{root_style}">{content}</section>'
```

**为什么用section**：参考文章（mdnice）也用section作为根标签。微信公众号对section标签的样式解析比div更稳定。

### 5.1 预览CSS必须与输出HTML匹配

**关键**：后端输出是 `<section data-tool="wechat-styler">`，前端CSS必须用相同选择器！

```css
/* ❌ 错误：选择器不匹配 */
.elegant-preview { ... }

/* ✅ 正确：与后端输出一致 */
section[data-tool="wechat-styler"] { ... }
```

### 5.2 复制函数正确实现

复制应该直接选中预览区域内容，而非创建临时div：

```javascript
function copyToClipboard() {
    var preview = document.getElementById('preview-content');
    var range = document.createRange();
    range.selectNodeContents(preview);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    var ok = document.execCommand('copy');
    selection.removeAllRanges();
}
```

### 5.3 方格子背景 - 135editor代理URL方案（2026.04.30 最终尝试）

❌ PNG base64 / SVG data URI：微信过滤，不显示
❌ 阿里云OSS URL：不在白名单，微信过滤
❌ mmbiz直链：不在白名单，微信过滤

✅ 135editor代理URL：预览可能不显示（浏览器CORS限制），但复制到微信可能成功：
```python
grid_png = "http://image2.135editor.com/cache/remote/aHR0cHM6Ly9tbWJpei5xcGljLmNuL21tYml6X3BuZy9mZ25reGZHbm5rVGRKVFFpYWpiaWNSWUVuOGxGYWs1QXpuZ01kY2R4WkZjdWZOcTRKaWJRZThHOHhnTTdYWVNnZmdJMERqR2w2dDZhZHh5SXZNUU5pY0Z4aWJpY0EvNjQwP3d4X2ZtdD1wbmc="
```

如果预览需要显示，用OSS URL；如果只需要复制到微信后显示，用135editor代理URL。

```python
svg_pattern = (
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E"
    "%3Crect width='20' height='20' fill='none'/%3E"
    "%3Cline x1='0' y1='0' x2='20' y2='0' stroke='rgba(50,0,0,0.05)' stroke-width='1'/%3E"
    "%3Cline x1='0' y1='0' x2='0' y2='20' stroke='rgba(50,0,0,0.05)' stroke-width='1'/%3E"
    "%3C/svg%3E"
)
root_style = f'background-image: url({svg_pattern}); background-repeat: repeat; background-size: 20px 20px; ...'
```

### 8. 段落间距问题修复（重要！）
如果段落连在一起（无间距），按以下优先级修复：

#### 8.1 内联样式加 `!important`
```python
# 之前（可能被覆盖）
f'<p style="... margin: 1.5em 0px;">{line}</p>'

# 修复后
f'<p style="... margin: 0px 0px 16px 0px !important;">{line}</p>'
```

#### 8.2 用 `px` 替代 `em`
某些浏览器对 `em` 单位解释不一致，全部用 `px`。

#### 8.3 物理备份 `<br>`
即使样式被过滤，`<br>` 也能保证换行：
```python
paragraphs.append(f'<p ...>{line}</p>')
paragraphs.append('<br style="display:block; margin:0; padding:0; height:0; line-height:0; font-size:0;">')
```

#### 8.4 特殊元素独立成行
引用块、图片、标题等必须是独立的块级元素，不能嵌套在 `<p>` 里：
```python
# 正确：blockquote 独立
elif line.startswith('<blockquote'):
    paragraphs.append(line)

# 错误：blockquote 被包在 p 里（会导致样式冲突）
else:
    paragraphs.append(f'<p>...<blockquote>...</blockquote></p>')
```

#### 8.5 前端 JS 强制兜底（最终方案）
如果后端 CSS 多次被覆盖（全局 reset 如 `* { margin: 0; }`），即使内联样式 + `!important` 也可能失效。此时在前端用 JS 强制注入：

```html
<!-- 在 index.html 末尾 </body> 前添加 -->
<script>
(function() {
    var container = document.querySelector('.preview-content');
    if (container) {
        var blocks = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote, figure, ul, ol');
        blocks.forEach(function(el) {
            el.style.setProperty('margin-bottom', '16px', 'important');
        });
    }
})();
</script>
```

同时在前端 CSS 中也要加：
```css
.preview-content p {
    margin-bottom: 16px !important;
}
```

#### 8.6 前端 CSS 覆盖全局 reset（重要！）
有时全局 CSS 会写 `* { margin: 0; padding: 0; }` 重置所有样式，这种选择器优先级很高。需要用更具体的选择器覆盖：

```css
/* 在 index.html 的 <style> 中添加 */
.preview-content p,
.preview-content h1,
.preview-content h2,
.preview-content h3,
.preview-content h4,
.preview-content h5,
.preview-content h6,
.preview-content blockquote,
.preview-content figure,
.preview-content ul,
.preview-content ol {
    margin-bottom: 16px !important;
}
```

同时在转换后的回调函数中也加上 JS 强制设置：
```javascript
// 转换成功后强制给段落加间距
var container = document.getElementById('preview-content');
var blocks = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote, figure, ul, ol');
blocks.forEach(function(el) {
    el.style.setProperty('margin-bottom', '16px', 'important');
});
```

#### 8.7 空行（段落间隔）处理
用户手动按回车产生的空行，需要在公众号编辑时光标可以停在空行处。

**关键**：空行必须在前端处理阶段（标题处理）就保留，不能等后端 `_wrap_html` 阶段。因为 markdown 库会把空行间的 `\n\n` 转成单个 `<p>`。

```python
# 3. 标题处理 - 在这里就要保留空行
for line in lines:
    # 空行：保留为空行
    elif not line.strip():
        new_lines.append('')
    # 其他处理...
```

然后在后端 `_wrap_html` 阶段转成空 `<p>&nbsp;</p>`：

```python
# 空行：转为空的 <p> 标签，让光标可以停在空行处
if not line:
    paragraphs.append('<p>&nbsp;</p>')
    continue
```

同时前端 CSS 需要显示空段落：

```css
/* 空段落显示 */
.preview-content p:empty::before,
.preview-content p:only-child:empty::before {
    content: "↵";
    color: #ddd;
    font-size: 12px;
}
```

**Dockerfile 必须安装 markdown 库**：
```dockerfile
RUN pip install --no-cache-dir flask pyyaml markdown
```

### 10. mdnice 模板特殊处理
mdnice 模板需要特殊的内联样式（微信公众号不加载外部CSS）：
```python
# 在 _wrap_html 中
if self.template == 'mdnice':
    base_style += (
        'padding: 0px 10px; '
        'background: linear-gradient(90deg, rgba(50, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0) 6.76%) left top / 20px 20px repeat scroll padding-box border-box, '
        'linear-gradient(360deg, rgba(50, 0, 0, 0.03) 0%, rgba(249, 247, 252, 0) 9.46%) 0% 0% / 20px 20px repeat rgba(0, 0, 0, 0); '
    )
```

h3 标题（###）需要紫色下边框：
```python
# H3: ### 标题 - 紫色下边框 (mdnice风格)
elif line.startswith('### '):
    title_text = line[4:]
    new_lines.append(f'<h3 style="font-size: 17px; color: rgb(89, 89, 89); border-bottom-color: rgb(222, 198, 251); line-height: 1.5em; padding: 0px; margin: 30px 0px 15px 0px; font-weight: bold;">{title_text}</h3>')
```

**排查**：如果段落还是连在一起，加 `<br style="display:block">` 物理换行兜底。

**1. 后端：在每个段落后加 `<br>` 作为物理换行**
```python
# 在 wechat_styler.py 中
paragraphs.append(f'<p style="...">{line}</p><br>')
```

**2. 前端：用 Flexbox + gap 布局**
```javascript
// 在 index.html 的转换回调中
var container = document.getElementById('preview-content');
container.style.display = 'flex';
container.style.flexDirection = 'column';
container.style.gap = '16px';
```

注意：JavaScript 中设置 `gap` 需要先把容器设为 flex 布局，否则不生效。

**排查步骤：**
1. 先用 `docker exec` 检查后端输出的 HTML 是否每个段落都是独立的 `<p>` 标签
2. 如果有独立 `<p>` 但微信后台还是连在一起 → 在后端每个段落后加 `<br>`
3. 如果预览也不行 -> 用前端 Flexbox + gap

### 7. Git 合并冲突避免本地修改丢失
当远程有新提交时，本地修改可能被覆盖。安全做法：

```bash
# 先查看远程有多少新提交
git fetch origin
git log --oneline HEAD..origin/main

# 如果只有少量新提交，可以手动应用
# 方式1：放弃本地修改，直接用远程
git checkout --theirs wechat_styler.py app.py templates_flask/

# 方式2：手动同步本地修改到 Projects 目录（推荐）
cp /opt/data/wechat-md-styler/wechat_styler.py /opt/data/workspace/Projects/wechat-md-styler/
cp /opt/data/wechat-md-styler/app.py /opt/data/workspace/Projects/wechat-md-styler/
cp /opt/data/wechat-md-styler/templates/*.css /opt/data/workspace/Projects/wechat-md-styler/templates/

# 然后 commit 并 push
git add -A && git commit -m "fix: 同步本地修改" && git push origin main
```

**目录映射检查清单**：
- `/opt/data/wechat-md-styler/` = 本地开发目录
- `/opt/data/workspace/Projects/wechat-md-styler/` = 同步到 NAS 的目录
- 所有修改必须同步到 Projects 目录再构建

---

### 8. 支持的 Markdown
- 标题 (# ## ### ####)
- 粗体 **text**、斜体 *text*
- 代码块 ```code```、行内代码 `code`
- 图片 ![alt](url)
- 链接 [text](url)
- 无序列表 - item、有序列表 1. item
- 引用块 > text
- 分割线 --- / ***
```