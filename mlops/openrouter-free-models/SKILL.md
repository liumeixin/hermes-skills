---
name: openrouter-free-models
description: 扫描 OpenRouter 免费（zero cost）模型，按能力打分排序，并发测试可用性，自动更新配置。支持 cron 定时轮换。适用于寻找免费大模型 API
trigger: OpenRouter 免费模型 / 找免费模型 / 轮换模型 / openrouter free
---

# OpenRouter 免费模型轮换工具

**功能**：自动扫描 OpenRouter 上的免费模型，按能力打分，并发测试可用性，更新配置文件。

---

## 快速开始

```bash
# 完整流程：扫描 → 测试 → 更新配置 → 重启（推荐）
python3 scripts/rotate_free_models.py --api-key "sk-or-xxx" --restart

# 快速轮换（不做质量基准测试，只测连通性）
python3 scripts/rotate_free_models.py --api-key "sk-or-xxx" --test 30 --keep 10 --restart

# 扫描并按分数排序显示（不修改配置）
python3 scripts/rotate_free_models.py --api-key "sk-or-xxx" --scan --sort score

# 质量基准测试
python3 scripts/rotate_free_models.py --api-key "sk-or-xxx" --bench --json report.json

# 筛选：仅多模态模型
python3 scripts/rotate_free_models.py --api-key "sk-or-xxx" --filter multimodal --restart

# 使用缓存结果（1小时内，跳过重复测试）
python3 scripts/rotate_free_models.py --api-key "sk-or-xxx" --use-cache --keep 10

# 保存 JSON 报告
python3 scripts/rotate_free_models.py --api-key "sk-or-xxx" --json /tmp/report.json
```

---

## 参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--api-key` | `$OPENROUTER_API_KEY` | OpenRouter API Key |
| `--test N` | 0（全部） | 最大测试模型数 |
| `--keep N` | 10 | 保留到配置的工作模型数 |
| `--workers N` | 5 | 并发测试线程数 |
| `--timeout N` | 15 | 单模型超时（秒） |
| `--bench` | off | 启用质量基准测试 |
| `--filter TYPE` | all | 筛选类型：all/text/multimodal/image/reasoning/fast/large |
| `--sort BY` | score | 排序方式：score/latency/name |
| `--use-cache` | off | 使用1小时缓存结果 |
| `--json FILE` | none | 保存 JSON 报告 |
| `--restart` | off | 更新后重启 gateway |
| `--no-update` | off | 不修改配置文件 |
| `--scan` | off | 仅扫描，不测试 |
| `--exclude-providers` | none | 排除指定提供商的模型扫描（逗号分隔），如 `openai,anthropic,google` |

---

## 打分算法

模型按加权综合分数排序：

| 因素 | 权重 | 效果 |
|------|------|------|
| Context window | +2/100K tokens | 上下文越大分数越高 |
| Max output tokens | +0.5/1K | 输出越长分数越高 |
| Image input | +5 | 多模态加分 |
| Audio input | +5 | 多模态加分 |
| Video input | +3 | 高级能力加分 |
| Reasoning support | +8 | 思维链加分 |
| Latency | -0.3/100ms | 延迟越低分数越高 |
| Brand quality | +2~5 | Qwen-Coder, Llama-70B, GPT, Gemini 等品牌加分 |

---

## 定时任务

每 6 小时自动轮换：

```
0 */6 * * * python3 /opt/hermes/skills/mlops/openrouter-free-models/scripts/rotate_free_models.py --api-key "sk-or-xxx" --restart >> /var/log/model-rotate.log 2>&1
```

---

## 使用场景

1. **找免费模型**：手上没有可用的免费模型时，扫描并测试
2. **模型失效替换**：当前模型不可用，快速切换到其他免费模型
3. **定时维护**：设置 cron 定期检查可用模型，自动更新
4. **能力筛选**：需要多模态或推理能力时，用 filter 筛选

---

## 故障排查

### 所有模型都返回 HTTP 500

当 `--test` 发现所有模型都失败时，**先检查账户状态**，再判断是否为模型问题：

```bash
# 检查账户余额、限额、是否被风控
curl -s "https://openrouter.ai/api/v1/auth/key" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

可能的情况：

| 响应字段 | 含义 | 处理 |
|----------|------|------|
| `limit_remaining: 0` | 额度耗尽 | 充值或等待重置 |
| `is_free_tier: false` 但 `limit_remaining: 1` | 付费账户 | 可用，但免费模型有限 |
| HTTP 403 | Key 被封/权限不足 | 重新生成 Key |
| 字段正常但全体仍 500 | OpenRouter 平台故障 | 等平台恢复，或换 key 重试 |

### 区分模型故障 vs 账户限制 vs 平台故障

- **模型故障**：少数模型失败，多数可用 → 正常轮换
- **账户限制**：全部模型同时失败 → 先修复账户问题（换 key）
- **平台故障**：换 key 后仍全部 500 → OpenRouter 侧问题，等恢复

**重要**：换 key 后仍大量 500 并不罕见（平台侧问题），此时唯一能做的就是等。经验值：即使平台恢复，通常也只有 1~3 个免费模型可用，不要期望所有模型同时恢复。

### Hermes config.yaml 不会自动更新

`rotate_free_models.py` 脚本的 `--restart` 参数只更新 openclaw 相关配置文件（`~/.openclaw/openclaw.json`、`~/.openclaw/agents/main/agent/models.json`），**不会**更新 Hermes 的 `config.yaml`。

如果需要更新 Hermes 的 fallback_providers，必须手动编辑 `/opt/data/home/.hermes/config.yaml`。脚本运行后会输出 "Working models" 列表，用这些结果手动替换 config.yaml 中的模型列表。

### ⚠️ 绝对不要用文本编辑工具修改 cron/jobs.json

`/opt/data/cron/jobs.json` 是 JSON 格式文件，包含嵌套对象和长字符串字段（如完整 API Key）。**禁止**使用 patch、sed、文本替换等字节级编辑工具修改此文件，原因：

- API Key 等字符串值在 JSON 中被双引号包裹，长度变化会导致 `"key": "old..."` 变成 `"key": "new..."`，JSON 解析器在闭合引号处失败
- 典型症状：`json.decoder.JSONDecodeError: Expecting ',' delimiter: line 144 column 923 (char 11369)`
- 损坏位置：char 11369 是截断后的 Key 值起始位置，原始完整 Key 有 73 字节，被截断成 15 字节后 JSON 结构彻底破坏

**正确做法**：用 Python 脚本读写：

```python
import json
with open('/opt/data/cron/jobs.json', 'r') as f:
    jobs = json.load(f)
# 修改 jobs 中的字段
with open('/opt/data/cron/jobs.json', 'w') as f:
    json.dump(jobs, f, indent=2)
```

验证：`python3 -c "import json; json.load(open('/opt/data/cron/jobs.json')); print('JSON OK')"`

---

## 相关文件

- 脚本：`scripts/rotate_free_models.py`
- 原始 Skill 来自 OpenClaw 社区