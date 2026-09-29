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
└── docs/                      # 架构与接口文档
```