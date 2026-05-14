---
name: neat-freak
description: 知识库收尾技能 — 每次项目阶段完成后同步 CLAUDE.md、docs/、记忆文件，防止知识腐化。触发词：同步一下、整理文档、更新记忆、收尾、新人能直接上手
---

# neat-freak — Knowledge Base Neat-Freak

**Cross-platform Agent Skill** for Claude Code, OpenAI Codex, OpenCode, OpenClaw

---

## Purpose

End-of-session knowledge cleanup that reconciles project docs (CLAUDE.md, README.md, docs/) and agent memory against code. **Prevents knowledge rot** by ensuring every layer of the knowledge system stays current with code changes.

**Trigger phrases:** "sync up", "tidy up docs", "update memory", "clean up docs", "/sync", "/neat", "同步一下", "整理文档", "整理一下", "更新记忆", "梳理一下", "收尾", "这个阶段做完了", "新人能直接上手"

Also triggers on: stale docs reports, conflicting memories, or requests for clean handoff.

---

## Core Concept: Three Knowledge Types, Three Audiences

| Location | Audience | Responsibility | Cost of Not Syncing |
|----------|----------|----------------|---------------------|
| **Agent Memory** (if supported) | Agent itself across sessions | Personal preferences, non-obvious facts, cross-project references | Next session agent forgets historical decisions |
| Project Root `CLAUDE.md`/`AGENTS.md` | AI in future sessions (self) | Project conventions, structure, boundaries, env vars, route清单 | Next AI wastes time in this project |
| Project `docs/` + `README.md` | **Others** (humans, downstream devs, future AI) | Onboarding guides, architecture, runbooks, handoff docs, API reference | Others or systems cannot correctly integrate |

> **Critical:** These three layers have **non-overlapping audiences**. Writing "new device flow adds five routes" in CLAUDE.md ≠ writing "how downstream connects to this flow" in docs/integration-guide.md.

### CLAUDE.md is a Rulebook, NOT a Changelog

**Most common failure mode:** Adding blockquote history entries like "2026-05-08 X feature launched, see docs/Y.md". After 6 months, top 200 lines are quotes pushing real rules out of view.

**Test:** Should this go in CLAUDE.md? Ask: *"If the next AI doesn't see this, will it make mistakes?"*

| Content | CLAUDE.md? | Reason |
|---------|-----------|--------|
| "Prisma queries only in `modules/**/data/`" | ✅ | Boundary violation, AI must see |
| "rsync single-file deploy must use full target path" | ✅ | Pitfall warning |
| "Never run `systemctl stop aihot-worker` directly" | ✅ | Critical rule |
| "2026-05-08 timelineAt launched, see docs/ARCHITECTURE.md §5.4" | ❌ | Mechanism belongs in docs |
| "2024-04-30 opened to public, /,/all accessible anonymously" | ❌ | Fact belongs in docs/ARCHITECTURE.md |
| "5/8 bug fix retrospective details" | ❌ | Single incident memory, belongs in memory or deletion |

**✅ Should go in CLAUDE.md:** Hard boundaries, prohibitions, command references, permission models, collaboration flows, doc pointers, pitfall warnings.

**❌ Should NOT go in CLAUDE.md:** Historical narratives, detailed mechanism explanations, single incident retrospectives, bug fix logs, "see docs/Z.md" pointer sentences.

---

## Execution Workflow

### Step 0: Size Check (Anti-Bloat) — **HIGHEST PRIORITY**

Before any sync, run `wc -l` on key files:

| File | Soft Limit | If Exceeded |
|------|-----------|-------------|
| `CLAUDE.md`/`AGENTS.md` | ~300 lines/~15KB | Trim: remove top blockquotes/history → migrate to docs |
| Memory index (`MEMORY.md`) | ~150 lines | Remove superseded, single-incident, or code-replaceable items |
| Single memory file | ~100 lines | Split into separate memories or delete |
| `docs/*.md` | ~1500 lines | Split into multiple files with index |

> **Rationale:** Oversized CLAUDE.md pushes important rules beyond prompt context (~200 lines). No amount of sync work matters if critical rules are hidden.

**Execution order:** 1) Trim bloat first → 2) Then sync this session's additions. Never combine—different mental models.

---

### Step 1: Inventory (Mandatory, Mechanical Enumeration)

**Cannot skip. List before judging.**

1. **Agent memory files** (if applicable):
   - Claude Code: `ls ~/.claude/projects/<...>/memory/` → read `MEMORY.md` and all referenced `.md`
   - Others: See `references/agent-paths.md`

2. **For each project in this conversation:**
   ```
   ls /                    # Confirm root structure
   ls /docs/ 2>/dev/null   # Enumerate ALL docs (confirm missing too)
   find -maxdepth 2 -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*"
   ```
   Read: README.md, CLAUDE.md/AGENTS.md, every `docs/*.md`

3. **Global agent config** (if exists): `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`

4. **Review entire conversation content**

**Output:** Internal file manifest marking each: "Evaluated / Needs changes / No changes needed"

> ⚠️ **Missing files here is the #1 failure point.** Enumeration cannot be skipped.

---

### Step 2: Identify Changes — Change Impact Matrix

**Think about which doc layers each new fact affects.**

| Change Type | Files to Update |
|-------------|-----------------|
| New API/route | CLAUDE.md route list + integration-guide + architecture Routes |
| New/renamed env var | CLAUDE.md env table + runbook + downstream integration-guide |
| New database table | CLAUDE.md + architecture Data Model |
| Large feature (cross-file) | All above + architecture new section + handoff checklist |
| Cross-project change | **Both** upstream and downstream docs |
| Memory layer | Absolute dates, fix expired facts, merge duplicates, delete completed TODOs |

> ⚠️ **Cross-project check:** If project A changed and project B depends on A, check B's docs.

---

### Step 3: Trim Bloat (Execute Before Sync)

Per **Step 0** size limits above. Remove:

- Top blockquote history entries that are >30 days old
- "See docs/X.md" pointer sentences (mechanism already in docs)
- Single-incident retrospectives (keep 1 line rule, rest → docs/PLAYBOOK.md or delete)
- Superseded "middle state" narratives (keep only final state rule)
- Completed TODOs from memory files

---

### Step 4: Sync (Add/Update)

For each file identified in Step 2:

1. **CLAUDE.md / AGENTS.md:** Add only boundary rules, prohibitions, env vars, route list updates, doc pointers
2. **docs/:** Add mechanism details, integration examples, runbooks, architecture
3. **Memory files:** Update expired facts, add new non-obvious decisions, convert relative dates to absolute

**Rule of thumb:** If it affects how AI *writes code* → CLAUDE.md. If it affects how humans *understand system* → docs/.

---

### Step 5: Verify

After editing:
1. `wc -l` on CLAUDE.md — confirm under 300 lines
2. Read each modified section — confirm no duplicate content across files
3. Confirm cross-references are bidirectional (if docs/X.md mentions "see CLAUDE.md §3", CLAUDE.md §3 should reference "docs/X.md")
4. Confirm no orphaned content (referenced but never explained)

---

## Reference Files

- `references/agent-paths.md` — 不同 agent 平台的记忆和配置文件路径
- `references/sync-matrix.md` — 变更影响矩阵（加什么、删什么）
