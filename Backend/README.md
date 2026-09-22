# mall 商城后端（admin 阶段）

商城后端核心功能，第一阶段聚焦后台管理（mall-admin）。

## 技术栈

- Spring Boot 2.7.5 + JDK 8（实测 JDK 11 亦可）
- Spring Security + JWT（jjwt 0.9.1）+ 动态 RBAC
- MyBatis + MyBatis Generator + PageHelper 分页
- Druid 连接池、Redis（Lettuce）、MinIO 对象存储
- springdoc-openapi 1.6.14（替代参考项目的 Springfox 3.0.0）
- Hutool、Lombok、MySQL 8

## 模块

| 模块 | 说明 |
|------|------|
| `mall-common` | 通用类：CommonResult/CommonPage、全局异常、WebLog 切面、Redis 基类、OpenAPI 基类 |
| `mall-mbg` | MyBatis Generator 产物：31 张表（UMS+PMS）的 model/example/mapper |
| `mall-security` | 安全模块：JWT 过滤器、动态权限过滤器、SecurityConfig |
| `mall-admin` | 后台服务（端口 8082），13 个 Controller，覆盖 UMS + PMS 商品 CRUD |

## 业务范围（本阶段）

- **UMS**：管理员 / 角色 / 菜单 / 权限 / 资源 / 资源分类 / 会员等级
- **PMS**：商品 / 品牌 / 商品分类 / 商品属性 / 属性分类 / SKU 库存
- **不含**：OMS（订单）、SMS（营销）、CMS（内容）；MinIO 替代阿里云 OSS

## 包名

统一为 `com.phil.mall`。

## 快速开始

### 方式一：Docker Compose 一键启动（推荐，全容器化）

`docker-compose.yml` 已包含 `mall-admin` + `mysql` + `redis` + `minio` 四个服务，一条命令即可拉起整套环境（mall-admin 会自动多阶段构建镜像）。

```bash
cd Backend
docker compose up -d --build          # 首次构建并启动全部服务
```

Spring Boot 启动需约 60~70 秒（连接数据库 + 加载 Spring Security）。**不要在启动完成前访问接口**，否则会收到 `ERR_EMPTY_RESPONSE`。用下面命令等待就绪：

```bash
until curl -sf -o /dev/null http://localhost:8082/swagger-ui/index.html; do sleep 3; done && echo "mall-admin 已就绪"
```

常用运维命令：

```bash
docker compose logs -f mall-admin     # 跟踪应用日志
docker compose up -d --build mall-admin   # 改代码后仅重建 mall-admin
docker compose down                   # 停止并移除全部容器
```

> 数据库说明：mall-admin 默认连接 `application-dev.yml` 中配置的远程 MySQL，compose 内的 `mysql` 容器仅作备用，不影响启动。

完整容器化部署流程（构建、就绪等待、验证、更新回滚、故障排查）见 [docs/DEPLOY.md](docs/DEPLOY.md)。

### 方式二：本地开发（IDE / mvn 运行）

仅用容器跑中间件，应用在本机启动，便于断点调试：

```bash
cd Backend
docker compose up -d mysql redis minio   # 只启动中间件
mvn clean install -DskipTests
cd mall-admin && mvn spring-boot:run
```

详细启动与冒烟测试步骤见 [docs/RUN.md](docs/RUN.md)。

### 停止项目

**方式一（Docker Compose）**：

```bash
cd Backend
docker compose stop                   # 仅停止容器，保留容器与数据卷（下次 start 秒起）
docker compose start                  # 重新启动已停止的容器

docker compose down                   # 停止并移除全部容器（数据卷保留）
docker compose down -v           # 连同数据卷一起删除（MySQL/MinIO 数据清空，慎用）

docker compose stop mall-admin        # 只停某个服务
```

**方式二（本地 mvn 运行）**：在运行 `mvn spring-boot:run` 的终端按 `Ctrl + C` 结束应用，再按需 `docker compose stop` 停掉中间件容器。

### 故障排查：Docker daemon 连不上

若报 `Cannot connect to the Docker daemon at unix:///Users/xxx/.colima/default/docker.sock`，说明本机 Docker 运行时是 **Colima** 且进入了僵尸状态（`colima list` 显示 Running 但 `docker info` 连不上）。执行：

```bash
colima stop --force && colima start   # 单独 colima start 在僵尸态无效，须先强制停
```

## 默认账号

- 用户名 `admin` / 密码 `123456`（BCrypt 加密）
- 超级管理员角色，拥有全部权限

## 接口文档

启动后访问：`http://localhost:8082/swagger-ui/index.html`

## API 路径兼容性

与 mall-admin-web 前端 **100% 路径兼容**（`/admin/**`、`/brand/**`、`/product/**` 等），白名单路径在 `application.yml` 的 `secure.ignored.urls` 配置。

## 目录结构

```
Backend/
├── pom.xml                 # 聚合 POM
├── docker-compose.yml      # mall-admin + MySQL8 + Redis7 + MinIO
├── Dockerfile              # mall-admin 多阶段构建
├── settings-docker.xml     # 构建时 Maven 阿里云镜像
├── .dockerignore
├── sql/
│   └── mall-admin.sql      # 31 张表 DDL + 初始数据
├── docs/
│   └── RUN.md              # 启动与冒烟测试
├── mall-common/
├── mall-mbg/
├── mall-security/
└── mall-admin/
    └── src/main/
        ├── java/com/phil/mall/
        │   ├── controller/     # 13 个
        │   ├── service/        # 13 接口 + 13 实现
        │   ├── dao/            # 13 个 + XML
        │   ├── dto/            # 15 个
        │   ├── bo/             # AdminUserDetails
        │   ├── config/         # MyBatis/Security/Cors/OpenApi
        │   └── MallAdminApplication.java
        └── resources/
            ├── application.yml
            ├── application-dev.yml
            └── dao/*.xml
```

## 说明

- 不写 JUnit 单测，采用手动冒烟测试清单（ponytail 风格）
- JWT secret 硬编码在 `application.yml`（开发用，生产请外置）
- `ponytail:` 注释标注了相对参考项目的简化/裁剪点
