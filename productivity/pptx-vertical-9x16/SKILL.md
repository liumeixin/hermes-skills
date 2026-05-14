---
name: pptx-vertical-9x16
description: 使用 pptxgenjs 生成 9:16 竖版 PPT 的完整流程，包含垂直比例设置和流式分页
---

# PptxGenJS 生成 9:16 竖版 PPT

## 问题背景

PptxGenJS 默认生成 16:9 横版幻灯片，直接设置 `slideWidth` 和 `slideHeight` 无效。

## 解决方案：生成后修改尺寸

### 步骤 1：用 pptxgenjs 生成内容

```javascript
// 注意：pptxgenjs 4.x 是 ES Module，require 后需要处理 .default
const pptxgenjs = require("pptxgenjs");
const pptxgen = pptxgenjs.default ? pptxgenjs.default : pptxgenjs;

let pres = new pptxgen();  // 用变量名，不是类名
pres.author = '作者';
pres.title = '标题';

// 设置尺寸（但实际无效，会被覆盖）
pres.slideWidth = 5.625;
pres.slideHeight = 10;

// 添加幻灯片内容...
pres.writeFile({ fileName: "/tmp/output.pptx" });
```
```

### 步骤 2：修改 presentation.xml 中的尺寸

生成后，解压 PPT，修改 `ppt/presentation.xml` 中的 `<p:sldSz>` 标签：

- 原始（横版）：`cx="9144000" cy="5143500"` (10 x 5.625 英寸)
- 目标（竖版）：`cx="5143500" cy="9144000"` (5.625 x 10 英寸)

```python
import zipfile, re, shutil, os

pptx_path = "/tmp/output.pptx"
temp_dir = "/tmp/pptx_unpacked"

# 解压
with zipfile.ZipFile(pptx_path, 'r') as z:
    z.extractall(temp_dir)

# 修改尺寸
pres_xml = temp_dir + '/ppt/presentation.xml'
with open(pres_xml, 'r', encoding='utf-8') as f:
    content = f.read()

# 交换 cx 和 cy
content = content.replace('cx="9144000" cy="5143500"', 'cx="5143500" cy="9144000"')

with open(pres_xml, 'w', encoding='utf-8') as f:
    f.write(content)

# 重新打包
output_path = "/final/output.pptx"
with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, temp_dir)
            z.write(file_path, arcname)
```

## 流式分页（可选）

如果内容需要按流动方式分页（每页放满后自动跳到下一页），可以实现：

```javascript
// 估算内容高度（单位：英寸）
function calcHeight(type, content, fontSize = 13) {
  const lineHeight = fontSize * 1.6 / 72;
  if (type === 'text') {
    const lines = content.split('\n').length;
    return lines * lineHeight + 0.15;
  } else if (type === 'code') {
    const lines = content.split('\n').length;
    return lines * (fontSize * 1.3 / 72) + 0.2;
  } else if (type === 'image') {
    return 2.5; // 图片默认高度
  }
  return 0.5;
}

// 自动分页逻辑
let currentSlide = null;
let currentY = 0.3;
const H = 10; // 幻灯片高度

function addContent(content, height) {
  // 如果当前页放不下，换新页
  if (currentY + height > H - 0.3) {
    currentSlide = pres.addSlide();
    currentSlide.background = { color: 'FFFFFF' };
    currentY = 0.3;
  }
  // 添加内容到当前页...
  currentY += height;
}
```

## 关键点

1. PptxGenJS 的 `slideWidth/slideHeight` 属性不会直接影响输出
2. 必须通过修改 PPTX 文件内部 XML 来改变比例
4. EMU 单位转换：1 英寸 = 914400 EMU
5. 9:16 竖版 = 5.625 x 10 英寸

## 防止文字重叠

流式分页时，如果内容高度估算过小，文字会溢出到下一页造成重叠。解决方法：

### 1. 更保守的高度估算

```javascript
function calcHeight(type, content, fontSize = 13) {
  const lineHeight = fontSize * 2.0 / 72; // 用更大的乘数
  if (type === 'text') {
    const lines = content.split('\n').length;
    return lines * lineHeight + 0.4; // 增加额外间距
  }
  // ...
}
```

### 2. 把长内容拆成短块

不要在一个 text 块里放太长内容，拆成多行：

```javascript
// 避免
{ type: 'text', content: '很长的一段话...' }

// 推荐 - 拆成多个短块
{ type: 'text', content: '第一段内容' },
{ type: 'text', content: '第二段内容' },
```

### 3. 添加 valign: "top"

确保文字从顶部开始渲染：
确保文字从顶部开始渲染：
```javascript
currentSlide.addText(data, {
  x: marginX, y: currentY, w: contentW, h: height,
  valign: "top"  // 关键：防止文字堆在底部
});
```

## 设计虱文章样式

```javascript
const bgColor = 'F8F4EF';    // 羊皮纸背景
const titleColor = '4169E1'; // 皇家蓝标题
const textColor = '323232';
const codeBg = '282C34';     // 代码块深色背景
const codeText = 'C8C8C8';   // 代码块浅色文字

// 通用样式
const textStyle = {
  fontSize: 20,
  color: textColor,
  fontFace: 'Microsoft YaHei',
  lineSpaceMult: 1.4
};

// 代码块 - 行距紧凑
const codeStyle = {
  fontFace: 'Consolas',
  fontSize: 13,
  color: codeText,
  bgColor: codeBg,
  lineSpaceMult: 1.0  // 紧凑行距，避免空行
};
```

### 封面标题（放大1.5倍）

```javascript
// 封面标题放大到 72pt（默认48pt的1.5倍）
slide.addText("打通AI知识库的\n任督二脉", {
  x: 0.5, y: 5, w: W - 1, h: 2,
  fontSize: 72,
  bold: true,
  color: titleColor,
  align: "center",
  fontFace: 'Microsoft YaHei'
});
```

### 小标题格式

```javascript
// 小标题格式：蓝色 + 竖线 + 粗体
slide.addText("| 小标题名称", {
  fontSize: 28,
  bold: true,
  color: titleColor,  // #4169E1 皇家蓝
  fontFace: 'Microsoft YaHei'
});
```

## 常见陷阱

### 1. pptxgenjs 模块解析问题

如果遇到 `pptxgenjs is not defined` 或构造函数无法找到：

```javascript
// ❌ 错误
const pptxgen = require("pptxgenjs");
let pres = new pptxgenjs();  // 类名不存在

// ✅ 正确
const pptxgenjs = require("pptxgenjs");
const pptxgen = pptxgenjs.default ? pptxgenjs.default : pptxgenjs;
let pres = new pptxgen();
```

### 2. 代码块高度估算

代码块要预留足够高度，但又要紧凑。经验公式：
- 20行代码 → h: 2.2
- 10行代码 → h: 1.0
- 3行代码 → h: 0.4

配合 `lineSpaceMult: 1.0` 使用，避免代码行之间有空隙。

### 3. 模块安装位置

如果 /opt/hermes 中没有 node_modules，需要在项目目录中安装：
```bash
mkdir -p /tmp/pptx_gen
cd /tmp/pptx_gen
npm install pptxgenjs
```