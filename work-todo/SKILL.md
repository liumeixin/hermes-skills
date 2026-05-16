---
name: Work Todo
slug: work-todo
version: 1.2.0
description: "管理工作待办事项，支持添加、查看、完成、删除待办。任务按用户隔离，每人只能看自己的任务。"
metadata: {"emoji": "📋"}
---

# Work Todo - 工作待办管理

## 用户识别与隔离

### 用户映射
- 映射文件：`/opt/data/hermes/family-ledger/user-mapping.json`
- 格式：`{"ou_xxx": "显示名", ...}`
- 从当前会话的 openid 查找对应显示名

### 未知 openid 处理流程
当 openid 不在 user-mapping.json 中时：
1. **先确认是否 openid 变化**：询问"你之前用过这个账号吗？还是第一次使用？"
2. **排除旧用户换号的情况**：如果用户说"我是 XXX"，检查 user-mapping.json 中是否有同名用户，如有则说明可能是 openid 变了，直接更新映射
3. **确认是新用户后**：询问"你希望怎么称呼？"，得到名字后经用户同意写入 user-mapping.json

### 任务隔离规则（严格）
- **每个人只能查看和操作自己创建的任务**
- 查看任务列表时，自动过滤只显示当前用户的任务
- 禁止查看、修改、删除其他用户的任务
- 汇报时也只汇报当前用户的任务

### 新旧数据兼容
- 已有任务没有 `created_by` 字段的，视为创建它的 openid 对应用户所有
- 新建任务必须写入 `created_by` 字段（存显示名，与 `recorded_by` 保持一致）

## 数据存储

- **位置**: `/opt/data/hermes/work-todo/todos.json`
- **格式**: JSON 文件，存储待办列表

## 数据结构

```json
{
  "todos": [
    {
      "id": "20260323103045",
      "content": "设计稿提交",
      "task_name": "设计稿提交",
      "task_description": "提交三亚一期项目的设计稿终稿",
      "start_date": "2026-03-23",
      "due_date": "2026-03-31",
      "project": "三亚一期",
      "project_alias": "",
      "project_location": "三亚",
      "status": "进行中",
      "progress": [],
      "created": "2026-03-23T10:30:00+08:00",
      "created_by": "设计虱",
      "completed": null,
      "completion_date": null,
      "assessment": null
    }
  ]
}
```

**字段说明**:
- `id`: 唯一标识，14位时间戳 `datetime.now().strftime("%Y%m%d%H%M%S")`
- `content`: 待办内容（简短描述）
- `task_name`: 任务名称（概括这个任务）
- `task_description`: 任务说明（详细描述）
- `start_date`: 开始日期（用户未说明时=创建时间）
- `due_date`: 截止日期（用户未说明时="长期任务"）
- `project`: 项目名称
- `project_alias`: 项目别名
- `project_location`: 项目地点
- `status`: 状态（进行中 / 暂缓 / 已完成）
- `progress`: 进展记录，支持两种格式：
  - 字符串格式（推荐）：如 `"4月1日已联系张丽问设计单位"`
  - 数组格式：`[{"date": "20260418000000", "content": "与宋兴源沟通从内地进货问题"}]`
  - **重要**：汇报展示时需兼容两种格式
- `created`: 创建时间
- `created_by`: 创建人显示名（从 user-mapping.json 查 openid 得到）
- `completed`: 完成时间（ISO格式，带时间）
- `completion_date`: 完成日期（仅日期，格式 YYYY-MM-DD）
- `assessment`: 考核结果
  - `按时完成`: 截止日期之前或当天完成
  - `延误X天`: 截止日期之后完成（X为延误天数）

## 项目列表

| 项目名称 | 项目别名 | 项目地点 |
|---------|---------|---------|
| 三亚一期 | - | 三亚 |
| 三亚二期 | - | 三亚 |
| 三亚三期 | - | 三亚 |
| 洛阳项目 | 国润汽车产业园 | 洛阳 |
| 东润城樟园 | 东润城10号地、樟园 | 东润城 |
| 东润城润园 | 东润城8号地、润园 | 东润城 |
| 东润城璞园 | 东润城6号地、璞园 | 东润城 |
| 乐东1号地 | 麓鸣海、依山揽海雅居 | 乐东 |
| 乐东3号地 | - | 乐东 |
| 乐东4号地 | - | 乐东 |
| 新密云境花园 | 云境花园、云麓之城云境花园 | 新密 |
| 云麓之城北园 | 北园 | 新密 |
| 云麓之城南园 | 南园 | 新密 |

> 项目名称必须从列表中选择，别名会自动转换为正式名称。

## 日期解析规则

支持自然语言日期，规则如下：
- `今天` / `明天` / `后天` → 按字面意思计算
- `X月X日` → 转换为 YYYY-MM-DD（若日期已过，自动顺延下一年）
- `X天后` → 今日 + X 天
- 用户未说明日期 → 截止日期默认"长期任务"，开始日期默认当天

## 操作规范

### 读取
```python
import json
from pathlib import Path

TODO_FILE = Path("/opt/data/hermes/work-todo/todos.json")
USER_MAPPING_FILE = Path("/opt/data/hermes/family-ledger/user-mapping.json")

def load_todos():
    if not TODO_FILE.exists():
        return {"todos": []}
    with open(TODO_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_user_display_name(openid):
    """从 user-mapping.json 查显示名"""
    if not USER_MAPPING_FILE.exists():
        return None
    with open(USER_MAPPING_FILE, 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    return mapping.get(openid)

def filter_user_todos(todos, display_name):
    """只返回当前用户的任务"""
    return [t for t in todos if t.get("created_by") == display_name]
```

### 保存
```
def save_todos(data):
    TODO_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(TODO_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
```

### 添加待办
1. 生成 ID：`datetime.now().strftime("%Y%m%d%H%M%S")`（14位，含秒，防同一分钟内重复）
2. 匹配项目：根据项目名称或别名查找正式名称和地点
3. 解析日期：`due_date` 解析用户说的截止日期；`start_date` 未说明则默认今天
4. 写入 `created_by`：从 user-mapping.json 用当前 openid 查显示名
5. 写入 todos 数组

### 完成待办
1. 查找对应待办（按项目名+内容匹配）
2. `status` 设为 `已完成`
3. `completion_date` 未说明则默认当天
4. 自动计算 `assessment`：
   - `completion_date` ≤ `due_date` → `按时完成`
   - `completion_date` > `due_date` → `延误X天`（X为超出天数）
   - `due_date`="长期任务" → `assessment` 留空

### 添加进展
1. 查找对应待办
2. **重要**：进展内容中的相对时间词（昨天、今天、明天、后天、星期X等）必须转为"x月x日"格式，不再原样保留相对时间表达
3. 如果进展内容中没有包含日期，自动在进展内容前加上"X月X日"（当天日期）
4. 写入 `progress` 字段（推荐使用字符串格式，简单一致）

### 获取进展文本（汇报用）
```
def get_progress_text(t):
    """获取进展文本，处理不同格式（字符串或列表）"""
    progress = t.get("progress", "")
    if not progress:
        return None
    if isinstance(progress, str):
        return progress if progress else None
    if isinstance(progress, list) and len(progress) > 0:
        return progress[-1].get("content", None)
    return None
```

### 删除待办
1. 查找对应待办
2. 从 todos 数组中移除

## 汇报格式规范

### 分类顺序与格式

1. **【已延误】** 截止日期早于今天且状态为"进行中"的待办
   - 格式：`★ 任务名 | 项目 | 延误X天`
   - 进展内容：单独一行，用 > 前缀，后面空一行

2. **【今日截止·已完成】** 今日到期且已完成
   - 格式：`✓ 任务名 | 项目`
   - 后面空一行

3. **【今日截止·进行中】** 今日到期但进行中
   - 格式：`★ 任务名 | 项目`
   - 进展内容直接跟下一行，再空一行

4. **【近期截止（X月X日-X月X日）】** 截止日期在今天起7天内
   - 格式：`★ 任务名 | 项目 | 截止X月X日`
   - 进展内容直接跟下一行，再空一行

5. **【远期截止（X月X日及以后）】** 截止日期超过7天
   - 格式：`★ 任务名 | 项目 | 截止X月X日`
   - 进展内容直接跟下一行，再空一行

### 展示规则
- 只显示每条任务的最 新一条进展
- 分类之间用 `---` 分隔
- 每条任务及其进展后面空一行（飞书显示需要）
- 底部显示 `共 X 项进行中任务`
- 截止日期显示"x月x日截止"，不显示项目地点

### 格式模板
### 格式模板

今日 2026-04-28

---

【已延误】

★ 南园北大门灯具修改 | 云麓之城南园 | 延误25天
> 3月24日工程安排岳玉领先与电工沟通可行性，设计再出变更

---

★ 樟园人防设计结算 | 东润城樟园 | 延误4天
> 昨天已发起结算审批

---

【今日截止·进行中】

★ 三亚二期酒店地块强排 | 三亚二期
> 上周六已完成

---

【近期截止（4月29日-5月5日）】

★ 三亚二期新建地块产品修改 | 三亚二期 | 截止4月29日

★ 南园7#楼吊顶变更审批 | 云麓之城南园 | 截止4月30日

---

共 11 项进行中任务

**格式规则**：
- 分类大标题【】：不加序号，不加★符号
- 任务前加★，标题不加粗
- 进展内容：单独一行，用 > 前缀，后面空一行
- 分类之间用 `---` 分隔
- 已完成用 `✓`，进行中用 `★`
- 已完成用 `✓`，进行中用 `★`

## 注意事项

- ID 使用14位时间戳 `strftime("%Y%m%d%H%M%S")`，含秒防重复
- 日期格式：YYYY-MM-DD（具体日期）或"长期任务"
- 项目名称必须从列表中选择，别名自动转换
- 任务名称默认等于内容，任务说明为可选项
- **任务按用户隔离**：每个人只能看自己的任务，创建时必须写入 `created_by`