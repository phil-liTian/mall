# mall Backend 实现计划 — admin 阶段

> 对应 spec：`2026-09-18-mall-backend-admin-design.md`

## 执行顺序

### 阶段 A：基础设施（先做，其他模块依赖）
1. `Backend/pom.xml` — Maven 聚合根，声明 4 模块 + 依赖版本管理
2. `Backend/docker-compose.yml` — MySQL8 + Redis7 + MinIO
3. `Backend/sql/mall-admin.sql` — 从 `0resource/mall/document/sql/mall.sql` 抽取 31 表 DDL + 初始数据

### 阶段 B：mall-common（最底层，无依赖）
4. `mall-common/pom.xml`
5. `api/`：CommonResult、CommonPage、ResultCode
6. `exception/`：ApiException、GlobalExceptionHandler
7. `log/`：@Log 注解、WebLogAspect
8. `service/`：RedisService
9. `config/`：RedisConfig、OpenApiConfig（springdoc）

### 阶段 C：mall-mbg（依赖 common）
10. `mall-mbg/pom.xml` + generatorConfig.xml + generator.properties
11. 从 `0resource/mall/mall-mbg` 拷贝 31 表对应的 model/mapper/xml，改包名 `com.macro.mall` → `com.phil.mall`
12. `MyBatisConfig`

### 阶段 D：mall-security（依赖 common）
13. `mall-security/pom.xml`
14. `config/SecurityConfig`
15. `component/`：JwtAuthenticationTokenFilter、RestAuthenticationEntryPoint、RestfulAccessDeniedHandler、DynamicSecurityService、DynamicSecurityFilter、DynamicAccessDecisionManager
16. `annotation/IgnoreAuth`
17. `util/`：JwtTokenUtil、SpringUtil

### 阶段 E：mall-admin（依赖三者）
18. `mall-admin/pom.xml` + application.yml + 启动类
19. UMS 层：bo/dto + 6 Controller + 6 Service + DynamicSecurityServiceImpl + dao
20. PMS 层：6 Controller + 6 Service + dao + bo
21. MinioController + MinIoConfig
22. validator/FlagValidator

### 阶段 F：验收
23. `README.md` + `docs/RUN.md`
24. 构建 + 启动验证（需用户起 docker-compose）

## 关键策略

- **mbg 生成**：不运行 generator（需 MySQL 连接），直接从参考项目拷贝已生成的文件改包名，只保留 31 张表
- **接口兼容**：Controller 路径、参数、响应结构严格对照 `docs/apis/API_DOC.md` 和参考项目源码
- **包名替换**：`com.macro.mall` → `com.phil.mall`，`com.macro.mall.common` → `com.phil.mall.common` 等
- **import 替换**：所有 Java 文件中 `com.macro.mall` → `com.phil.mall`

## 并行机会

- 阶段 B（common）和阶段 D（security 的部分类）可与阶段 C（mbg 拷贝）并行，但都有依赖 common，故 common 先做
- mbg 拷贝改包名是机械操作，可委托 subagent
- UMS 和 PMS 的 Controller/Service 相互独立，可并行实现
