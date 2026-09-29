#!/usr/bin/env bash
# ============================================================
# 一键把【前端 + 后端】整套部署到京东云 ECS（HTTP，80 端口）
# 在【本机 Mac】执行：bash deploy-fullstack.sh
# 做的事：交叉构建 amd64 镜像(前端+后端) → 拉基础镜像 → 打包 → 上传 → 服务器 load → 起全套
# MySQL 复用服务器已有的（111.228.13.106），不容器化 MySQL
# 上线后访问：http://111.228.13.106
# ============================================================
set -euo pipefail

# ===== 配置：按需修改 =====
ECS_USER=root
ECS_IP=111.228.13.106
REMOTE_DIR=/opt/mall
TAG=1.0
# =========================

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> [0/7] 检查本机 .env"
if [ ! -f Backend/.env ]; then
  echo "缺少 Backend/.env，请先按 Backend/.env.example 填好真实值再重跑。"
  exit 1
fi

echo "==> [1/7] 检查 buildx"
if ! docker buildx version >/dev/null 2>&1; then
  echo "buildx 未安装。请先按 docs/交叉编译与上传部署.md 的『前置条件』安装 buildx，再重跑。"
  exit 1
fi
docker buildx inspect mallbuilder >/dev/null 2>&1 \
  || docker buildx create --name mallbuilder --driver docker-container \
       --config Backend/buildkitd.toml --use
docker buildx use mallbuilder

echo "==> [2/7] 交叉构建后端 amd64 镜像"
docker buildx build --platform linux/amd64 -f Backend/Dockerfile -t "mall-admin:${TAG}" --load Backend

echo "==> [3/7] 交叉构建前端 amd64 镜像"
docker buildx build --platform linux/amd64 -f frontend/Dockerfile -t "mall-frontend:${TAG}" --load frontend

echo "==> [4/7] 用 buildx 把 redis/minio 重导出为 amd64 单平台专用镜像（严格按 --platform 从源拉，不动你本地已有镜像）"
docker buildx build --platform linux/amd64 -t "mall-redis:${TAG}" --load - <<'DOCKERFILE'
FROM docker.m.daocloud.io/library/redis:7-alpine
DOCKERFILE
docker buildx build --platform linux/amd64 -t "mall-minio:${TAG}" --load - <<'DOCKERFILE'
FROM quay.m.daocloud.io/minio/minio:latest
DOCKERFILE
for img in "mall-admin:${TAG}" "mall-frontend:${TAG}" "mall-redis:${TAG}" "mall-minio:${TAG}"; do
  arch=$(docker image inspect "$img" --format '{{.Architecture}}')
  echo "    $img -> ${arch:-<未知>}"
  [ "$arch" = "amd64" ] || { echo "!! 架构错误（应为 amd64），停止"; exit 1; }
done

echo "==> [5/7] 打包镜像"
docker save "mall-admin:${TAG}" "mall-frontend:${TAG}" "mall-redis:${TAG}" "mall-minio:${TAG}" | gzip > mall-images.tar.gz
ls -lh mall-images.tar.gz

echo "==> [6/7] 上传到服务器 ${ECS_USER}@${ECS_IP}:${REMOTE_DIR}"
ssh "${ECS_USER}@${ECS_IP}" "mkdir -p ${REMOTE_DIR}/certs"
scp mall-images.tar.gz \
    Backend/docker-compose.prod.yml \
    Backend/.env \
    "${ECS_USER}@${ECS_IP}:${REMOTE_DIR}/"

echo "==> [7/7] 服务器：装 docker（若无）→ load 镜像 → 起全套（含 nginx:80）"
ssh "${ECS_USER}@${ECS_IP}" bash -s <<REMOTE
set -e
cd ${REMOTE_DIR}

if ! command -v docker >/dev/null 2>&1; then
  echo "  服务器未装 docker，正在安装..."
  apt-get update -y && apt-get install -y docker.io docker-compose-v2
  systemctl enable --now docker
fi

if ! swapon --show | grep -q swapfile; then
  echo "  创建 2G swap..."
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "  载入镜像..."
gunzip -c mall-images.tar.gz | docker load

echo "  改名为 compose 认的镜像名..."
docker tag mall-redis:${TAG} redis:7-alpine
docker tag mall-minio:${TAG} minio/minio:latest

echo "  启动全套（redis + minio + mall-admin + nginx）..."
docker compose -f docker-compose.prod.yml up -d

sleep 5
docker compose -f docker-compose.prod.yml ps
REMOTE

echo ""
echo "==> 部署命令已执行完。后端启动约需 60~90 秒。"
echo "    看后端日志：ssh ${ECS_USER}@${ECS_IP} 'cd ${REMOTE_DIR} && docker compose -f docker-compose.prod.yml logs -f mall-admin'"
echo "    看到 'Started MallAdminApplication' 即就绪。"
echo "    浏览器访问：http://${ECS_IP}"
echo "    ⚠️ 别忘了在京东云控制台【安全组】放行 80 端口（以及 3306 给后端连 MySQL，通常已放行）。"
