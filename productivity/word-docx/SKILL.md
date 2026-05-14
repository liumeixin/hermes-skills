---
name: word-docx
slug: word-docx
version: 1.0.0
description: 创建、编辑 Microsoft Word 文档 (.docx)，处理样式、编号、表格、页眉页脚、修订等。用于需要生成 Word 文档的场景。
metadata: {"emoji": "📘", "os": ["linux", "darwin", "win32"]}
---

## 核心原则

### 1. DOCX 本质是 OOXML

- `.docx` 文件是一个 ZIP 包，包含多个 XML 文件
- 核心文件：`word/document.xml`（正文）、`word/styles.xml`（样式）、`word/numbering.xml`（编号）
- 文本可能分散在多个 run 中，不要假设一个句子只在一个 XML 节点里
- 读取用结构化方式，新建用样式驱动，编辑要懂 OOXML

### 2. 优先使用命名样式

- 用样式而非直接格式，这样文档保持可编辑性
- 样式层级：段落样式 > 字符样式 > 直接格式
- 编辑现有文件时，扩展现有样式系统，不要另起炉灶

### 3. 列表和编号是独立系统

- 编号属于 Word 的 numbering 定义，不是 Unicode 字符
- 缩进和编号相关但不相同，视觉正确不代表编号状态正确
- 用 Word 的列表功能创建编号，不要手动敲 "1. "

### 4. 页面布局在节（Section）中

- 页边距、方向、页眉页脚、页码都是节级设置
- 不同节可以有不同页眉页脚
- 设置明确的页面大小（A4 或 Letter），因为默认值影响分页和表格宽度

### 5. 复杂元素需要精确编辑

- 修订、评论、脚注、交叉引用、目录、页码都是字段（Field）
- 字段的显示值可能滞后于源数据
- 移动文本时要小心保留周围结构，否则会破坏评论标记或书签

### 6. 交付前验证兼容性

- 复杂文档在不同编辑器（Word、LibreOffice、Google Docs）间可能漂移
- 表格、页眉、嵌入字体是常见问题
- 表格要用明确宽度，避免 auto-fit 在其他编辑器中出问题

## 常用操作

### 创建新文档

```python
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = Document()

# 添加标题
title = doc.add_heading('文档标题', 0)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER

# 添加正文段落
p = doc.add_paragraph('这是正文内容')

# 添加带格式的文本
p = doc.add_paragraph()
run = p.add_run('加粗文字')
run.bold = True

# 添加代码块（用等宽字体）
p = doc.add_paragraph()
run = p.add_run('sudo chown root:root /volume1/AgentShared')
run.font.name = 'Consolas'
run.font.size = Pt(11)

# 添加列表
doc.add_paragraph('第一步：查用户ID', style='List Number')
doc.add_paragraph('第二步：设置ACL权限', style='List Number')

# 保存
doc.save('output.docx')
```

### 处理代码块转普通文本

当需要把 markdown 代码块转为 docx 时：
- 不要用代码块样式，用普通段落 + 等宽字体
- 保持缩进，用 4 空格或制表符
- 或用 `>` 引用格式

### 处理图片

```python
from docx.shared import Inches

# 添加图片
doc.add_picture('image.png', width=Inches(5))

# 图片居中
last_paragraph = doc.paragraphs[-1]
last_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
```

## 常见陷阱

- 复制粘贴可能导入不需要的样式和编号定义
- 空段落用作间距很脆弱，应该用段落设置中的间距
- 一个可见的短语可能分散在多个 run、书签、修订标记或字段边界中
- 用整个段落替换来改一个字往往会破坏评论、书签或附近的内联格式

## 相关技能

- `documents` — 通用文档处理和格式转换
- `article` — 长文撰写和编辑结构
- `powerpoint` — PPT 处理

## 反馈

- 有用请点赞：`skill_manage` 标记为有用
- 更新技能：`skill_manage sync`