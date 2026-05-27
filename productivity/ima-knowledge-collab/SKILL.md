---
name: ima-knowledge-collab
description: |
  IMA 与本地知识库协作方案 — IMA copilot 预整理知识为笔记，Hermes 对接笔记做深度检索。
  当用户提到 IMA 知识库、IMA 笔记、从 IMA 搜索、IMA 同步、知识库协作时触发此 skill。
trigger: IMA知识库 / IMA笔记 / 知识库协作 / 从IMA搜索
---

# IMA 与本地知识库协作方案

## 核心架构：三层分工

```
IMA copilot（预处理器）  →  IMA 笔记（结构化知识）  →  Hermes（检索+应用）  →  本地知识库（深度引擎）
```

**一句话**：IMA copilot 管"整理"，IMA 笔记管"存"，Hermes 管"用"，本地知识库管"沉淀"。

### 第一层：IMA copilot 预整理知识库

IMA 内置智能助手 copilot 负责将知识库内容整理为结构化笔记：
- **浏览所有知识库**，把知识完整沉淀为笔记（是完整知识，不是摘要）
- **同话题合并**：相同或类似话题的笔记合并为一条，不建立多条重复笔记
- **清理标记**：不需要的笔记名称前加"删除"前缀，由用户手动筛选删除
- copilot 有固化为 skill 的工作流，用户通知他时手动执行（不支持定时任务）

**Hermes 不直接爬 IMA 知识库页面**，这是 copilot 的工作。

### 第二层：IMA 笔记作为对接接口

copilot 整理后的笔记是 Hermes 与 IMA 的唯一对接接口：
- 笔记内容完整（非摘要），包含知识库原文的全部信息
- 笔记结构化，便于搜索和读取
- **Hermes 只需调 notes API 读取笔记**，不需要反爬知识库内的网页链接

### 第三层：本地知识库做深度引擎

- 写文章、做分析时，**优先搜本地知识库**
- 本地知识库是精心维护的，质量高于 IMA 原始素材
- 路径：/opt/data/workspace/设计虱-知识库/
- 向量检索：FTS5 + wiki_embeddings（68页，herald/dmeta 768维）

### 第四层：Hermes 按需跨库检索

- 本地知识库搜不到 → 去 IMA 笔记搜索
- 用 ima-skill 的 `search_note` 接口实时查
- **不需要提前同步**，用到的时候再去拿

## 搜索优先级

```
用户提问 → ① 本地知识库（FTS5 + 向量）→ 命中则用
                        ↓ 未命中
              ② IMA 笔记（search_note）→ 命中则用
                        ↓ 未命中
              ③ 互联网搜索
```

**注意**：不再直接搜索 IMA 知识库（search_knowledge），因为知识已被 copilot 整理进笔记。如果 search_note 搜不到，可能说明 copilot 还未整理该话题，可以建议用户让 copilot 补充整理。

## IMA 凭证位置
- Client ID: ~/.config/ima/client_id
- API Key: ~/.config/ima/api_key
- 也可通过环境变量：IMA_OPENAPI_CLIENTID / IMA_OPENAPI_APIKEY

## IMA API 调用方式
```bash
SKILL_DIR="/opt/data/skills/ima-skill"
node "$SKILL_DIR/ima_api.cjs" "<apiPath>" '<body>' '<options>'
```

## copilot 整理工作流（用户触发，非自动）

用户通知 IMA copilot 执行整理工作流时，copilot 的操作：
1. 浏览所有知识库
2. 把知识完整沉淀为笔记（非摘要，保留完整内容）
3. 相同/类似话题合并，避免重复
4. 不需要的笔记标题前加"删除"前缀
5. 用户手动删除带"删除"前缀的笔记

**Hermes 侧无需操作**，等 copilot 整理完后直接读取笔记即可。

## 冲突处理规则
- 建筑规范类（规范解读、抬板建筑）内容有时效性，IMA 中如有冲突，以最新发表的为准
- 建筑专业内容（产品设计、规范解读、抬板建筑）全部入库
- 游戏类（最强蜗牛等）：IMA 已有专门知识库管理，本地不重复入库
- 图片/文件夹/PDF/PPT：跳过
- 工具推荐类：和我们工作直接相关的入库，关联不大的跳过

## 注意事项
- IMA 不需要和本地保持实时同步，按需查询即可
- 本地知识库是"精编版"，IMA 笔记是"结构化中间层"
- 如果发现 copilot 漏整理了某个话题，提醒用户让 copilot 补充
- 周报/数据分析类内容只存本地，不存 IMA
- **每周扫描仍在运行**：`ima_weekly_scan.py` 每周三 6:00 扫描 copilot 整理后的笔记（不扫知识库页面），推荐值得入库的内容
- **已废弃的旧流程**：Hermes 不再直接爬 IMA 知识库页面链接（search_knowledge），不再全量对比知识库条目发现新增

## 变更记录
- v1.0：初版，Hermes 自己扫描 IMA 知识库+笔记
- v2.0：架构重构——IMA copilot 预整理知识为笔记，Hermes 只对接笔记接口。废弃直接爬取知识库网页链接，保留每周笔记扫描
