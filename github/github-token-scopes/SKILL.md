---
name: github-token-scopes-for-actions
description: GitHub Token 权限配置指南 - 解决 Workflow 推送失败问题
version: 1.0.0
author: Hermes Agent
metadata:
  hermes:
    tags: [GitHub, Token, Workflow, Permissions]
    related_skills: [github-auth, github-repo-management]
---

# GitHub Token 权限配置指南

## 问题描述

推送代码到 GitHub 时，如果包含 `.github/workflows/*.yml` 文件，可能遇到以下错误：

```
! [remote rejected] main -> main (refusing to allow a Personal Access Token to 
create or update workflow `.github/workflows/docker-publish.yml` without `workflow` scope)
error: failed to push some refs to 'https://github.com/owner/repo.git'
```

## 解决方案

生成 Personal Access Token (PAT) 时，确保勾选以下权限：

### 必须的 Scope

| Scope | 用途 |
|-------|------|
| ✅ `repo` | 创建仓库、推送代码 |
| ✅ `workflow` | **推送 `.github/workflows/` 文件（关键！）** |

### 可选 Scope（按需）

| Scope | 用途 |
|-------|------|
| `delete_repo` | 删除仓库 |
| `admin:org` | 组织管理 |

## 生成步骤

1. 访问 https://github.com/settings/tokens
2. 点击 **Generate new token (classic)**
3. 在 "Select scopes" 区域：
   - 勾选 **`repo`** 
   - 勾选 **`workflow`**（重要！）
4. 设置过期时间（可选）
5. 点击 Generate
6. 复制并使用新 token

## 验证方法

用新 token 测试推送：

```bash
git remote set-url origin https://新TOKEN@github.com/username/repo.git
git push -u origin main
```

## 常见错误

| 错误信息 | 原因 | 解决 |
|---------|------|------|
| `without workflow scope` | 缺少 workflow 权限 | 重新生成 token，勾选 workflow |
| `without repo scope` | 缺少 repo 权限 | 重新生成 token，勾选 repo |
| `terminal prompts disabled` | token 未生效 | 检查 remote URL 是否包含 token |
| `name already exists` | 仓库已存在 | 先删除或用新名字创建 |