---
name: md-to-xiaohongshu-pptx
description: MD文件（带图床外链图片）直接生成小红书9:16竖版PPTX，自动分页
---

# MD 转小红书 9:16 PPTX

## 用途
MD 文件（带图床外链图片）直接生成小红书风格的 9:16 竖版 PPTX。

## 文件位置
`/tmp/md_to_ppt.js`

## 输入要求
- MD 文件中的图片必须是标准外链格式：`![](图床URL)`
- 不支持 Obsidian 本地语法 `![[xxx.png]]`
- 蓝色标题格式：`#### <span style="color: #4169E1;">| 标题文字</span>`
- 代码块用 triple backtick ``` 包裹

## 使用方法

### 1. 修改 MD_PATH
```javascript
const MD_PATH = '/path/to/your.md';
```

### 2. 修改输出路径
```javascript
const outPath = '/path/to/output.pptx';
```

### 3. 运行
```bash
cd /opt/hermes && node /tmp/md_to_ppt.js
```

### 4. 修复尺寸
pptxgenjs 不支持直接生成 9:16，需要手动修复：
```python
import zipfile, re, os, shutil

pptx_path = '/path/to/output.pptx'
temp_dir = '/tmp/pptx_fix'

if os.path.exists(temp_dir):
    shutil.rmtree(temp_dir)
os.makedirs(temp_dir)

with zipfile.ZipFile(pptx_path, 'r') as z:
    z.extractall(temp_dir)

pres_xml = temp_dir + '/ppt/presentation.xml'
with open(pres_xml, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('cx="9144000" cy="5143500"', 'cx="5143500" cy="9144000"')
with open(pres_xml, 'w', encoding='utf-8') as f:
    f.write(content)

with zipfile.ZipFile(pptx_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, temp_dir)
            z.write(file_path, arcname)
```

## 支持的内容块

| 类型 | 格式 | 渲染 |
|------|------|------|
| heading | `#### <span style="color: #4169E1;">| 标题</span>` | 蓝色粗体 |
| code | ``` 包裹 | 深色背景代码 |
| warning | `` `危险操作` `` | 红色背景 |
| highlight | `` `重点内容` `` | 黄色背景斜体 |
| image | `![](url)` | 从图床下载嵌入 |
| list | `- 列表项` | 圆点列表 |
| qa | `**Q:**` / `A:` | 灰底问答框 |
| tags | `#tag1 #tag2` | 普通正文 |
| text | 普通段落 | 正常文字 |

## 已知问题

- 长段文字可能溢出重叠 — 解决：把长段落拆成多个短 text 块
- addText 没有文字截断功能
- 图片下载超时会被跳过（不影响其他内容）

## 不支持的内容

- Obsidian 本地图片 `![[xxx.png]]` — 需要先上传到图床
- 表格
- 链接点击跳转