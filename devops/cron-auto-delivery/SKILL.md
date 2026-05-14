---
name: cron-auto-delivery
description: Cron jobs auto-deliver final responses to configured targets — send_message to the same target gets deduplicated and skipped. Print report content directly as final response instead.
metadata: {"keywords": ["cron", "send_message", "auto-delivery", "duplicate"]}
---

# Cron Job Auto-Delivery Behavior

## The Gotcha

When a cron job has `deliver` configured (e.g., `deliver: local` or a specific platform channel), it **automatically delivers** the final response text to that target. Calling `send_message_tool()` to the **same target** within the same cron job results in:

```
{"success": true, "skipped": true, "reason": "cron_auto_delivery_duplicate_target", ...}
```

The message is silently skipped — no error, no delivery.

## The Rule

**If the cron job is already configured to auto-deliver its output to a target, do NOT also call `send_message_tool()` to that same target.**

Instead, put the intended message content directly in the final `print()` / response — the cron delivery mechanism handles the rest.

## When send_message IS needed in a cron

- Sending to a **different** target than the one configured for auto-delivery
- Sending a **supplemental** message to a different channel (e.g., cron computes stats, sends to Feishu, but also sends a Slack summary)

## Verification

Tested on: `feishu:oc_2abe398e83a9758c72451ed260170088`

```python
# ❌ WRONG — will be deduplicated
from tools.send_message_tool import send_message_tool
send_message_tool({'action': 'send', 'target': 'feishu:oc_...', 'message': report})

# ✅ CORRECT — just print, let cron auto-deliver
print(report)
```

## Root Cause

The `send_message_tool` in `/opt/hermes/tools/send_message_tool.py` checks `is_interrupted()` which detects cron context and deduplicates sends to the cron's own delivery target.
