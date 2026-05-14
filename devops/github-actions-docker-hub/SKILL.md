---
name: GitHub Actions Docker Hub 自动构建
description: GitHub Actions 自动构建 Docker 镜像推送到 Docker Hub，包含 latest 标签设置和常见问题排查
tags: [docker, github-actions, docker-hub, nas]
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

## 参考项目
- 仓库：https://github.com/liumeixin/wechat-md-styler