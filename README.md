# mall 电商后台管理系统

一套电商后台管理系统，包含**可独立运行的后台管理端**：Spring Boot 后端（`mall-admin`）+ React 前端，覆盖商品（PMS）、订单（OMS）、营销（SMS）、权限（UMS）等模块的管理功能。

> 接口文档见 [`docs/apis/API_DOC.md`](docs/apis/API_DOC.md)。

## 技术架构

```
┌─────────────────┐      /api/  反代      ┌──────────────────┐
│  前端 (Nginx)    │ ───────────────────▶ │  mall-admin :8082 │
│  React + AntD    │                       │  Spring Boot      │
└─────────────────┘                       └────────┬─────────┘
                                                    │
                            ┌───────────────┬───────┴───────┬──────────────┐
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

### 前端（`frontend/`）

| 层 | 选型 |
|---|---|
| 框架 | React 18 + TypeScript 5.7 |
| 构建 | Vite 6 |
| 组件库 | Ant Design 5 + @ant-design/icons |
| 路由 | React Router 6 |
| 状态 | Zustand 5 |
| 请求 | axios（`/api` 前缀，Bearer Token） |
| Mock | mockjs + vite-plugin-mock |

### 基础设施

- **MySQL 8**：远程库（`application-dev.yml` 中配置），本地不启动。
- **Redis 7**：缓存。
- **MinIO**：对象存储，文件上传（bucket `mall`）。

## 运行方式

### 方式一：Docker 一键启动（推荐）

同时拉起前端、后端、Redis、MinIO 四个容器（MySQL 走远程库）：

```bash
cd mall
docker compose -f docker-compose.local.yml up -d --build
```

| 服务 | 地址 |
|---|---|
| 前端 | http://localhost:8088 |
| 后端 API | http://localhost:8082 |
| Swagger | http://localhost:8082/swagger-ui/ |
| MinIO 控制台 | http://localhost:9101 （minioadmin / minioadmin） |

查看日志与停止：

```bash
docker logs -f mall-admin        # 后端日志
docker compose -f docker-compose.local.yml down   # 停止并移除容器
```

### 方式二：本地开发（前后端分别启动）

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

**前端**（需 Node 20 + pnpm 9）：

```bash
cd frontend
pnpm install
pnpm dev                                   # Vite 开发服务器
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
├── docker-compose.local.yml   # 本地全栈一键启动
└── docs/                      # 架构与接口文档
```
