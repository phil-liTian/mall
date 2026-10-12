# mall 电商系统

线上访问地址：

| 端 | 地址 |
|---|---|
| 后台管理系统 | http://mall.starchase.xyz |
| H5 商城 | http://m.starchase.xyz |

一套电商全栈项目，包含两大部分：

- **后台管理端**：Spring Boot 后端（`mall-admin`）+ React 管理前端（`frontend`），覆盖商品（PMS）、订单（OMS）、营销（SMS）、权限（UMS）等模块。
- **用户端 H5 商城**：React + antd-mobile 移动端（`h5`），面向 C 端购物流程（首页 / 分类 / 商品 / 购物车 / 下单 / 支付 / 我的）。

> 接口文档见 [`docs/apis/API_DOC.md`](docs/apis/API_DOC.md)，架构说明见 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)。

## 技术架构

```
┌──────────────────┐                        ┌───────────────────┐
│ 管理前端 (Nginx)  │ ── /api/ 反代 ───────▶ │ mall-admin  :8082 │
│ React + AntD     │                        │ Spring Boot       │
└──────────────────┘                        └─────────┬─────────┘
┌──────────────────┐                        ┌─────────┴─────────┐
│ H5 商城 (Nginx)   │ ── /api/ 反代 ───────▶ │ mall-portal :8085 │
│ React+antd-mobile│                        │ Spring Boot       │
└──────────────────┘                        └─────────┬─────────┘
                            ┌───────────────┬─────────┴─────┬──────────────┐
                            ▼               ▼               ▼              ▼
                      MySQL 8 (远程)     Redis :6379     MinIO :9000    JWT 鉴权
```

### 后端（`Backend/`）

Maven 聚合工程，Spring Boot 2.7.5 / JDK 8：

| 模块 | 职责 |
|---|---|
| `mall-admin` | 后台管理 API，端口 `8082` |
| `mall-portal` | C 端商城 API，端口 `8085` |
| `mall-security` | Spring Security + JWT + RBAC 权限 |
| `mall-mbg` | MyBatis Generator 生成的 Mapper 与实体 |
| `mall-common` | 通用响应封装、Redis 封装、Swagger、AOP |

核心依赖：MyBatis + PageHelper、Druid 连接池、jjwt、MinIO、Redis、Springdoc（Swagger）、Hutool、Lombok。

### 管理前端（`frontend/`）

| 层 | 选型 |
|---|---|
| 框架 | React 18 + TypeScript 5.7 |
| 构建 | Vite 6 |
| 组件库 | Ant Design 5 + @ant-design/icons |
| 路由 | React Router 6 |
| 状态 | Zustand 5 |
| 请求 | axios（`/api` 前缀，Bearer Token） |
| Mock | mockjs + vite-plugin-mock |

### H5 用户商城（`h5/`）

| 层 | 选型 |
|---|---|
| 框架 | React 18 + TypeScript 5.7 |
| 构建 | Vite 6（`postcss-px-to-viewport` 适配移动端） |
| 组件库 | antd-mobile 5 + antd-mobile-icons |
| 路由 | React Router 6 |
| 状态 | Zustand 5 |
| 请求 | axios |
| Mock | vite-plugin-mock（默认开启） |

已实现页面：首页、分类、商品列表/详情/搜索/热销/新品、购物车、地址管理、下单、支付、订单列表/详情、登录/注册、个人中心。

> 已接真实后端 `mall-portal`（端口 `8085`），`h5/.env.*` 里 `VITE_USE_MOCK=false`；请求统一走 `/api` 前缀，由容器 Nginx 反代到 `mall-portal:8085`。

### 基础设施

- **MySQL 8**：远程库（`application-dev.yml` 中配置），本地不启动。
- **Redis 7**：缓存。
- **MinIO**：对象存储，文件上传（bucket `mall`）。

## 运行方式

### 方式一：Docker 一键启动（推荐）

同时拉起管理前端、H5、后端、Redis、MinIO 五个容器（MySQL 走远程库）：

```bash
cd mall
docker compose -f docker-compose.local.yml up -d --build
```

| 服务 | 地址 |
|---|---|
| 管理前端 | http://localhost:8088 |
| H5 商城 | http://localhost:8089 |
| 后端 API | http://localhost:8082 |
| Swagger | http://localhost:8082/swagger-ui/ |
| MinIO 控制台 | http://localhost:9101 （minioadmin / minioadmin） |

查看日志与停止：

```bash
docker logs -f mall-admin        # 后端日志
docker compose -f docker-compose.local.yml down   # 停止并移除容器
```

**单独重建/重启某个服务**（改了某个应用的代码后，只重建它，不影响其它容器）：

```bash
# 改了 h5 代码 → 只重建 H5（docker 托管的是生产构建产物，必须 --build 才生效）
docker compose -f docker-compose.local.yml up -d --build mall-h5

# 改了管理前端代码 → 只重建前端
docker compose -f docker-compose.local.yml up -d --build mall-frontend

# 改了后端代码 → 重建后端；注意后端换新容器后，需连带重建前端，否则 Nginx 缓存旧 IP 会 502
docker compose -f docker-compose.local.yml up -d --build mall-admin mall-portal mall-frontend mall-h5

# 不改代码只重启某个服务
docker compose -f docker-compose.local.yml restart mall-h5
```

> ⚠️ 避免用不带服务名的 `up -d --build`：它只重建镜像有变化的服务，`mall-admin` 换了新容器/新 IP 后 `mall-frontend` 不会被连带重建，旧 Nginx 仍指向失效的旧 IP，访问 `/api/` 会 **502 Bad Gateway**。要么像上面一样把前端一起列进重建命令，要么整体 `up -d --build --force-recreate`。

### 方式二：本地开发（分别启动）

**中间件**（Redis + MinIO）仍建议用 Docker 起：

```bash
cd Backend
docker compose up -d redis minio
```

**后端**（需本机 JDK 8 + Maven）：

```bash
cd Backend
mvn clean package -DskipTests
mvn spring-boot:run -pl mall-admin        # 默认 dev profile，端口 8082
```

**管理前端**（需 Node 20 + pnpm 9）：

```bash
cd frontend
pnpm install
pnpm dev                                   # Vite 开发服务器
```

**H5 商城**（需 Node 20 + pnpm 9）：

```bash
cd h5
pnpm install
pnpm dev                                   # 默认走 mock，无需后端
```

## 部署到远程服务器

生产环境部署到**京东云 ECS**（`root@111.228.13.106`，部署目录 `/opt/mall`，镜像 TAG `1.0`），MySQL 复用服务器已有实例（不容器化）。本机为 Apple Silicon（arm64），服务器为 amd64，因此需**交叉编译 amd64 镜像**后打包上传，由服务器 `docker load` 并用 `docker-compose.prod.yml` 启动。

> 当前生产部署覆盖 `mall-admin` + `mall-portal`（后端）+ `mall-frontend`（Nginx）+ Redis + MinIO；`h5` 用 `deploy-h5.sh` 单独发布。
> 详细原理与排错见 [`docs/交叉编译与上传部署.md`](docs/交叉编译与上传部署.md) 和 [`docs/京东云部署.md`](docs/京东云部署.md)。

### 前置条件（本机，一次性）

1. 填好 `Backend/.env`（数据库密码、`JWT_SECRET`、MinIO 密钥等真实值；参考 `Backend/.env.example`）。
2. 安装并初始化 buildx（Colima 的 docker CLI 不自带 buildx，需手动装）：

```bash
mkdir -p ~/.docker/cli-plugins
curl -fSL https://github.com/docker/buildx/releases/download/v0.19.3/buildx-v0.19.3.darwin-arm64 \
  -o ~/.docker/cli-plugins/docker-buildx
chmod +x ~/.docker/cli-plugins/docker-buildx
docker run --privileged --rm tonistiigi/binfmt --install amd64   # 注册 QEMU，支持跨架构
```

> 脚本会自动创建名为 `mallbuilder` 的 `docker-container` 驱动 builder，无需手动建。

### 一键发布

在 `mall/` 根目录执行：

```bash
# 全栈：前端 + 后端 + Redis + MinIO，服务器 80 端口对外
bash deploy-fullstack.sh

# 仅后端：mall-admin + mall-portal + Redis + MinIO（8082/8085 仅映射到服务器回环，用于验证）
bash deploy-backend.sh
```

**单独部署某个服务**（只重建该服务，不动其它容器，`--no-deps`）。前提：后端已先用上面的脚本部署并在运行：

```bash
# 只部署 C 端后端 → 重建容器 mall-portal（8085 仅回环，H5 经容器网络访问）
bash deploy-portal.sh

# 只部署管理前端 → 重建容器 nginx（绑 127.0.0.1:8080，宿主机 nginx 反代对外）
bash deploy-frontend.sh

# 只部署 H5 商城 → 重建容器 mall-h5（绑 127.0.0.1:8081，需在宿主机 nginx 配子域名反代）
bash deploy-h5.sh
```

> H5 生产用 `h5/nginx.conf`（构建时由脚本传 `NGINX_CONF=nginx.conf`），其 `/api` 反代到 `mall-portal:8085`。因此 **`mall-portal` 必须先在跑**，否则 `mall-h5` 容器 nginx 启动时解析不到 upstream 会直接失败。另外 `deploy-portal.sh` 换掉 portal 容器后其 IP 会变，需连带 `docker compose -f docker-compose.prod.yml restart mall-h5`，否则 `/api` 会 502（脚本结尾有提示命令）。
>
> `deploy-fullstack.sh` 目前仍只构建 `mall-admin + mall-frontend`，不含 portal；全栈发布后用 `deploy-portal.sh` 补上 portal。

脚本做的事：交叉构建 amd64 镜像 → 打包为 `mall-images.tar.gz` → `scp` 上传镜像 + `docker-compose.prod.yml` + `Backend/.env` → 服务器自动装 docker（若无）、建 2G swap 兜底 OOM、`docker load` 并 `docker compose -f docker-compose.prod.yml up -d`。

### 发布后

| 操作 | 命令 |
|---|---|
| 访问站点 | http://111.228.13.106 |
| 看后端日志（出现 `Started MallAdminApplication` 即就绪，约 60~90s） | `ssh root@111.228.13.106 'cd /opt/mall && docker compose -f docker-compose.prod.yml logs -f mall-admin'` |
| 查看容器状态 | `ssh root@111.228.13.106 'cd /opt/mall && docker compose -f docker-compose.prod.yml ps'` |

> ⚠️ 首次部署需在京东云控制台【安全组】放行 **80** 端口（后端连 MySQL 的 **3306** 通常已放行）。

## 目录结构

```
mall/
├── Backend/                   # Spring Boot 后端（多模块）
│   ├── mall-admin/            # 管理端服务（8082）
│   ├── mall-portal/           # C 端服务（8085）
│   ├── mall-common/ mall-mbg/ mall-security/
│   ├── sql/                   # 建表与初始数据
│   ├── Dockerfile             # mall-admin 镜像
│   └── Dockerfile.portal      # mall-portal 镜像
├── frontend/                  # React 后台管理前端
│   ├── src/                   # api / components / layout / pages / router / store
│   ├── nginx.conf             # 生产 Nginx（HTTPS）
│   ├── nginx.local.conf       # 本地 Nginx（HTTP，反代 /api → mall-admin）
│   └── Dockerfile
├── h5/                        # React + antd-mobile 用户端商城
│   └── src/                   # api / components / layout / mock / pages / router / store / types
├── docker-compose.local.yml   # 本地全栈一键启动
├── deploy-fullstack.sh        # 一键发布【前端+后端】到京东云 ECS
├── deploy-backend.sh          # 一键发布【仅后端 admin+portal】到京东云 ECS
├── deploy-portal.sh           # 一键发布【仅 C 端后端 mall-portal】到京东云 ECS
├── deploy-frontend.sh         # 一键发布【仅管理前端】到京东云 ECS
├── deploy-h5.sh               # 一键发布【仅 H5 商城】到京东云 ECS
└── docs/                      # 架构与接口文档（含交叉编译与部署手册）
```