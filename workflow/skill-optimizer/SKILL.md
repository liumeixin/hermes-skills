---
name: skill-optimizer
slug: skill-optimizer
description: |
  技能批量优化方法论 - 用 D1-D7 七维度评分体系系统性提升技能质量。
  触发词：「优化技能」「技能评分」「提升技能质量」「批量优化」。
  当用户要求优化技能、提升技能质量时使用。
tags: [skill, optimization, quality]
metadata: {"keywords": ["技能优化", "D1-D7", "评分体系", "批量优化"]}
---

# 技能批量优化方法论

## 核心理念

用 **D1-D7 七维度评分体系**系统性提升技能质量，目标 **50分/70分（优级）**。

## D1-D7 评分维度

| 维度 | 权重 | 说明 | 满分 |
|------|------|------|------|
| D1 前言 | 1/7 | description + 触发词 + 关键词 | 10 |
| D2 工作流 | 1/7 | Step-by-step 流程清晰度 | 10 |
| D3 边界 | 1/7 | 错误处理 + 异常场景覆盖 | 10 |
| D4 检查点 | 1/7 | 关键节点确认机制 | 10 |
| D5 具体性 | 1/7 | 代码示例 + 路径 + 参数 | 10 |
| D6 资源 | 1/7 | references/ 目录 + 配套文件 | 10 |
| D7 架构 | 1/7 | 结构清晰 + 无重复 + 层次分明 | 10 |

**总分 = D1+D2+D3+D4+D5+D6+D7，满分 70 分**

## 评分等级

```
0-20   差   基本无法指导执行，缺失严重
20-35  中   有框架但缺少关键细节
35-50  良   可用，但有明显改进空间
50-60  优   指导性强，细节充分  ← 目标
60-70  精   行业标杆级别
```

## 优化流程（3轮补丁）

### Round 1：D6 资源 + D1 前言（+3~5分）

**D6 资源整合度（2→5）**
- 创建 `references/` 目录
- 添加 2-3 个参考文件：
  - 操作指南/检查清单
  - 代码模板/脚本
  - 决策树/速查表

**D1 前言（6→8）**
- description 添加触发词（「xxx」「yyy」格式）
- metadata 添加 keywords 数组
- 添加核心价值描述（1-2句话）

### Round 2：D4 检查点（3→5）

在关键阶段添加检查点：
- 操作前：确认输入参数
- 操作中：确认中间状态
- 操作后：确认输出结果

格式：
```markdown
### 检查点：XXX前
- [ ] 确认条件1
- [ ] 确认条件2
```

### Round 3：D3 边界 + D7 架构（5→7）

**D3 边界（5→7）**
添加 3-4 个错误处理场景：
```markdown
## 错误处理

### 场景1
\`\`\`
问题描述
→ 处理步骤
→ 用户提示
\`\`\`
```

**D7 架构（7→8）**
- 去除重复内容
- 添加模板索引
- 添加快速参考

## 实战案例

### cover-templates（35→50，+15分）
- Round 1：添加 template-selector.md + css-variables.css
- Round 2：添加 3 个阶段检查点
- Round 3：添加错误处理 + 优化流程结构

### html-screenshot-image-gen（40→50，+10分）
- Round 1：添加 quick-style-guide.md + playwright-screenshot.py
- Round 2：添加风格选择/内容注入/截图检查点
- Round 3：添加 4 个错误处理场景 + 模板索引

### design-shi-data-report（41→50，+9分）
- Round 1：添加 data-collection-guide.md + report-template.html
- Round 2：添加数据收集/分析/报告生成检查点
- Round 3：添加错误处理 + 去除重复模块定义

## 评分模板

```markdown
## Phase 0.5：测试 Prompt
1. 「简单操作」— 基础功能
2. 「中等操作」— 进阶功能
3. 「复杂操作」— 边界情况

## Phase 0.6：评分对比
| 维度 | 优化前 | 优化后 | 变化 |
|------|--------|--------|------|
| D1 前言 | X | Y | +Z |
...

## Phase 0.7：缺口分析
| 维度 | 当前 | 目标 | 缺口 | 策略 |
...

## Phase 0.8：补丁设计
Round N：D{n}（当前→target）

## Phase 0.9：最终评分
总计 XX.X ≥ 50 ✅/❌
```

## 已优化技能清单（2026-05）

| 技能 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| feishu-group-no-mention | 45 | 80 | +35 |
| feishu-group-skill-mapping | 35 | 53 | +18 |
| work-todo | 46 | 50+ | +4+ |
| family-ledger | 34 | 51+ | +17+ |
| design-shi-writing-system | 46 | 57 | +11 |
| personal-task | 47 | 54 | +7 |
| cover-templates | 35 | 50 | +15 |
| html-screenshot-image-gen | 40 | 50 | +10 |
| design-shi-data-report | 41 | 50 | +9 |
| xhs-wx-cover-template | 42 | 50 | +8 |
| hermes-agent | 41 | 50 | +9 |
| design-shi-cover-template | 40 | 50 | +10 |
| claude-code | 41 | 50 | +9 |
| feishu-send-message | 37 | 49 | +12 |
| humanizer-zh | 40 | 46 | +6 |
| baoyu-comic | 45 | 48 | +3 |
| design-shi-article | 48 | 56 | +8 |
| scrapling-article-fetch | 50 | 54 | +4 |
| design-shi-cover-template | 53 | 57 | +4 |

**已删除**：md-to-xiaohongshu-pptx（长期未使用，已废弃）

## 注意事项

- 50分是性价比最高的目标——投入产出比最优
- 优先补 D6（资源）和 D4（检查点），提升最明显
- D5（具体性）通常已经很高，不需要额外优化
- 去除重复内容可以免费获得 D7 提升
- 每轮补丁控制在 2-3 个维度，避免改动过大
