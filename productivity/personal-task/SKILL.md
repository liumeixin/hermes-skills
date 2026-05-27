---
name: personal-task
slug: personal-task
description: |
  个人任务管理，支持添加、查看、进展、完成任务。自动识别任务人。
  触发词：「加任务」「新任务」「查任务」「任务进展」「任务完成」「删除任务」「任务列表」。
  当用户提到要做什么事、添加待办、查看进度、标记完成时使用。
metadata: {"emoji": "✅", "keywords": ["任务", "待办", "进展", "完成", "个人任务"]}
---

# Personal Task - 个人任务管理

## 参考资源

本技能配套以下参考文件（位于 `references/` 目录）：

| 文件 | 用途 |
|------|------|
| `references/task-template.json` | 任务记录模板 |
| `references/checklist.md` | 操作检查清单 |

操作前建议参考 `references/checklist.md` 确认字段完整性。

---

## 数据存储

- **位置**: `/opt/data/hermes/personal-task/tasks.json`
- **格式**: JSON 文件，存储任务列表

## 数据结构

```json
{
  "tasks": [
    {
      "id": "202605150900",
      "assignee": "设计虱",
      "openid": "ou_9eb31071c1a39252e0fc315fabf9d65c",
      "item": "整理书房",
      "start_time": "2026-05-15",
      "status": "进行中",
      "progress": [
        {"date": "2026-05-15", "content": "买了收纳盒，先把书分类"}
      ],
      "completed": null
    }
  ]
}
```

**字段说明**:
- `id`: 唯一标识，时间戳前12位 `datetime.now().strftime("%Y%m%d%H%M")`
- `assignee`: 任务人姓名，从 user-mapping.json 自动读取
- `openid`: 任务人飞书 Open ID，自动记录
- `item`: 任务事项（简短描述）
- `start_time`: 开始时间，默认当天，格式 YYYY-MM-DD
- `status`: 状态（进行中 / 已完成）
- `progress`: 进展记录列表，每条含 date 和 content
- `completed`: 完成时间（ISO格式，带时间），未完成则 null

## 用户映射

从 `/opt/data/hermes/family-ledger/user-mapping.json` 读取：

```json
{
  "ou_9eb31071c1a39252e0fc315fabf9d65c": "设计虱",
  "ou_f91f30b516d26fcf4b6f3030613e10f4": "大脸鱼"
}
```

**规则**：从当前会话的 openid 自动匹配任务人姓名，无需用户手动填写。

## 日期解析规则

支持自然语言日期：
- `今天` / `明天` / `后天` → 按字面意思计算
- `X月X日` → 转换为 YYYY-MM-DD
- `X天后` → 今日 + X 天
- 用户未说明日期 → 默认今天

## 操作规范

### 读取
```python
import json
from pathlib import Path

TASK_FILE = Path("/opt/data/hermes/personal-task/tasks.json")

def load_tasks():
    if not TASK_FILE.exists():
        return {"tasks": []}
    with open(TASK_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)
```

### 保存
```python
def save_tasks(data):
    TASK_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(TASK_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
```

### 添加任务
1. 从 user-mapping.json 根据 openid 获取 assignee 姓名。**如果 openid 不在映射中，列出当前支持的用户让用户选择，不要创建任务**
2. 生成 ID：`datetime.now().strftime("%Y%m%d%H%M")`，若同 ID 已存在则追加随机后缀（如 `202605150900_a`）
3. 解析 start_time（未说明则默认今天）
4. status 默认"进行中"
5. progress 初始为空列表
6. 写入 tasks 数组

### 添加进展
1. 查找对应任务（按 id 或内容模糊匹配）
2. **如果找不到匹配任务，列出当前进行中任务让用户选择**
3. 进展中的相对时间词转为"x月x日"格式
4. 未包含日期则自动加当天日期
5. 追加到 progress 列表

### 完成任务
1. 查找对应任务（按 id 或内容模糊匹配）
2. **必须先确认**：「确认要把「XXX」标记为完成吗？」
3. 确认后 status 设为"已完成"
4. completed 设为当前时间（ISO格式）

### 查看任务
- 默认查看当前用户的任务
- 可按 status 筛选（进行中/已完成）
- 可按 assignee 筛选（需用户明确指定）

### 删除任务
1. 查找对应任务
2. 确认后从 tasks 数组移除

## 汇报格式

### 分类顺序

1. **【进行中】** status 为"进行中"的任务
   - 格式：`📌 任务事项 | 开始X月X日`
   - 最新进展：`> X月X日 进展内容`

2. **【已完成】** status 为"已完成"的任务（最近7天）
   - 格式：`✅ 任务事项 | 完成X月X日`

### 格式模板

今日 2026-05-15

---

【进行中】

📌 整理书房 | 开始5月15日
> 5月15日 买了收纳盒，先把书分类

---

📌 学习 Python | 开始5月10日
> 5月14日 完成了基础语法章节

---

【已完成】

✅ 家庭聚餐 | 完成5月12日

---

共 2 项进行中任务

## 注意事项

- **禁止硬编码 assignee 名字**，必须从 user-mapping.json 查当前会话 openid
- ID 使用时间戳前12位
- 日期格式：YYYY-MM-DD
- 进展中的相对时间词必须转为绝对日期
- 个人任务不设截止时间和考核
- 删除操作需确认
