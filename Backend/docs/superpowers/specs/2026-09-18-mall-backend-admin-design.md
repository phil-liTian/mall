# mall Backend 设计文档 — admin 阶段

> 基于 `0resource/mall`（macrozheng/mall）参考实现，重构包名为 `com.phil.mall`，实现商城后台管理 API。
> 阶段：1（admin）。后续阶段扩展 portal / search。

## 1. 范围与目标

**本阶段交付**：
- 3 个共享库：`mall-common` / `mall-mbg` / `mall-security`
- 1 个可运行服务：`mall-admin`（端口 8082）
- 13 个 Controller：UMS 6 个 + PMS 6 个 + MinIO 上传 1 个
- 接口路径与前端 `mall-admin-web` 100% 兼容

**不在本阶段**：OMS（订单）/ SMS（营销）/ CMS（内容）管理、`OssController`（阿里云 OSS）、mall-portal、mall-search、JUnit 集成测试。

**验收标准**：`docker compose up -d` 起中间件 → 构建 → 启动 admin → `POST /admin/login` 拿 token → 鉴权访问业务接口通 → Swagger UI 可用。

## 2. 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 核心框架 | Spring Boot | 2.7.5 |
| 语言 | Java | 1.8 |
| 安全 | Spring Security + jjwt | 0.9.1 |
| ORM | MyBatis + MyBatis Generator | 3.5.10 / 1.4.1 |
| 分页 | PageHelper | 5.3.2 |
| 连接池 | Druid | 1.2.14 |
| 数据库 | MySQL | 8.0（driver 8.0.29，兼容 5.7） |
| 缓存 | Redis（Lettuce） | 7.x |
| 对象存储 | MinIO SDK | 8.4.5 |
| API 文档 | springdoc-openapi | 1.6.14 |
| 工具 | Hutool / Lombok | 5.8.9 / 1.18.30 |

## 3. 整体架构

```
mall/Backend/
├── pom.xml                          # Maven 聚合根
├── docker-compose.yml               # MySQL+Redis+MinIO 一键拉起
├── README.md
├── docs/RUN.md                      # 冒烟验证清单
├── sql/mall-admin.sql               # 31 表 DDL + 初始数据
├── mall-common/                     # 通用库（最底层）
├── mall-mbg/                        # MyBatis Generator 生成层
├── mall-security/                   # SpringSecurity + JWT + RBAC
└── mall-admin/                      # ★可运行 :8082
```

**模块依赖**：
```
mall-admin ──► mall-security ──► mall-common
mall-admin ──► mall-mbg ──► mall-common
```

**包名**：统一 `com.phil.mall`（参考项目为 `com.macro.mall`）。

## 4. mall-common 模块

**职责**：最底层共享库，被 mbg / security / admin 依赖。通用基础设施，无业务逻辑。

**包结构**（`com.phil.mall.common`）：

| 子包 | 内容 |
|----|------|
| `api` | `CommonResult<T>`（code/msg/data）、`CommonPage`（配合 PageHelper）、`ResultCode`（状态码枚举） |
| `exception` | `ApiException`、`GlobalExceptionHandler`（@ControllerAdvice 统一异常→CommonResult） |
| `log` | `@Log` 注解 + `WebLogAspect`（AOP 记录请求参数/响应/耗时） |
| `service` | `RedisService`（封装 RedisTemplate 的 get/set/expire/incr/delete/hash） |
| `config` | `RedisConfig`（RedisTemplate 序列化配置）、`OpenApiConfig`（springdoc 全局配置 + JWT SecurityScheme） |

**关键决策**：
- `JwtTokenUtil` 留在 **mall-security/util**（与 JWT 过滤器强耦合，不下沉 common）
- Swagger 配置类 `OpenApiConfig` 放 common，各服务通过 `springdoc.packages-to-scan` 控制扫描范围
- common 不依赖任何其他 mall 模块

## 5. mall-security 模块

**职责**：Spring Security + JWT + 动态 RBAC 权限共享逻辑，被 admin 依赖。

**包结构**（`com.phil.mall.security`）：

| 子包 | 类 |
|----|----|
| `config` | `SecurityConfig`（WebSecurityConfigurerAdapter，白名单/JWT 过滤器链/AuthenticationManager/BCryptPasswordEncoder） |
| `component` | `JwtAuthenticationTokenFilter`（OncePerRequestFilter，解析 token→注入 SecurityContext）、`RestAuthenticationEntryPoint`（401 JSON）、`RestfulAccessDeniedHandler`（403 JSON）、`DynamicSecurityService`（接口）、`DynamicSecurityFilter`、`DynamicAccessDecisionManager` |
| `annotation` | `@IgnoreAuth`（标记接口免鉴权） |
| `util` | `JwtTokenUtil`（generate/validate/getClaimsFromToken/isTokenExpired）、`SpringUtil` |

**动态权限机制**：
- `DynamicSecurityFilter` 以 `addFilterBefore` 插入到 `FilterSecurityInterceptor` 之前
- 启动时 `DynamicSecurityService.loadDataSource()` 加载 `ums_resource` 全量 url→权限映射到 `Map<String, ConfigAttribute>` 缓存
- 请求时用 `AntPathMatcher` 匹配 URI，命中则校验当前用户权限

**DynamicSecurityService 实现**：admin 模块提供 `DynamicSecurityServiceImpl`，注入 `UmsResourceService`，启动时 `@PostConstruct` 加载到 Redis，权限变更时刷新缓存。

**白名单**：放 `application.yml` 的 `secure.ignored.urls` 配置项（非硬编码），灵活可控。

**JWT 流程**：
1. `POST /admin/login` → `UmsAdminService.login()` 校验密码 → `JwtTokenUtil.generateToken()` → 返回 `{tokenHead:"Bearer", token:"xxx"}`
2. 后续请求 `Authorization: Bearer xxx` → `JwtAuthenticationTokenFilter` 解析 → 注入 `Authentication`
3. `DynamicSecurityFilter` 校验 URI 权限
4. 失败 → 401（未登录/失效）或 403（已登录无权限）

## 6. mall-mbg 模块

**职责**：MyBatis Generator 生成的纯数据访问层，单表 CRUD。被 admin 依赖。

**包结构**（`com.phil.mall.mbg`）：

| 子包 | 内容 |
|----|------|
| `model` | 31 个实体类（如 `UmsAdmin` `PmsProduct`），与表一一对应 |
| `mapper` | 31 个 Mapper 接口 |
| `config` | `MyBatisConfig`（`@MapperScan("com.phil.mall.mbg.mapper")`） |

**资源文件**：
- `src/main/resources/generatorConfig.xml` — 31 表生成配置，所有 `enable*ByExample` 设 false
- `src/main/resources/generator.properties` — 数据库连接信息
- `src/main/resources/mapper/*.xml` — 31 个 mapper XML（生成到源码目录，打包进 jar）

**生成命令**：`mvn -pl mall-mbg mybatis-generator:generate`（需先起 MySQL）

**Maven 插件**：`mybatis-generator-maven-plugin:1.4.1` + `mysql-connector-java:8.0.29`

## 7. mall-admin 模块

**职责**：后台管理 REST API 可运行服务，端口 8082。UMS + PMS + MinIO 上传。

**包结构**（`com.phil.mall`）：

| 子包 | 内容 |
|----|------|
| `controller` | 13 个 Controller |
| `service` + `service/impl` | 13 个 Service 接口 + 实现 |
| `dao` | 自定义 Mapper（mbg 之外的复杂查询） |
| `bo` | `AdminUserDetails`（UserDetails）、`UmsAdminParam`、`UmsAdminLoginParam`、`UpdateAdminPasswordParam` |
| `dto` | `UmsAdminLoginResult`（tokenHead+token）等 |
| `config` | `MallAdminApplication`（启动类）、`DynamicSecurityServiceImpl`、`MinIoConfig`、`PageHelperConfig` |
| `validator` | `FlagValidator`（自定义校验注解，状态字段 0/1） |

**接口清单**（路径与 `docs/apis/API_DOC.md` 一致，与前端 100% 兼容）：

| Controller | 基础路径 | 主要操作 |
|----|------|------|
| UmsAdminController | `/admin` | register/login/logout/refreshToken/info/list/{id}/update/updatePassword/delete/updateStatus/role |
| UmsRoleController | `/role` | create/update/delete/listAll/list/updateStatus/listMenu/listResource/allocMenu/allocResource |
| UmsMenuController | `/menu` | create/update/{id}/delete/list/{parentId}/treeList/updateHidden |
| UmsResourceController | `/resource` | create/update/{id}/delete/list/listAll |
| UmsResourceCategoryController | `/resourceCategory` | listAll/create/update/delete |
| UmsMemberLevelController | `/memberLevel` | list/create/update/delete |
| PmsProductController | `/product` | create/update/delete/list/{id} + updatePublishStatus/updateNewStatus/updateRecommendStatus/updateVerifyStatus/updateDeleteStatus |
| PmsBrandController | `/brand` | create/update/delete/list/{id}/updateShowStatus/updateFactoryStatus |
| PmsProductCategoryController | `/productCategory` | create/update/delete/list/{parentId}/{id}/updateShowStatus/updateNavStatus |
| PmsProductAttributeController | `/product/attribute` | create/update/delete/list/{cid} + attrInfo/{productCategoryId} |
| PmsProductAttributeCategoryController | `/productAttribute/category` | create/update/delete/list/createCate |
| PmsSkuStockController | `/skuStock` | /{pid}/list + /{pid}/update |
| MinioController | `/minio` | /upload |

**关键技术点**：
1. **登录**：BCrypt 校验 → `JwtTokenUtil.generateToken` → 写 `ums_admin_login_log` → 返回 `{tokenHead,token}`
2. **权限缓存**：`DynamicSecurityServiceImpl` `@PostConstruct` 加载 `ums_resource` 全量 url→权限到 Redis
3. **分页**：Controller 调 `PageHelper.startPage(pageNum,pageSize)` 紧接 mbg Mapper 查询，返回 `CommonPage`
4. **商品保存**：`PmsProductServiceImpl.create/update` `@Transactional` 一次性写 `pms_product` + `pms_sku_stock` + `pms_member_price` + `pms_product_ladder` + `pms_product_full_reduction` + `pms_product_attribute_value`
5. **MinIO 上传**：`MultipartFile` → `MinioClient.putObject` → 返回访问 URL（bucket 公开读）

**application.yml 关键配置**：
```yaml
server:
  port: 8082
spring:
  profiles:
    active: dev
  datasource:
    url: jdbc:mysql://localhost:3306/mall?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
    type: com.alibaba.druid.pool.DruidDataSource
  redis:
    host: localhost
    port: 6379
    database: 0
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 100MB

jwt:
  secret: phil-mall-secret-key-2026-need-32-chars
  expiration: 604800
  tokenHead: Bearer

secure:
  ignored:
    urls:
      - /admin/login
      - /admin/register
      - /swagger-ui/**
      - /v3/api-docs/**
      - /druid/**
      - /actuator/**
      - /minio/**

minio:
  endpoint: http://localhost:9000
  access-key: minioadmin
  secret-key: minioadmin
  bucket: mall

mybatis:
  mapper-locations: classpath:mapper/*.xml,classpath*:mapper/*.xml

springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui/index.html
    packages-to-scan: com.phil.mall.controller
```

**启动类**：`MallAdminApplication`，`@SpringBootApplication(scanBasePackages = {"com.phil.mall","com.phil.mall.security","com.phil.mall.mbg"})` + `@EnableAspectJAutoProxy` + `@EnableTransactionManagement`。

## 8. 数据库

**来源**：从 `0resource/mall/document/sql/mall.sql` 抽取本阶段所需表的 DDL + 初始数据，生成 `Backend/sql/mall-admin.sql`。

**31 张表清单**：

| 域 | 表 |
|----|----|
| UMS | `ums_admin` `ums_role` `ums_menu` `ums_resource` `ums_resource_category` `ums_permission` `ums_role_menu_relation` `ums_role_resource_relation` `ums_role_permission_relation` `ums_admin_role_relation` `ums_admin_permission_relation` `ums_member_level` |
| PMS | `pms_product` `pms_brand` `pms_product_category` `pms_product_attribute` `pms_product_attribute_category` `pms_product_attribute_value` `pms_product_category_attribute_relation` `pms_sku_stock` `pms_member_price` `pms_product_ladder` `pms_product_full_reduction` `pms_feight_template` `pms_album` `pms_album_pic` `pms_comment` `pms_comment_replay` `pms_product_operate_log` `pms_product_vertify_record` |

**初始数据**：超级管理员账号（密码 BCrypt 加密 `123456`）、基础角色、根菜单、根资源分类。

**docker-compose.yml**：
- MySQL 8.0：端口 3306，root/root，库 mall，挂载 `./sql/mall-admin.sql` 到 `/docker-entrypoint-initdb.d/` 自动导入
- Redis 7：端口 6379
- MinIO：端口 9000（API）+ 9001（Console），minioadmin/minioadmin，自动创建 bucket `mall`

## 9. 错误处理

`GlobalExceptionHandler`（common 模块）捕获：
- `ApiException`（业务异常）→ code 500
- `MethodArgumentNotValidException`（参数校验）→ code 400
- `UnauthorizedException` / `AccessDeniedException` → 401 / 403
- `Exception`（兜底）→ code 500

Service 层 `throw new ApiException("用户名或密码错误")` 等。`CommonResult.validateFailed(msg)` 统一参数校验失败返回。

## 10. 测试与验收

**不引入测试框架**，靠冒烟清单验收（ponytail 风格）。`docs/RUN.md`：

1. `docker compose up -d` 起中间件
2. `mvn clean install -DskipTests` 构建聚合工程
3. `mvn -pl mall-mbg mybatis-generator:generate` 生成 Mapper（首次）
4. `mvn -pl mall-admin spring-boot:run` 启动 admin
5. curl 验证：
   - `POST /admin/login` 拿 token
   - `GET /admin/info` 鉴权通过
   - `GET /product/list` 业务接口通
   - 访问 `http://localhost:8082/swagger-ui/index.html` 看 API 文档

**不写 JUnit 的理由**：参考项目测试薄弱，本阶段以"跑通 + 接口兼容前端"为验收，避免过度工程化。

## 11. 交付物

```
mall/Backend/
├── pom.xml                          # 聚合根
├── docker-compose.yml               # 中间件
├── README.md                        # 启动步骤
├── docs/RUN.md                      # 冒烟验证清单
├── sql/mall-admin.sql               # 31 表 DDL + 初始数据
├── mall-common/   (pom + src)
├── mall-mbg/      (pom + src + generatorConfig)
├── mall-security/ (pom + src)
└── mall-admin/    (pom + src + application.yml)
```

## 12. 后续阶段

- 阶段 2：OMS 订单 / SMS 营销 / CMS 内容管理 Controller
- 阶段 3：mall-portal 门户商城 API（订单/支付/MongoDB/RabbitMQ）
- 阶段 4：mall-search 商品搜索（Elasticsearch）
- JUnit 集成测试随业务稳定后补
