# mall 电商系统

一套电商全栈项目，包含两大部分：

- **后台管理端**：Spring Boot 后端（`mall-admin`）+ React 管理前端（`frontend`），覆盖商品（PMS）、订单（OMS）、营销（SMS）、权限（UMS）等模块。
- **用户端 H5 商城**：React + antd-mobile 移动端（`h5`），面向 C 端购物流程（首页 / 分类 / 商品 / 购物车 / 下单 / 支付 / 我的）。

> 接口文档见 [`docs/apis/API_DOC.md`](docs/apis/API_DOC.md)，架构说明见 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)。

## 技术架构

```
┌──────────────────┐                        ┌──────────────────┐
│ 管理前端 (Nginx)  │ ── /api/ 反代 ───────▶ │                  │
│ React + AntD     │                        │  mall-admin :8082 │
└──────────────────┘                        │  Spring Boot      │
┌──────────────────┐                        │                  │
│ H5 商城 (Vite)    │ ── (mall-portal :8085 └────────┬─────────┘
│ React + antd-mobile   规划中，当前走 mock)          │
└──────────────────┘                                 │
                            ┌───────────────┬─────────┴─────┬──────────────┐
                            ▼               ▼               ▼              ▼
                      MySQL 8 (远程)     Redis :6379     MinIO :9000    JWT 鉴权
```

### 后端（`Backend/`）

Maven 聚合工程，Spring Boot 2.7.5 / JDK 8：

| 模块 | 职责 |
|---|---|
| `mall-admin` | 唯一可运行服务，后台管理 API，端口 `8082` |
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

> 当前默认走前端 mock（`VITE_USE_MOCK=true`）。真实后端 `mall-portal`（端口 `8085`）规划中，就绪后在 `h5/.env.*` 里将 `VITE_USE_MOCK` 置 `false` 并配置 `VITE_API_BASE_URL`。

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

> 当前生产部署覆盖 `mall-admin`（后端）+ `mall-frontend`（Nginx）+ Redis + MinIO；`mall-portal` 与 `h5` 暂未纳入线上脚本。
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

在 `mall/` 根目录执行（二选一）：

```bash
# 全栈：前端 + 后端 + Redis + MinIO，服务器 80 端口对外
bash deploy-fullstack.sh

# 仅后端：mall-admin + Redis + MinIO（8082 仅映射到服务器回环，用于验证）
bash deploy-backend.sh
```

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
│   ├── mall-admin/            # 可运行服务
│   ├── mall-common/ mall-mbg/ mall-security/
│   ├── sql/                   # 建表与初始数据
│   └── Dockerfile
├── frontend/                  # React 后台管理前端
│   ├── src/                   # api / components / layout / pages / router / store
│   ├── nginx.conf             # 生产 Nginx（HTTPS）
│   ├── nginx.local.conf       # 本地 Nginx（HTTP，反代 /api → mall-admin）
│   └── Dockerfile
├── h5/                        # React + antd-mobile 用户端商城
│   └── src/                   # api / components / layout / mock / pages / router / store / types
├── docker-compose.local.yml   # 本地全栈一键启动
├── deploy-fullstack.sh        # 一键发布【前端+后端】到京东云 ECS
├── deploy-backend.sh          # 一键发布【仅后端】到京东云 ECS
└── docs/                      # 架构与接口文档（含交叉编译与部署手册）
```