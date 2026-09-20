---
name: 容器运行时是 Colima 而非 Docker Desktop
description: '本机 docker/docker compose 底层由 Colima 提供,配置与镜像加速改法特殊'
type: project
---

本机的 `docker` / `docker compose` 命令由 **Colima** 提供(context 名 `colima`,非 Docker Desktop)。

**Why:** 决定了 Docker daemon 配置文件位置与生效方式,直接影响镜像拉取加速、构建行为的排查。

**How to apply:**
- Docker daemon 配置在 `~/.colima/default/colima.yaml` 的 `docker:` 块(镜像加速源写在这里),改后需 `colima restart` 才生效。
- Colima **不读取** `~/.docker/daemon.json`,不要往那里写配置。
- 编辑工具无法操作工作区(`/Users/litian.phil/phil/java/mall`)之外的绝对路径,修改 `~/.colima/...` 等文件必须用终端(sed / printf 等)。