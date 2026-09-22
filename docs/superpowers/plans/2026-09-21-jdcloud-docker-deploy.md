# mall 京东云 Docker 部署 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 mall（Spring Boot 后端 + React/Vite 前端）以全容器方式部署到一台京东云 ECS，经域名 + HTTPS 对外访问。

**Architecture:** 单台 ECS 跑一个 `docker-compose.prod.yml`，5 个容器（nginx / mall-admin / mysql / redis / minio）在内部网络通信，仅 nginx 暴露 80/443。镜像在本地 Mac 用 buildx 交叉构建 amd64、`docker save` 成 tar、scp 上传、服务器 `docker load`。

**Tech Stack:** Docker Compose、Spring Boot 2.7.5(JDK8)、Nginx、MySQL 8、Redis 7、MinIO、Vite 6/React 18、docker buildx。

**Spec:** `docs/superpowers/specs/2026-09-21-jdcloud-docker-deploy-design.md`

## Global Constraints

- 镜像架构必须为 **linux/amd64**（ECS 是 amd64，Mac 是 arm64，不兼容）。所有 `docker buildx build` 必带 `--platform linux/amd64`，构建后必须 `docker image inspect ... --format '{{.Architecture}}'` 校验为 `amd64`。
- 不改动任何业务逻辑；唯一 Java 改动是 `MinioController` 的图片 URL 拼接。
- 敏感信息（DB 密码、JWT 密钥、MinIO key）一律环境变量注入，**不写进代码或进 git**；`.env` 入 `.gitignore`。
- dev 用的 `Backend/docker-compose.yml` 保持不动，生产用新文件 `docker-compose.prod.yml`。
- 服务器内存仅 2GB：每容器设 `mem_limit`，并建 4GB swap。
- 用户会话规则：**不自动 `git commit`**。计划里的 commit 步骤在执行时须先征得用户同意。

---

### Task 1: 后端生产配置 + MinIO 图片公网 URL 修复

**Files:**
- Create: `Backend/mall-admin/src/main/resources/application-prod.yml`
- Modify: `Backend/mall-admin/src/main/java/com/phil/mall/controller/MinioController.java:31-38`（新增 PUBLIC_URL 字段）、`:77`（改用 PUBLIC_URL）

**Interfaces:**
- Produces: prod profile 读取的环境变量名 `DB_USERNAME` / `DB_PASSWORD` / `JWT_SECRET` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_PUBLIC_URL`（Task 4 的 compose/.env 必须提供同名变量）。
- Produces: MinIO 图片对外 URL 形如 `${MINIO_PUBLIC_URL}/mall/<日期>/<文件名>`（Task 3 的 nginx `/mall-files/` 反代据此设计）。

- [ ] **Step 1: 创建 `application-prod.yml`**

```yaml
server:
  port: 8082
spring:
  datasource:
    url: jdbc:mysql://mysql:3306/mall?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD}
  redis:
    host: redis
    port: 6379
    database: 0
minio:
  endpoint: http://minio:9000
  publicUrl: ${MINIO_PUBLIC_URL}
  bucketName: mall
  accessKey: ${MINIO_ACCESS_KEY}
  secretKey: ${MINIO_SECRET_KEY}
jwt:
  secret: ${JWT_SECRET}
logging:
  level:
    root: info
    com.phil.mall: info
```

- [ ] **Step 2: 给 `MinioController` 新增 PUBLIC_URL 字段**

在 `:38` 现有 `SECRET_KEY` 字段后追加（默认回退到 endpoint，dev 不受影响）：

```java
    @Value("${minio.publicUrl:${minio.endpoint}}")
    private String PUBLIC_URL;
```

- [ ] **Step 3: 改第 77 行图片 URL 拼接**

把：
```java
            minioUploadDto.setUrl(ENDPOINT + "/" + BUCKET_NAME + "/" + objectName);
```
改为：
```java
            minioUploadDto.setUrl(PUBLIC_URL + "/" + BUCKET_NAME + "/" + objectName);
```

- [ ] **Step 4: 编译验证（在本机 Mac 上验证代码可编译，与架构无关）**

Run: `cd Backend && mvn -q -pl mall-admin -am package -DskipTests`
Expected: BUILD SUCCESS，`mall-admin/target/mall-admin-*.jar` 生成。

- [ ] **Step 5: 校验 prod profile 与改动生效**

Run: `grep -n "publicUrl\|PUBLIC_URL" Backend/mall-admin/src/main/java/com/phil/mall/controller/MinioController.java Backend/mall-admin/src/main/resources/application-prod.yml`
Expected: 三处命中（字段声明、第 77 行使用、prod yml 的 publicUrl 配置）。

- [ ] **Step 6: Commit（执行前先征得用户同意）**

```bash
git add Backend/mall-admin/src/main/resources/application-prod.yml Backend/mall-admin/src/main/java/com/phil/mall/controller/MinioController.java
git commit -m "feat(deploy): add prod profile and public URL for minio images"
```

---

### Task 2: 关闭前端生产 mock

**Files:**
- Modify: `frontend/vite.config.ts`

**Interfaces:**
- Consumes: 无。
- Produces: `pnpm build` 产出的 `frontend/dist` 不含 mock 代码，生产请求真实走 `/api`（Task 3 的 nginx 反代承接）。

- [ ] **Step 1: 改 `vite.config.ts` 让 mock 仅 dev 生效**

整份替换为：

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteMockServe } from 'vite-plugin-mock'
import path from 'node:path'

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    viteMockServe({
      mockPath: 'src/mock',
      enable: command === 'serve',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
}))
```

- [ ] **Step 2: 构建验证（本机 Mac 原生构建，仅验证产物正确）**

Run: `cd frontend && pnpm install --frozen-lockfile && pnpm build`
Expected: BUILD 成功，`frontend/dist/index.html` 与 `dist/assets/*.js` 生成。

- [ ] **Step 3: 校验产物无 mock**

Run: `grep -rl "mockjs\|vite-plugin-mock" frontend/dist/assets 2>/dev/null && echo "FAIL: mock 进了产物" || echo "OK: 产物无 mock"`
Expected: 打印 `OK: 产物无 mock`。

- [ ] **Step 4: Commit（执行前先征得用户同意）**

```bash
git add frontend/vite.config.ts
git commit -m "build(frontend): disable mock in production build"
```

---

### Task 3: 前端 Dockerfile + nginx 配置

**Files:**
- Create: `frontend/Dockerfile`
- Create: `frontend/nginx.conf`

**Interfaces:**
- Consumes: Task 2 的 `pnpm build` 产物路径 `/app/dist`。
- Produces: 镜像 `mall-frontend:1.0`（Task 4 的 compose `nginx` 服务引用）；nginx 反代 `/api/` → `mall-admin:8082`、`/mall-files/` → `minio:9000`；证书路径 `/etc/nginx/certs/server.crt|server.key`（Task 4 挂载、Task 7 提供）。

- [ ] **Step 1: 创建 `frontend/Dockerfile`**

```dockerfile
# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---------- run stage ----------
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
```

- [ ] **Step 2: 创建 `frontend/nginx.conf`**

`YOUR_DOMAIN` 是占位，Task 7 上云前替换为真实域名。

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name YOUR_DOMAIN;

    ssl_certificate     /etc/nginx/certs/server.crt;
    ssl_certificate_key /etc/nginx/certs/server.key;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    client_max_body_size 12m;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://mall-admin:8082/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /mall-files/ {
        proxy_pass http://minio:9000/;
        proxy_set_header Host $host;
    }
}
```

- [ ] **Step 3: nginx 配置语法验证（本机，用官方镜像跑 nginx -t，不依赖上游服务）**

Run:
```bash
docker run --rm -v "$PWD/frontend/nginx.conf":/etc/nginx/conf.d/default.conf:ro nginx:1.27-alpine nginx -t
```
Expected: 输出 `syntax is ok` 与 `test is successful`（因缺证书文件，若报 `cannot load certificate` 属预期——语法本身通过即算过；证书在 Task 7 提供）。

> 说明：镜像的 amd64 交叉构建与产物校验放在 Task 5 统一做，本任务只验证 Dockerfile/nginx 文件本身正确。

- [ ] **Step 4: Commit（执行前先征得用户同意）**

```bash
git add frontend/Dockerfile frontend/nginx.conf
git commit -m "feat(frontend): add nginx dockerfile and reverse-proxy config"
```

---

### Task 4: 生产 compose + 密钥模板 + gitignore

**Files:**
- Create: `Backend/docker-compose.prod.yml`
- Create: `Backend/.env.example`
- Modify: `Backend/.gitignore`（追加 `.env`）

**Interfaces:**
- Consumes: Task 1 的环境变量名；镜像名 `mall-admin:1.0`（Task 5 产出）、`mall-frontend:1.0`（Task 3/Task 5 产出）。
- Produces: `docker-compose.prod.yml` 供 Task 7 在服务器上 `up -d`。

- [ ] **Step 1: 创建 `Backend/docker-compose.prod.yml`**

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: mall-mysql
    env_file: .env
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: mall
      TZ: Asia/Shanghai
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_general_ci
      - --default-authentication-plugin=mysql_native_password
      - --lower_case_table_names=1
      - --innodb-buffer-pool-size=256M
      - --performance-schema=OFF
    volumes:
      - mysql-data:/var/lib/mysql
      - ./sql/mall-admin.sql:/docker-entrypoint-initdb.d/mall-admin.sql:ro
    networks: [mall-net]
    mem_limit: 640m
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: mall-redis
    command: redis-server --appendonly yes --maxmemory 128mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks: [mall-net]
    mem_limit: 192m
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    container_name: mall-minio
    env_file: .env
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio-data:/data
    entrypoint: sh -c "minio server /data --console-address ':9001' & sleep 5 && mc alias set local http://localhost:9000 $$MINIO_ROOT_USER $$MINIO_ROOT_PASSWORD && mc mb -p local/mall || true && mc anonymous set download local/mall || true && wait"
    networks: [mall-net]
    mem_limit: 320m
    restart: unless-stopped

  mall-admin:
    image: mall-admin:1.0
    container_name: mall-admin
    env_file: .env
    environment:
      TZ: Asia/Shanghai
      SPRING_PROFILES_ACTIVE: prod
      JAVA_TOOL_OPTIONS: "-Xms128m -Xmx384m"
    depends_on: [mysql, redis, minio]
    networks: [mall-net]
    mem_limit: 512m
    restart: unless-stopped

  nginx:
    image: mall-frontend:1.0
    container_name: mall-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./certs:/etc/nginx/certs:ro
    depends_on: [mall-admin, minio]
    networks: [mall-net]
    mem_limit: 96m
    restart: unless-stopped

networks:
  mall-net:

volumes:
  mysql-data:
  redis-data:
  minio-data:
```

- [ ] **Step 2: 创建 `Backend/.env.example`（占位值，入 git 供参考）**

```
DB_USERNAME=root
DB_PASSWORD=change-me-strong-password
JWT_SECRET=change-me-long-random-string
MINIO_ACCESS_KEY=change-me-access-key
MINIO_SECRET_KEY=change-me-strong-secret
MINIO_PUBLIC_URL=https://YOUR_DOMAIN/mall-files
```

- [ ] **Step 3: 把 `.env` 加入 `Backend/.gitignore`**

在 `Backend/.gitignore` 末尾追加一行：
```
.env
```

- [ ] **Step 4: 校验 compose 语法（用占位 .env 让变量可解析）**

Run:
```bash
cd Backend && cp .env.example .env && docker compose -f docker-compose.prod.yml config >/dev/null && echo "OK: compose 合法" && rm .env
```
Expected: 打印 `OK: compose 合法`，无报错（临时 `.env` 用完删除，避免误传占位密钥）。

- [ ] **Step 5: Commit（执行前先征得用户同意）**

```bash
git add Backend/docker-compose.prod.yml Backend/.env.example Backend/.gitignore
git commit -m "feat(deploy): add production compose, env template and gitignore"
```

---

### Task 5: 本地交叉构建 amd64 镜像并导出 tar

> 本任务在**本机 Mac** 执行，产出上传用的镜像包。需要 Docker Desktop 已启用 buildx（默认自带）。

**Files:**
- 产物：`mall-images.tar.gz`（不入 git，本地临时文件）

**Interfaces:**
- Consumes: Task 1/2/3 的 Dockerfile 与源码。
- Produces: 含 `mall-admin:1.0` + `mall-frontend:1.0`（均 amd64）的 `mall-images.tar.gz`（Task 7 scp 上传）。

- [ ] **Step 1: 创建 buildx builder（一次性）**

Run: `docker buildx create --name mallbuilder --use || docker buildx use mallbuilder`
Expected: 输出 builder 名或已切换。

- [ ] **Step 2: 交叉构建后端 amd64 并载入本地**

Run:
```bash
docker buildx build --platform linux/amd64 -f Backend/Dockerfile -t mall-admin:1.0 --load Backend
```
Expected: 构建成功，末尾 `naming to docker.io/library/mall-admin:1.0`。

- [ ] **Step 3: 交叉构建前端 amd64 并载入本地**

Run:
```bash
docker buildx build --platform linux/amd64 -f frontend/Dockerfile -t mall-frontend:1.0 --load frontend
```
Expected: 构建成功。

- [ ] **Step 4: 校验镜像架构为 amd64（关键，防不兼容）**

Run:
```bash
docker image inspect mall-admin:1.0 --format '{{.Architecture}}' && docker image inspect mall-frontend:1.0 --format '{{.Architecture}}'
```
Expected: 两行都输出 `amd64`。若出现 `arm64` 停止并排查 `--platform` 是否生效。

- [ ] **Step 5: 导出压缩 tar**

Run:
```bash
docker save mall-admin:1.0 mall-frontend:1.0 | gzip > mall-images.tar.gz && ls -lh mall-images.tar.gz
```
Expected: 生成 `mall-images.tar.gz`（压缩后一般几百 MB）。

---

### Task 6: 服务器一次性准备（在 ECS 上执行）

> 本任务在**京东云 ECS**（Ubuntu 24.04）上执行。需要 root/sudo。

**Files:** 无代码；服务器系统配置。

**Interfaces:**
- Produces: 装好 docker+compose、4GB swap、镜像加速的服务器，供 Task 7 部署。

- [ ] **Step 1: 安装 Docker 与 compose 插件**

Run:
```bash
apt-get update && apt-get install -y docker.io docker-compose-v2
systemctl enable --now docker
docker version && docker compose version
```
Expected: docker 与 compose 版本正常输出。

- [ ] **Step 2: 创建 4GB swap（2GB 内存必需）**

Run:
```bash
fallocate -l 4G /swapfile && chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile
grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```
Expected: `free -h` 的 Swap 行显示 4.0Gi。

- [ ] **Step 3: 配置镜像加速器**

把 `<你的镜像加速地址>` 换成京东云/可用的加速地址：
```bash
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{ "registry-mirrors": ["https://<你的镜像加速地址>"] }
EOF
systemctl restart docker
```
Expected: `docker info | grep -A2 "Registry Mirrors"` 显示已配置。

- [ ] **Step 4: 京东云控制台安全组放行**

在控制台把 ECS 安全组入方向放行 **TCP 80、443**（22 保留给 SSH），其余不开。域名 A 记录指向 ECS 公网 IP。
Expected: `dig +short YOUR_DOMAIN` 返回 ECS 公网 IP（DNS 生效后）。

---

### Task 7: 上传、加载、启动与验证（本机 + 服务器）

> 前半在本机 scp，后半在 ECS 执行。需先备好：真实域名、SSL 证书、真实 `.env`。

**Files:**
- 服务器：`/opt/mall/{docker-compose.prod.yml, sql/, certs/, .env, mall-images.tar.gz}`

**Interfaces:**
- Consumes: Task 4 的 compose、Task 5 的 tar。

- [ ] **Step 1: 本机准备真实 .env 与证书**

```bash
cd Backend
cp .env.example .env
# 编辑 .env：填强密码、JWT 密钥、MinIO key，MINIO_PUBLIC_URL 改成 https://真实域名/mall-files
mkdir -p certs
# 把京东云 SSL 证书（Nginx 格式）放入：certs/server.crt（含证书链）、certs/server.key
```
Expected: `.env` 六个变量均为真实值；`certs/server.crt`、`certs/server.key` 存在。

- [ ] **Step 2: 把 nginx.conf 里的 YOUR_DOMAIN 换成真实域名后重建前端镜像**

> nginx.conf 的 `server_name` 已烘焙进 `mall-frontend:1.0`，改域名需重跑 Task 5 Step 3–5 重新生成 tar。

```bash
sed -i '' 's/YOUR_DOMAIN/真实域名/g' frontend/nginx.conf   # macOS sed
```
之后重跑 Task 5 的 Step 3、4、5 重建前端镜像并重新导出 `mall-images.tar.gz`。
Expected: `grep YOUR_DOMAIN frontend/nginx.conf` 无输出。

- [ ] **Step 3: scp 上传到服务器**

```bash
ssh root@ECS_IP 'mkdir -p /opt/mall'
scp mall-images.tar.gz root@ECS_IP:/opt/mall/
scp Backend/docker-compose.prod.yml root@ECS_IP:/opt/mall/
scp -r Backend/sql   root@ECS_IP:/opt/mall/
scp -r Backend/certs root@ECS_IP:/opt/mall/
scp Backend/.env     root@ECS_IP:/opt/mall/
```
Expected: `ssh root@ECS_IP 'ls /opt/mall'` 列出全部文件。

- [ ] **Step 4: 服务器加载镜像并启动**

```bash
ssh root@ECS_IP
cd /opt/mall
gunzip -c mall-images.tar.gz | docker load
docker images | grep -E "mall-admin|mall-frontend"
docker compose -f docker-compose.prod.yml up -d
```
Expected: 两个业务镜像已 load；`docker compose ... ps` 五个服务陆续 running。

- [ ] **Step 5: 等待后端就绪并验证反代**

```bash
until curl -skf -o /dev/null https://真实域名/api/admin/info; do echo waiting; sleep 3; done; echo "后端就绪"
```
Expected: 约 60–90s 后打印“后端就绪”（`/api/admin/info` 返回 401 也算反代通，`-f` 会失败则改看 `curl -sk https://真实域名/api/admin/info` 有 JSON 响应即可）。

- [ ] **Step 6: 数据库初始化校验**

```bash
docker exec mall-mysql mysql -uroot -p"$(grep DB_PASSWORD .env | cut -d= -f2)" -e "use mall; show tables;" | wc -l
```
Expected: 输出 ≥ 31（31 张表 + 表头）。

- [ ] **Step 7: 端到端功能验证**

1. 浏览器打开 `https://真实域名`，用 `admin / 123456` 登录后台。
2. 上传一张商品图，确认返回 URL 形如 `https://真实域名/mall-files/mall/<日期>/<文件名>` 且图片正常显示。
3. `docker stats --no-stream` 确认无容器逼近各自 `mem_limit`；`free -h` 看 swap 使用是否失控。

Expected: 登录成功、图片可显示、内存无持续爆表。

---

## 附：回滚与更新

- **更新代码**：本机重跑 Task 5（构建+导出）→ Task 7 Step 3–4（上传+load+`up -d`）。compose 只重建镜像变化的容器，数据卷保留。
- **回滚**：保留上一版 tar（如 `mall-admin:1.0` 换 tag `:0.9`），`docker load` 旧包并把 compose 的 `image:` tag 改回后 `up -d`。
- **证书续期**：替换 `certs/` 下文件后 `docker compose -f docker-compose.prod.yml restart nginx`。
