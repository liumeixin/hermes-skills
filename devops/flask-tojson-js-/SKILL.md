---
name: flask-tojson-js-fix
description: Flask render_template_string + tojson 过滤器导致 JS 函数 undefined 的解决方案
tags: [flask, jinja2, tojson]
---

# Flask render_template_string + tojson 过滤器导致 JS 函数 undefined

## 问题现象
Flask 使用 `render_template_string` + Jinja2 `tojson` 过滤器传递动态 JS 变量（`{{ templates | tojson }}`）时，浏览器控制台报 `convert is not defined`，但 HTML 中确实有 `function convert()` 定义。

## 根本原因
当 HTML_HTML 是 Python 多行字符串内嵌在代码文件中时，`tojson` 过滤器的渲染可能破坏 JS 代码结构。

## 解决方案
改用外部模板文件 + `render_template`：

```python
# 旧（有问题）
HTML_TEMPLATE = '''...<script>{{ templates | tojson }}</script>...'''
return render_template_string(HTML_HTML, templates=get_())

# 新（正确）
app = Flask(__name__, template_='templates_/')  # 注意是templates_/
return render_template('index.html', templates=get_())
```

同时建议：
- 用 `addEventListener` 替代 `onclick` 属性绑定事件
- 用 `XMLHttpRequest` 替代 `fetch` API（兼容性更好）