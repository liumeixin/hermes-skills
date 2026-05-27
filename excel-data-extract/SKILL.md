---
name: excel-data-extract
title: Excel数据文件读取技巧
description: 处理各种格式Excel文件的读取方法，特别是面对损坏或不兼容文件时的备选方案
trigger: 读取Excel、xlsx文件读取失败、xlrd报错、openpyxl报错
category: data-science
---

# Excel数据文件读取技巧

## 问题场景

用户提供的Excel文件可能是：
- `.xls` 文件（BIFF格式，旧版Excel）
- `.xlsx` 文件（Office Open XML格式）
- `.xlsb` 文件（二进制格式）

有时会遇到：
- openpyxl读取报错：`TypeError: expected <class 'openpyxl.styles.fills.Fill'>`
- xlrd读取报错：`XLRDError: Expected BOF record`

## 解决方案

### 1. 先判断文件类型

```python
with open(path, 'rb') as f:
    header = f.read(8)
    if header[:8] == b'\xd0\xcf\x11\xe0':  # BIFF格式 (.xls)
        # 用 xlrd 读取
    elif header[:2] == b'PK':  # ZIP格式 (.xlsx)
        # 用 openpyxl 或手动解析
```

### 2. .xls 文件 → 用 xlrd

```python
import xlrd
book = xlrd.open_workbook('file.xls')
sheet = book.sheet_by_index(0)
for i in range(sheet.nrows):
    row = [sheet.cell_value(i, j) for j in range(sheet.ncols)]
```

⚠️ 注意：xlrd 只支持 .xls，不支持 .xlsx

### 3. .xlsx 文件损坏时 → 手动解析

当 openpyxl 报样式表错误时，用纯Python解析（无需依赖）：

```python
import zipfile
import xml.etree.ElementTree as ET

def read_xlsx_raw(path):
    with zipfile.ZipFile(path, 'r') as z:
        # 读取 sharedStrings.xml（字符串表）
        strings = []
        try:
            with z.open('xl/sharedStrings.xml') as f:
                tree = ET.parse(f)
                root = tree.getroot()
                ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
                for si in root.findall('.//main:si', ns):
                    t = si.find('.//main:t', ns)
                    strings.append(t.text if t is not None else '')
        except:
            pass
        
        # 读取 sheet1.xml
        rows = []
        try:
            with z.open('xl/worksheets/sheet1.xml') as f:
                tree = ET.parse(f)
                root = tree.getroot()
                ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
                for row in root.findall('.//main:row', ns):
                    cells = []
                    for cell in row.findall('main:c', ns):
                        val = cell.find('main:v', ns)
                        cell_type = cell.get('t')  # 's' 表示共享字符串
                        if val is not None:
                            v = val.text
                            if cell_type == 's' and strings:
                                idx = int(v)
                                v = strings[idx] if idx < len(strings) else v
                            cells.append(v)
                        else:
                            cells.append('')
                    if cells:
                        rows.append(cells)
        except Exception as e:
            print(f'Error: {e}')
        return rows
```

### 4. 带BOM的CSV/xls文件

有些文件开头有 UTF-8 BOM (`\xef\xbb\xbf`)，需要处理：

```python
# xlrd 读取时报错 "Expected BOF record"
# 检查文件是否带BOM
with open(path, 'rb') as f:
    header = f.read(10)
    if header[:3] == b'\xef\xbb\xbf':
        # 文件带BOM，需要用文本模式读取
        with open(path, 'r', encoding='utf-8-sig') as f:
            content = f.read()
```

## 读取流程建议

1. **先尝试 xlrd** 读取 .xls 文件
2. **再尝试 openpyxl** 读取 .xlsx（用 `read_only=True` 减少内存）
3. **如果失败**，用手动解析法（方案3）
4. **始终检查编码**：可能有 UTF-8 BOM

## 实际案例

本次（2026-05-26）读取5平台数据：
- 公众号.xls → xlrd 成功
- 头条号.xlsx → openpyxl失败 → 手动解析成功
- 小红书.xlsx → openpyxl失败 → 手动解析成功
- 知乎.xls → 带BOM，用 `encoding='utf-8-sig'` 解决