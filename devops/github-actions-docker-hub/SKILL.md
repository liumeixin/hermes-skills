---
name: GitHub Actions Docker 自动构建
description: GitHub Actions 自动构建 Docker 镜像推送到 Docker Hub 或 GHCR，包含 latest 标签设置和常见问题排查
tags: [docker, github-actions, docker-hub, ghcr, nas]
---

# GitHub Actions 自动构建推送 Docker 到 Docker Hub

通过 GitHub Actions workflow 自动构建 Docker 镜像并推送到 Docker Hub。

## 环境准备

### 1. GitHub Token
需要以下权限：
- `repo` - 仓库读写
- `workflow` - 工作流
- `write:packages` - 包写入

### 2. Docker Hub 设置
在 Docker Hub 设置 → Security 创建 Access Token，格式 `dckr_pat_xxx`

### 3. 添加 Secrets
通过 GitHub 仓库设置 → Secrets and variables → Actions 添加：
- `DOCKERHUB_USERNAME` - Docker Hub 用户名
- `DOCKERHUB_TOKEN` - Access Token

## Workflow 配置

```yaml
name: Build and Push

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: your-dockerhub-username/your-repo
          tags: |
            type=ref,event=branch
            type=raw,value=latest,enable=true
            type=sha
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
```

## 关键坑点

### 1. 标签问题
默认只用 `main` 分支名作为 tag，需要手动加 `latest`：
```yaml
type=raw,value=latest,enable=true
```

### 2. 拉取失败排查
如果报错 `manifest unknown`：
- 检查 workflow 日志中 tags 输出
- 确认 `latest` 标签存在

### 3. 验证
```bash
docker pull your-dockerhub-username/your-repo:latest
```

## GHCR（GitHub Container Registry）方案

GHCR 比 Docker Hub 简单：**不需要额外 token**，用仓库自带的 `GITHUB_TOKEN` 即可。

### Workflow 配置（GHCR）

```yaml
name: Build and Push to GHCR

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write          # 关键：需要 packages:write 权限

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}   # 无需额外配置

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=raw,value=latest
            type=sha,prefix=

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

### GHCR vs Docker Hub 对比

| | Docker Hub | GHCR |
|--|-----------|------|
| 认证 | 需要 Access Token (Secrets) | 用 GITHUB_TOKEN，零配置 |
| 权限 | 无特殊要求 | 需加 `permissions.packages: write` |
| 镜像地址 | `docker.io/user/repo` | `ghcr.io/owner/repo` |
| 私有仓库 | 付费 | 免费（公开仓库也免费） |

### 拉取 GHCR 镜像

```bash
# 公开仓库直接拉
docker pull ghcr.io/liumeixin/wenyan-editor:latest

# 私有仓库需要登录
docker login ghcr.io -u <username>
docker pull ghcr.io/<owner>/<repo>:latest
```

## 常见翻车

### build context 指向错误目录
Workflow 里 `context: ./wenyan-data` 但该目录已清空（没有 Dockerfile），导致 `open Dockerfile: no such file or directory`。排查：看 Actions 日志里的 `docker buildx build` 命令，确认 `--push` 后面的路径和 Dockerfile 位置一致。

### 镜像名与项目名不一致
迁移项目后 IMAGE_NAME 没改，推到了错误的镜像名。检查 `env.IMAGE_NAME` 是否匹配当前仓库。

### paths 过滤导致不触发
`on.push.paths: ['wenyan-data/**']` 只在 wenyan-data 目录变更时触发，改其他文件不会构建。如果不想要过滤，去掉 paths。

## 参考项目
- Docker Hub：https://github.com/liumeixin/wechat-md-styler
- GHCR：https://github.com/liumeixin/wenyan-editor

## 项目整合经验（wenyan-editor）

合并两个目录（wechat-md-styler + wenyan-editor）为一个项目的模式：

```
project/
├── frontend/     # 纯前端（HTML/JS/CSS）
├── backend/      # 后端服务（Flask/Express）
├── data/         # 运行时持久化数据（custom_themes.json 等）
├── Dockerfile    # 根目录，COPY frontend/ + backend/
├── docker-compose.yml  # volume 挂载：前端只读、后端只读、数据读写
└── .github/workflows/docker-publish.yml
```

Docker 架构原则：**容器是无状态服务层，数据在宿主机挂载目录里**。容器挂了重建，数据不丢。