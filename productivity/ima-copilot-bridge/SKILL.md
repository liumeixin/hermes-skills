---
name: ima-copilot-bridge
description: |
  IMA copilot 预处理桥接技能 — 配合官方 ima-skill 使用。
  当需要从 IMA 获取知识库内容、搜索 IMA 知识、讨论 IMA 协作流程时加载。
  核心原则：Hermes 不直接爬 IMA 知识库页面，只读取 copilot 整理后的笔记。
trigger: IMA知识 / IMA笔记搜索 / IMA协作 / 从IMA获取内容 / IMA知识库内容
---

# IMA copilot 桥接技能

配合官方 `ima-skill` 使用，定义 Hermes 与 IMA 知识库的交互方式。

## 核心原则

**Hermes 不直接爬取 IMA 知识库页面链接。** IMA 知识库中的网页内容（微信公众号文章等）有反爬机制，直接用 web_extract/web_search 去抓大概率失败。

**正确做法：只通过 notes API 读取 copilot 整理后的笔记。** copilot 是 IMA 内置智能助手，可以直接读取知识库原始内容并整理为结构化笔记，不受反爬限制。

## copilot 整理工作流（用户手动触发）

用户通知 IMA copilot 执行整理时，copilot 会：

1. **浏览所有知识库**，把知识完整沉淀为笔记（完整知识，非摘要）
2. **同话题合并**：相同或类似话题合并为一条笔记，不建立重复
3. **清理标记**：不需要的笔记标题前加"删除"前缀
4. **用户手动删除**带"删除"前缀的笔记

copilot 有固化为 skill 的工作流，但不支持定时任务，需用户手动触发。

## Hermes 对接方式

### 搜索 IMA 知识内容

```
用户提问 → ① 本地知识库 → ② IMA 笔记（search_note） → ③ 互联网
```

**第二层只用 `search_note`，不用 `search_knowledge`。**

```bash
# 正确：搜索 copilot 整理后的笔记
node ima_api.cjs "openapi/note/v1/search_note" '{"query":"Docker网络","limit":10}'

# 不要直接搜索知识库页面（反爬会失败）
# ❌ node ima_api.cjs "openapi/wiki/v1/search_knowledge_base" ...
```

### 读取笔记内容

```bash
# 获取笔记完整内容
node ima_api.cjs "openapi/note/v1/get_doc_content" '{"note_id":"xxx","target_content_format":0}'
```

### 每周扫描（cron 任务）

每周三 6:00 自动运行 `ima_weekly_scan.py`，只扫描笔记（不扫知识库页面）：
- 发现 copilot 本周新增整理的笔记
- 识别带"删除"前缀的待清理笔记
- 推荐值得入库到本地知识库的内容

### 入库筛选规则

| 类别 | 处理方式 | 说明 |
|------|---------|------|
| 建筑专业（住宅/抬板/景观/户型） | ✅ 入库 | 设计虱主业相关，优先级最高 |
| NAS/数码/生活工具 | ✅ 入库 | 与NAS使用相关 |
| AI/设计工具 | ✅ 入库 | 自媒体工作相关 |
| 游戏类（最强蜗牛等） | ⏭️ 跳过 | IMA已有专门管理 |
| 公司内部（社保/制度等） | ⏭️ 跳过 | 非知识沉淀 |
| 内容太短（<500字） | ⏭️ 跳过 | 信息量不足 |
| 同话题已入库的单篇 | ⏭️ 跳过 | 只取合并版，跳过重复单篇 |

**合并版优先原则**：copilot 会将同话题多篇原文合并为一条笔记。入库时优先取合并版，跳过未合并的单篇原始版。

### 入库操作

1. 创建 wiki 页面到 `/opt/data/workspace/设计虱-知识库/wiki/` 下
2. 建筑专业 → `概念/` 目录，AI工具 → `来源/` 目录，NAS → `概念/` 目录
3. 更新 `wiki/index.md` 索引
4. 运行 `python3 /opt/data/scripts/wiki_embed.py` 更新向量索引

## 什么时候建议用户让 copilot 补充整理

当 `search_note` 搜不到某个话题的内容，但用户确信 IMA 知识库里有相关收藏时：
- 提示用户："IMA 笔记中没有找到这个话题，可能 copilot 还没整理。要不要让 copilot 补充整理一下？"
- 不要尝试直接爬取知识库页面来弥补

## 与 ima-skill 的关系

- `ima-skill`：官方技能，提供 IMA OpenAPI 的完整调用能力（notes + knowledge-base）
- `ima-copilot-bridge`：本技能，定义 Hermes 应该怎么用 ima-skill（只走笔记通道，不走知识库通道）
- 两个技能配合使用：本技能提供策略，ima-skill 提供 API 能力

## 变更记录

- v1.0：初版，配合 IMA copilot v2.0 协作架构
