# Hermes Skills

Hermes Agent 的技能库，按领域分类管理。

## 目录结构

```
skills/
├── amap-lbs-skill/        # 高德地图综合服务
├── apple/                # Apple 设备相关
├── autonomous-ai-agents/ # AI Agent 编排
├── blockchain/           # 区块链查询
├── china-highway-route/  # 中国高速路线规划
├── communication/        # 决策框架
├── creative/            # 创意内容生成
├── data-science/        # 数据科学工作流
├── devops/              # 运维自动化
├── diagramming/         # 图表生成
├── dogfood/             # 探索性 QA 测试
├── domain/              # 域名工具
├── email/               # 邮件管理
├── family-ledger/       # 家庭账本
├── feeds/               # RSS/博客订阅
├── gaming/              # 游戏辅助
├── gifs/                # GIF 搜索
├── github/              # GitHub 工作流
├── health/              # 健康与健身
├── humanizer-zh/        # 中文文本润色
├── inference-sh/        # 推理脚本
├── leisure/             # 休闲娱乐
├── mcp/                 # MCP 协议
├── media/               # 媒体处理
├── migration/           # 数据迁移
├── mlops/               # 机器学习运维
├── neat-freak/          # 知识库收尾
├── note-taking/         # 笔记管理
├── productivity/        # 生产力工具
├── red-teaming/         # 红队安全
├── research/            # 学术研究
├── scrapling-article-fetch/  # 文章抓取
├── security/            # 安全工具
├── smart-home/          # 智能家居
├── social-media/        # 社交媒体
├── software-development/# 软件开发
├── web-development/     # Web 开发
└── work-todo/           # 工作待办
```

## 使用方式

每个 skill 目录下包含 `SKILL.md`，描述触发条件、使用流程和故障处理。Hermes Agent 会根据任务自动加载对应 skill。

## 贡献

新 skill 需包含：
- `SKILL.md`：标准格式的技能定义
- 明确的触发条件
- 清晰的步骤和验证方法
