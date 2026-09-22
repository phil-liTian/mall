#!/usr/bin/env bash
# ============================================================
# 一键把 Backend（mall-admin + redis + minio）部署到京东云 ECS
# 在【本机 Mac】执行：bash deploy-backend.sh
# 做的事：交叉构建 amd64 镜像 → 打包 → 上传 → 服务器装好 docker → 启动后端
# MySQL 复用服务器已有的（111.228.13.106），本脚本不碰前端 nginx / 外网访问
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

echo "==> [0/6] 检查本机 .env"
if [ ! -f Backend/.env ]; then
  cp Backend/.env.example Backend/.env
  echo "已从 .env.example 生成 Backend/.env —— 请先填入真实值再重跑本脚本："
  echo "  · DB_PASSWORD  = 现有 MySQL 的 root 密码（必须真实，否则后端连不上库启动失败）"
  echo "  · JWT_SECRET   = 任意长随机串"
  echo "  · MINIO_ACCESS_KEY / MINIO_SECRET_KEY = 自定义"
  echo "  · MINIO_PUBLIC_URL = 先随便填 http://${ECS_IP}:9000（第一步用不到）"
  exit 1
fi

echo "==> [1/6] 检查 buildx"
if ! docker buildx version >/dev/null 2>&1; then
  echo "buildx 未安装。请先按 docs/交叉编译与上传部署.md 的『前置条件』安装 buildx，再重跑。"
  exit 1
fi
docker buildx inspect mallbuilder >/dev/null 2>&1 \
  || docker buildx create --name mallbuilder --driver docker-container --use
docker buildx use mallbuilder

echo "==> [2/6] 交叉构建后端 amd64 镜像"
docker buildx build --platform linux/amd64 -f Backend/Dockerfile -t "mall-admin:${TAG}" --load Backend

echo "==> [3/6] 拉取基础镜像（amd64）并校验架构"
docker pull --platform linux/amd64 redis:7-alpine
docker pull --platform linux/amd64 minio/minio:latest
for img in "mall-admin:${TAG}" redis:7-alpine minio/minio:latest; do
  arch=$(docker image inspect "$img" --format '{{.Architecture}}')
  echo "    $img -> $arch"
  [ "$arch" = "amd64" ] || { echo "!! 架构错误（应为 amd64），停止"; exit 1; }
done

echo "==> [4/6] 打包镜像"
docker save "mall-admin:${TAG}" redis:7-alpine minio/minio:latest | gzip > mall-images.tar.gz
ls -lh mall-images.tar.gz

echo "==> [5/6] 上传到服务器 ${ECS_USER}@${ECS_IP}:${REMOTE_DIR}"
ssh "${ECS_USER}@${ECS_IP}" "mkdir -p ${REMOTE_DIR}"
scp mall-images.tar.gz \
    Backend/docker-compose.prod.yml \
    Backend/docker-compose.verify.yml \
    Backend/.env \
    "${ECS_USER}@${ECS_IP}:${REMOTE_DIR}/"

echo "==> [6/6] 服务器：装 docker（若无）→ load 镜像 → 启动后端"
ssh "${ECS_USER}@${ECS_IP}" bash -s <<REMOTE
set -e
cd ${REMOTE_DIR}

# 没装 docker 就自动装
if ! command -v docker >/dev/null 2>&1; then
  echo "  服务器未装 docker，正在安装..."
  apt-get update -y && apt-get install -y docker.io docker-compose-v2
  systemctl enable --now docker
fi

# 内存只有 2G：没有 swap 就建 2G，兜底防 OOM
if ! swapon --show | grep -q swapfile; then
  echo "  创建 2G swap..."
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "  载入镜像..."
gunzip -c mall-images.tar.gz | docker load

echo "  启动 redis + minio + mall-admin（8082 仅映射到本机回环，供验证）..."
docker compose -f docker-compose.prod.yml -f docker-compose.verify.yml up -d redis minio mall-admin

sleep 5
docker compose -f docker-compose.prod.yml ps
REMOTE

echo ""
echo "==> 部署命令已执行完。后端启动约需 60~90 秒，用下面命令看日志确认就绪："
echo "    ssh ${ECS_USER}@${ECS_IP} 'cd ${REMOTE_DIR} && docker compose -f docker-compose.prod.yml logs -f mall-admin'"
echo "    看到 'Started MallAdminApplication' 即表示后端跑起来了。"
echo "    服务器本机验证：ssh ${ECS_USER}@${ECS_IP} 'curl -s localhost:8082/swagger-ui/index.html -o /dev/null -w \"%{http_code}\\n\"'"
