---
name: awesome-design-md-workflow
description: Awesome DESIGN.md 项目工作流 — 入库知识库 + 提取设计规范到模板库 + 使用预生成预览图
tags: [design-system, awesome-design-md, workflow, knowledge-base]
created: 2026-05-25
trigger: 入库 awesome-design-md / 使用 design md 模板 / 设计规范参考
---

# Awesome DESIGN.md 工作流

## 项目信息

- **GitHub**: https://github.com/VoltAgent/awesome-design-md/
- **本地路径**: `/opt/data/hermes/cover-templates/awesome-design-md/`
- **收录数量**: 58 个网站设计规范
- **协议**: MIT

## 工作流程

### Step 1: 入库知识库

创建来源页：`wiki/来源/来源-Awesome-DESIGN-MD-开源设计规范集合.md`

```yaml
---
type: source
name: Awesome DESIGN.md：AI 时代的开源设计规范集合
tags: [AI设计工具, 开源项目, DESIGN.md, 设计规范, Google Stitch]
sources: [原文链接]
created: 2026-05-25
author: 作者名
confidence: 0.5
relates_to:
  - [relates_to, [Design MD Collection]]
---
```

### Step 2: 提取到模板参考库

创建模板参考文件：`设计虱-写作系统/_templates/设计规范参考-Awesome-DESIGN-MD.md`

包含：
- 分类速查表（AI/开发者工具/设计/金融/消费品牌/汽车）
- DESIGN.md 九大模块说明
- 提取示例（Linear 等风格的核心参数）
- 调用指南

### Step 3: 使用预生成预览图

**关键发现**：项目仓库中已经包含 58 张预生成的预览图，位于 `previews/` 目录，无需自己用 Playwright 生成。

预览图路径：`/opt/data/hermes/cover-templates/awesome-design-md/previews/`

可直接使用或打包发送给用户。

---

## 分类速查

### AI / 模型
Claude, Ollama, Mistral AI, Replicate, RunwayML, Cohere

### 开发者工具
Linear, Vercel, Supabase, Cursor, Raycast, Sentry, PostHog

### 设计 / 生产力
Figma, Notion, Framer, Miro, Airtable

### 金融 / 支付
Stripe, Coinbase, HashiCorp

### 消费品牌
Apple, Airbnb, Spotify, Tesla

### 汽车品牌
BMW, Ferrari, Lamborghini

---

## DESIGN.md 九大模块

每个 DESIGN.md 文件包含：

1. 视觉主题与氛围
2. 色彩系统
3. 排版规则
4. 组件样式
5. 布局原则
6. 深度与层次
7. 设计准则
8. 响应式行为
9. 智能体提示指南

---

## 注意事项

⚠️ **法律风险**：可借鉴设计理念和配色思路生成原创设计，但不要直接照搬某品牌的完整视觉体系用于商业产品。

✅ **正确用法**：从 DESIGN.md 提取参数（主色、强调色、字体、圆角、间距），应用到自己的设计系统中。