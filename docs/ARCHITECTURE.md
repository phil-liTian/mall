# mall 电商系统架构图

> 参考开源项目 [macrozheng/mall](https://github.com/macrozheng/mall) 及其配套前端 mall-admin-web、mall-app-web 的实现逻辑整理。
> 三个参考项目位于 `0resource/` 下：`mall`（后端）、`mall-admin-web`（后台管理前端）、`mall-app-web`（移动端商城前端）。

## 1. 系统总览

后端为一套 Maven 聚合工程，拆分出 3 个可运行服务（admin / portal / search）+ 3 个共享库（common / mbg / security）。前端分两套：PC 后台管理（Vue3 + Element Plus）与移动端商城（uni-app + Vue3），分别对接 admin 与 portal 服务。

```mermaid
graph TB
    subgraph Client["客户端层"]
        AdminWeb["mall-admin-web<br/>后台管理前端<br/>Vue3 + ElementPlus + Vite"]
        AppWeb["mall-app-web<br/>移动端商城前端<br/>uni-app + Vue3 (H5/App/小程序)"]
    end

    subgraph Service["后端服务层 (可运行应用)"]
        Admin["mall-admin<br/>后台管理 API :8082"]
        Portal["mall-portal<br/>门户商城 API :8085"]
        Search["mall-search<br/>商品搜索 API :8081"]
    end

    subgraph Shared["共享库 (被依赖, 不可独立运行)"]
        Security["mall-security<br/>SpringSecurity + JWT + RBAC"]
        Mbg["mall-mbg<br/>MyBatis Generator<br/>76 Mapper + 76 Model"]
        Common["mall-common<br/>通用响应/Redis封装/Swagger/AOP"]
    end

    subgraph Infra["数据与中间件"]
        MySQL[("MySQL 5.7 :3306")]
        Redis[("Redis :6379")]
        Mongo[("MongoDB :27017")]
        ES[("Elasticsearch :9200")]
        MQ[("RabbitMQ :5672")]
        Minio[("MinIO/OSS :9000")]
        Alipay["支付宝 SDK"]
    end

    AdminWeb -->|"Axios / Bearer Token"| Admin
    AppWeb -->|"uni.request / Bearer Token"| Portal
    Portal -.->|"商品搜索"| Search

    Admin --> Security
    Portal --> Security
    Admin --> Mbg
    Portal --> Mbg
    Search --> Mbg
    Security --> Common
    Mbg --> Common

    Admin --> MySQL
    Portal --> MySQL
    Admin --> Redis
    Portal --> Redis
    Admin --> Minio
    Portal --> Mongo
    Portal --> MQ
    Portal --> Alipay
    Search --> ES
```

## 2. 后端模块依赖关系

```mermaid
graph LR
    Admin["mall-admin ★可运行"] --> Security["mall-security"]
    Portal["mall-portal ★可运行"] --> Security
    Admin --> Mbg["mall-mbg"]
    Portal --> Mbg
    Search["mall-search ★可运行"] --> Mbg
    Demo["mall-demo (演示)"] --> Mbg
    Security --> Common["mall-common (最底层)"]
    Mbg --> Common
```

| 模块 | 类型 | 职责 |
|------|------|------|
| mall-common | 共享库 | 通用响应封装 `CommonResult`、Redis 封装、Swagger 配置、AOP 日志 |
| mall-mbg | 共享库 | MyBatis Generator 生成的 76 个 Mapper + 76 个实体 model，对应 MySQL 表 |
| mall-security | 共享库 | Spring Security + JWT 认证、动态权限（RBAC）共享逻辑 |
| mall-admin | ★可运行 | 后台管理 REST API（31 Controller），文件上传 MinIO/OSS |
| mall-portal | ★可运行 | 用户端门户商城 REST API，含订单/支付/MongoDB/RabbitMQ |
| mall-search | ★可运行 | Elasticsearch 商品搜索服务 |
| mall-demo | 演示 | 框架演示，非生产 |

## 3. 后端分层结构（以 mall-admin 为例）

```mermaid
graph TB
    C["controller 控制层<br/>接收请求 / 返回 CommonResult"]
    S["service + service.impl 业务层"]
    D["dao 自定义 Mapper (+XML)<br/>复杂业务查询"]
    M["mall-mbg mapper 生成层<br/>单表 CRUD"]
    DB[("MySQL")]
    C --> S --> D --> DB
    S --> M --> DB
```

- 辅助包：`dto` / `bo` / `config` / `validator`
- portal 额外有：`repository`（MongoDB）、`component`（RabbitMQ 死信队列、支付、定时任务）、`domain`
- 分页统一用 PageHelper；接口文档 Springfox Swagger UI 3.0.0

## 4. 业务域划分

| 域 | 全称 | 覆盖业务 |
|----|------|----------|
| **pms** | Product Management | 商品、品牌、分类、属性/规格、SKU 库存 |
| **oms** | Order Management | 订单、发货、退货、超时取消、收货地址 |
| **ums** | User Management | 管理员/会员账号、角色、菜单、资源、RBAC、会员等级 |
| **sms** | Sales/Marketing | 优惠券、限时秒杀、首页广告/品牌/新品/推荐/专题 |
| **cms** | Content Management | 专题 Subject、编辑精选区 PreferenceArea |

## 5. 前端架构

### 5.1 mall-admin-web（后台管理）

- **技术栈**：Vue 3.5（Composition API）+ TypeScript 5.9 + Vite 7 + Element Plus 2.12；Vue Router 4（Hash）+ Pinia 3（持久化）+ Axios；ECharts、TinyMCE 富文本
- **分层**：`apis/`（按实体拆分接口）→ `utils/http`（Axios 实例）→ 后端；`views/`（按 pms/oms/sms/ums 分包）、`router/`（静态 + 异步权限路由）、`stores/`（user/permission/app）
- **对接后端**：mall-admin，`VITE_BASE_SERVER_URL`（dev `:8082`），未用 proxy 直连
- **鉴权**：登录 `/admin/login` 拿 `Bearer` token 存 Pinia + localStorage；拦截器注入 `Authorization`；登录后 `/admin/info` 取 roles+menus，按菜单动态 `addRoute`（RBAC）

### 5.2 mall-app-web（移动端商城）

- **技术栈**：uni-app 3 + Vue 3.5 + TypeScript + Vite 5；uni-ui；`pages.json` 声明式路由 + Pinia 2（持久化）；自封装 `uni.request` 的 http（非 axios）；vue-i18n
- **分层**：`apis/`（home/product/cart/order/member…）→ `utils/http`（`uni.addInterceptor` 拦截）→ 后端；`pages/`（按业务域分目录）、`stores/`（member/search）
- **对接后端**：mall-portal，`VITE_API_BASE_URL`（dev `:8085`），固定头 `source-client: miniapp`
- **鉴权**：登录 `/sso/login` 拿 `Bearer` token 存 `uni.storage`；拦截器注入 `Authorization`；401 清登录态跳登录
- **主导航**：首页 / 分类 / 购物车 / 会员中心（tabBar）；商品、品牌、订单支付、会员中心各功能页

## 6. 请求鉴权时序（通用）

```mermaid
sequenceDiagram
    participant U as 前端
    participant I as HTTP 拦截器
    participant B as 后端服务
    U->>B: 登录 (/admin/login 或 /sso/login)
    B-->>U: CommonResult { tokenHead, token }
    Note over U: token 持久化 (localStorage / uni.storage)
    U->>I: 发起业务请求
    I->>I: 注入 Authorization: Bearer {token}
    I->>B: 携带 token 请求
    B->>B: JWT 校验 + RBAC 鉴权
    alt 通过
        B-->>U: CommonResult { code:200, data }
    else 401 未授权
        B-->>U: code:401
        Note over U: 清 token, 跳转登录页
    end
```
