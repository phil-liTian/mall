# mall 京东云 Docker 部署设计

日期：2026-09-21
状态：待实施

## 1. 背景与目标

把 mall 项目（Spring Boot 后端 `mall-admin` + React/Vite 前端）部署到**一台京东云 ECS**，用 `docker compose` 全容器化运行，对外经域名 + HTTPS 访问。

### 服务器约束（已确认）

| 项 | 值 | 影响 |
|----|----|----|
| 系统 | Ubuntu 24.04 64位 UEFI | amd64 架构 |
| CPU | 2 核 | 不能跑重构建 |
| 内存 | 2 GB | **硬约束**：全容器运行会超重，必须 swap + 卡内存 |
| 带宽 | 3 Mbps | 首次拉镜像慢，需镜像加速 |

### 已确认决策

1. 部署载体：单台 ECS + docker-compose。
2. 中间件：MySQL / Redis / MinIO 全容器自建。
3. 前端：Nginx 容器托管静态文件 + 反代 `/api`。
4. 数据：全新初始化（首次启动执行 `sql/mall-admin.sql`）。
5. 对外：域名 + HTTPS（Nginx 终结 TLS）。
6. 镜像：**Mac 用 buildx 交叉构建 amd64 → `docker save` 成 tar → scp 上传 → 服务器 `docker load`**（不用镜像仓库；2GB 无法在服务器上跑 Maven 构建）。
7. 内存：加 swap + 每容器卡内存上限。

## 2. 目标架构

```
                公网：你的域名 (443 HTTPS / 80→跳443)
                          │
                   ┌──────▼───────┐
                   │  nginx 容器    │  ① 托管前端 SPA 静态文件
                   │  (仅它对外)    │  ② /api/**        → mall-admin:8082
                   │  TLS 终结      │  ③ /mall-files/** → minio:9000
                   └───┬───────┬──┘
                       │       │
              ┌────────▼──┐  ┌─▼────────┐
              │ mall-admin │  │  minio   │
              │   :8082    │  └──────────┘
              └──┬──────┬──┘
                 │      │
           ┌─────▼┐  ┌──▼────┐
           │mysql │  │ redis │
           └──────┘  └───────┘
```

- 只有 nginx 映射公网 80/443；其余服务只在 compose 内部网络 `mall-net` 通信，不暴露公网端口。
- nginx 容器即前端镜像（多阶段构建产物），同时承担静态托管、反代、TLS。

## 3. 详细改动清单

改动分两类：**代码/配置改动**（进 git）和**部署新增文件**（进 git，密钥除外）。不改动任何业务逻辑，唯一 Java 改动是 MinIO 图片 URL。

### 3.1 后端：生产 profile 与密钥外置

**新增 `Backend/mall-admin/src/main/resources/application-prod.yml`：**

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
  endpoint: http://minio:9000        # SDK 服务端连接（内网）
  publicUrl: ${MINIO_PUBLIC_URL}     # 浏览器可达的公网前缀，如 https://域名/mall-files
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

要点：数据源指向容器 `mysql`，Redis 指向 `redis`，MinIO SDK 走内网 `minio:9000`；密码/密钥全部环境变量注入。

### 3.2 后端：修 MinIO 图片公网 URL（唯一 Java 改动）

`Backend/mall-admin/src/main/java/com/phil/mall/controller/MinioController.java`

- 新增字段（默认回退到 endpoint，保证 dev 不受影响）：
  ```java
  @Value("${minio.publicUrl:${minio.endpoint}}")
  private String PUBLIC_URL;
  ```
- 第 77 行由 `ENDPOINT` 改为 `PUBLIC_URL`：
  ```java
  minioUploadDto.setUrl(PUBLIC_URL + "/" + BUCKET_NAME + "/" + objectName);
  ```

原因：现在返回的图片 URL = `endpoint/bucket/object`，若 endpoint 是内网 `minio:9000` 浏览器打不开。改用 publicUrl（`https://域名/mall-files`），配合 nginx 把 `/mall-files/` 反代到 minio，图片即公网可访问。

### 3.3 前端：关闭生产 mock

`frontend/vite.config.ts` 改为按命令区分（`enable` 仅在 dev `serve` 时为真）：

```ts
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    viteMockServe({ mockPath: 'src/mock', enable: command === 'serve' }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: { port: 5173, open: true },
}))
```

否则 `vite build` 会把 mock 打进产物，线上命中假数据。

### 3.4 前端：新增 Dockerfile（多阶段）

`frontend/Dockerfile`：

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

### 3.5 前端：nginx 配置

`frontend/nginx.conf`（HTTP→HTTPS 跳转 + TLS + SPA fallback + 两个反代）：

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
    client_max_body_size 12m;   # 与后端 max-file-size 10M 匹配，留余量

    # 前端 SPA
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://mall-admin:8082/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # MinIO 图片（浏览器公网访问，去掉 /mall-files 前缀转发给 minio）
    location /mall-files/ {
        proxy_pass http://minio:9000/;
        proxy_set_header Host $host;
    }
}
```

注意：`/api/` 反代 `proxy_pass` 结尾带 `/`，会把 `/api/admin/login` 转成后端 `/admin/login`，与后端路径 100% 兼容。前端 `baseURL='/api'` 无需改动。

### 3.6 编排：生产 compose

`Backend/docker-compose.prod.yml`（业务镜像用本地 `image:` tag、由 `docker load` 载入，非 build；卡内存；只 nginx 暴露端口）：

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

内存分配（caps 合计 ~1.76G + 系统 ~300M，靠 swap 兜底峰值）：MySQL 640M / mall-admin 512M(JVM 堆 384M) / MinIO 320M / Redis 192M / Nginx 96M。

### 3.7 密钥文件

- `Backend/.env`（**不进 git**）：
  ```
  DB_USERNAME=root
  DB_PASSWORD=<强密码>
  JWT_SECRET=<随机长字符串>
  MINIO_ACCESS_KEY=<key>
  MINIO_SECRET_KEY=<强密码>
  MINIO_PUBLIC_URL=https://YOUR_DOMAIN/mall-files
  ```
- `Backend/.env.example`（进 git，同结构占位值，供团队参考）。
- 在 `Backend/.gitignore` 追加 `.env`。

## 4. 镜像构建与传输完整方案

因 Mac(arm64) 与 ECS(amd64) 不兼容，且 2GB 不能在服务器构建，采用**本地交叉构建 → tar 传输 → 服务器加载**（不用镜像仓库）。

### 4.1 Mac 交叉构建 amd64 镜像（本地执行）

`buildx --load` 支持单平台交叉构建并载入本地 docker，随后 `docker save`。

```bash
docker buildx create --name mallbuilder --use     # 一次性

# 后端 amd64，载入本地
docker buildx build --platform linux/amd64 \
  -f Backend/Dockerfile \
  -t mall-admin:1.0 --load Backend

# 前端 amd64（构建上下文含 nginx.conf）
docker buildx build --platform linux/amd64 \
  -f frontend/Dockerfile \
  -t mall-frontend:1.0 --load frontend

# 校验架构应为 amd64
docker image inspect mall-admin:1.0 --format '{{.Architecture}}'   # 期望 amd64
docker image inspect mall-frontend:1.0 --format '{{.Architecture}}'
```

### 4.2 导出为 tar 并压缩（3Mbps 带宽必须压缩）

```bash
docker save mall-admin:1.0 mall-frontend:1.0 | gzip > mall-images.tar.gz
ls -lh mall-images.tar.gz     # 确认体积，压缩后一般几百 MB
```

### 4.3 scp 上传到服务器

```bash
scp mall-images.tar.gz root@ECS_IP:/opt/mall/
# 部署文件（compose、sql、证书、密钥）一并上传
scp Backend/docker-compose.prod.yml root@ECS_IP:/opt/mall/
scp -r Backend/sql   root@ECS_IP:/opt/mall/
scp -r Backend/certs root@ECS_IP:/opt/mall/      # 域名证书
scp Backend/.env     root@ECS_IP:/opt/mall/
```

### 4.4 服务器加载并运行

```bash
ssh root@ECS_IP
cd /opt/mall
gunzip -c mall-images.tar.gz | docker load     # 载入 mall-admin:1.0 + mall-frontend:1.0
docker images | grep mall                       # 确认两镜像已在本地
docker compose -f docker-compose.prod.yml up -d
```

compose 里 mall-admin/nginx 用本地 tag（`mall-admin:1.0`、`mall-frontend:1.0`），无 `build:`、无仓库地址，`docker load` 后直接就位。

### 4.5 基础镜像加速（3Mbps 必配）

mysql/redis/minio 三个基础镜像仍由服务器从公网拉取（未打进 tar）。服务器 `/etc/docker/daemon.json`：
```json
{ "registry-mirrors": ["https://<你的镜像加速地址>"] }
```
`systemctl restart docker` 生效。

> 也可选择把基础镜像一起打进 tar（`docker pull --platform linux/amd64 mysql:8.0 redis:7-alpine minio/minio:latest` 后一并 `docker save`），彻底免除服务器联网拉镜像；代价是 tar 体积增大、上传更久。默认走加速器方案。

### 4.6 后续更新（改代码后重新部署）

改代码后仅需重复：本地 4.1 构建对应镜像 → 4.2 save → 4.3 scp → 服务器 `docker load` → `docker compose -f docker-compose.prod.yml up -d`（compose 会用新镜像重建变化的容器，数据卷不受影响）。

## 5. 服务器一次性准备

```bash
# 1. 装 Docker + compose 插件（Ubuntu 24.04）
apt-get update && apt-get install -y docker.io docker-compose-v2

# 2. 建 4GB swap（2GB 内存必需）
fallocate -l 4G /swapfile && chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 3. 配镜像加速（见 4.4）
```

京东云控制台：**安全组放行 80、443**（22 保留 SSH），其余端口不开。域名 A 记录指向 ECS 公网 IP。

## 6. 证书

京东云「SSL 证书」服务申请免费 DV 证书 → 下载 **Nginx 格式** → 得到 `server.crt`（含证书链）和 `server.key` → 放服务器 `/opt/mall/certs/`（compose 挂载到 nginx `/etc/nginx/certs`）。

## 7. 部署验证清单

1. `docker compose -f docker-compose.prod.yml ps` 全部 running。
2. `docker exec mall-mysql mysql -uroot -p<pwd> -e "use mall; show tables;"` 有 31 张表。
3. 等后端就绪（约 60–90s）：`curl -k https://YOUR_DOMAIN/api/admin/info` 有响应（401 也算通，说明反代通了）。
4. 浏览器打开 `https://YOUR_DOMAIN`，用 `admin/123456` 登录后台。
5. 上传一张商品图，确认返回 URL 形如 `https://YOUR_DOMAIN/mall-files/mall/...` 且图片能显示。
6. `free -h` 看内存/ swap 使用，`docker stats` 确认无容器逼近 mem_limit。

## 8. 非目标（本次不做）

- 不改任何业务逻辑（唯一例外：MinIO 图片 URL 一行）。
- 不引入 CI/CD 流水线与镜像仓库（镜像本地 buildx 构建 → tar → scp → load，手动交付）。
- 不做多实例 / 高可用 / K8s。
- 不迁移历史数据（全新初始化）。
- dev 用的 `Backend/docker-compose.yml` 保留不动。

## 9. 风险

- **2GB 内存偏紧**：靠 swap 兜底，高并发下可能变慢或触发 OOM。若上线后 `docker stats` 常年逼近上限，建议升配 4GB 或将 MySQL 迁 RDS。
- **3Mbps 带宽**：首次拉镜像慢；用户访问图片经 nginx 回源 minio，大图较慢。
- **证书续期**：DV 证书通常一年，到期需重新签发并替换 `certs/` 后 `docker compose restart nginx`。
