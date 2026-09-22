---
name: Colima 下跨架构构建 amd64 镜像的 buildx 配置
description: 在 Mac(arm64/Colima) 上为京东云 amd64 服务器交叉编译 docker 镜像的环境配置
type: project
---

在本机(Apple Silicon + Colima)为京东云 ECS(amd64) 交叉编译镜像的既定配置。

**Why:** Colima 的 docker CLI 不自带 buildx,直接 `docker buildx` 报 `docker: unknown command: docker buildx`;且 arm64 主机默认打出 arm64 镜像,传到 amd64 服务器报 `exec format error`。

**How to apply:**
- buildx 已手动装到 `~/.docker/cli-plugins/docker-buildx`(v0.19.3, darwin-arm64,直接下载二进制,不用 brew——brew 会连带从源码编译 go,macOS 14 无 bottle 极慢)。
- 已注册 QEMU:`docker run --privileged --rm tonistiigi/binfmt --install amd64`。
- 已创建构建器 `mallbuilder`(`--driver docker-container --use`,支持 linux/amd64);跨架构必须用 docker-container 驱动,默认 docker 驱动不行。
- 构建务必带 `--platform linux/amd64`。操作手册见 `docs/交叉编译与上传部署.md`。