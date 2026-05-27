---
name: feishu-group-skill-mapping
description: 飞书群ID到默认技能的映射，根据群ID自动加载对应技能
---
# 飞书群-技能映射

## 群映射
| 群 ID | 群名称 | 默认 Skill |
|-------|--------|------------|
| oc_42e9d293025cb75aa45c1d092d862be7 | 工作群 | work-todo |
| oc_f8ee1d528e99690c70e494c1fefe7956 | 游戏群 | game-assistant |
| oc_23748055e6cd9d5150b289fe2bde7bf1 | 自媒体群 | design-shi-article |
| oc_2abe398e83a9758c72451ed260170088 | 记账群 | family-ledger |
| oc_8347b8254e75fc9478514ca4c8792291 | 知识库群 | design-shi-wiki |
| oc_acee98982b2678ce4aaa8c99ff7ff4f6 | 编程群 | (待定) |
| oc_d30f6454cc4d56b3d305282abf390d96 | 个人待办群 | personal-task |

## 使用场景
当用户在某个群发消息时，根据群 ID 自动加载对应技能。

## 群特定规则
- 知识库群（oc_8347b8254e75fc9478514ca4c8792291）对话默认记入知识库，无需用户明确说"记一下"
- 工作群（oc_42e9d293025cb75aa45c1d092d862be7）工作任务和进展默认用 work-todo 记录
