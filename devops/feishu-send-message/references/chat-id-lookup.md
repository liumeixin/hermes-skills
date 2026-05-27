# 飞书群组 chat_id 查询表

## 已知群组

| 群组 | chat_id | 用途 |
|------|---------|------|
| 家庭账本 | `oc_2abe398e83a9758c72451ed260170088` | 家庭账本月度汇总 |

## 如何获取 chat_id

### 方法 1：飞书后台
1. 打开飞书群组设置
2. 点击「群管理」→「群信息」
3. 复制「群组 ID」

### 方法 2：API 获取
```python
# 获取机器人所在的群组列表
url = "https://open.feishu.cn/open-apis/im/v1/chats"
req = Request(url, headers={"Authorization": f"Bearer {tenant_token}"})
resp = urlopen(req)
result = json.loads(resp.read().decode())
for chat in result["data"]["items"]:
    print(f"{chat['name']}: {chat['chat_id']}")
```

## chat_id 格式

- 以 `oc_` 开头
- 后跟 32 位字符（字母+数字）
- 示例：`oc_2abe398e83a9758c72451ed260170088`

## 注意事项

- chat_id 是群组唯一标识，不同群组不同
- 机器人必须在群组中才能发送消息
- chat_id 不会变化，除非群组被删除
