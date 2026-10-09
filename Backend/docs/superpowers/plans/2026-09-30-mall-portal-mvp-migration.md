# mall-portal MVP 迁移实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 mall-portal 的下单最小闭环迁移进 Backend，交付一个能 `mvn compile` 通过并启动的 `mall-portal` 模块，并补充接口文档。

**Architecture:** 新建 `Backend/mall-portal` 模块，对齐 mall-admin 结构。包名 `com.macro.mall` → `com.phil.mall`。复用 mall-common（CommonResult/RedisService/BaseOpenApiConfig）与 mall-security（JWT 过滤器/白名单）。补齐 mall-mbg 缺失的 oms/ums_member/sms_coupon 系列 model+mapper+XML 与建表 SQL。剥离支付宝、MongoDB、RabbitMQ、退货、首页、品牌。

**Tech Stack:** Spring Boot 2.7.5、Java 8、MyBatis 3.5.10、springdoc-openapi 1.6.14、Druid、Redis、JWT(jjwt 0.9.1)。

**Spec:** `Backend/docs/superpowers/specs/2026-09-30-mall-portal-mvp-migration-design.md`

## Global Constraints

- 所有迁移代码包名必须是 `com.phil.mall.*`（源为 `com.macro.mall.*`）。
- Swagger 用 springdoc（`@Tag/@Operation/@Parameter/@Schema`），禁止引入 springfox（`@Api/@ApiOperation/@ApiModelProperty`）。
- 不引入 amqp、mongodb、alipay-sdk 依赖。
- 统一返回 `com.phil.mall.common.api.CommonResult` / `CommonPage`；异常抛 `com.phil.mall.common.exception.Asserts`。
- mall-portal 端口 8085；jwt secret 与 admin 独立。
- mapper XML 路径 `classpath:dao/*.xml` + `classpath*:com/**/mapper/*.xml`（对齐 admin application.yml）。
- 验证以「`mvn -pl mall-portal -am compile` 通过」为准；本机 shell 用绝对路径调用命令，不要用 `cd A && B` 组合（profile 有报错）。

## Review Focus

- **会员未登录访问受保护接口**（如 /cart、/order）：应返回 401，而非 500。白名单需仅放行 /sso/register、/sso/login、/sso/getAuthCode、/product/**。
- **重复注册同一手机号**：应返回业务异常「该用户已经存在」，而非数据库唯一约束 500。
- **下单时购物车为空或优惠券不可用**：应返回明确业务错误，而非 NPE。
- **JWT 过期/非法 token**：过滤器应放行到匿名，受保护接口再返 401，而非抛异常。
- **springfox 注解残留**：任何遗漏未替换的 `@Api*` 会导致编译期找不到符号——编译即暴露。

---

### Task 1: 创建 mall-portal 模块骨架并注册到根 pom

**Files:**
- Create: `Backend/mall-portal/pom.xml`
- Create: `Backend/mall-portal/src/main/java/com/phil/mall/portal/MallPortalApplication.java`
- Modify: `Backend/pom.xml`（`<modules>` 追加 `<module>mall-portal</module>`）

**Interfaces:**
- Produces: 模块坐标 `com.phil.mall:mall-portal`；启动类 `com.phil.mall.portal.MallPortalApplication`（`@SpringBootApplication`）。

- [ ] **Step 1: 参照 `Backend/mall-admin/pom.xml` 写 `mall-portal/pom.xml`**
  - artifactId 改 `mall-portal`；依赖 `mall-mbg`、`mall-security`（间接带出 mall-common）；加 `spring-boot-starter-data-redis`；build 加 `spring-boot-maven-plugin`。不加 amqp/mongodb/alipay。

- [ ] **Step 2: 写启动类**
```java
package com.phil.mall.portal;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MallPortalApplication {
    public static void main(String[] args) {
        SpringApplication.run(MallPortalApplication.class, args);
    }
}
```

- [ ] **Step 3: 根 pom `<modules>` 追加 `mall-portal`**

- [ ] **Step 4: 验证模块可解析**
  - Run: `mvn -pl mall-portal -am validate`（在 `/Users/litian.phil/phil/java/mall/Backend` 下执行）
  - Expected: BUILD SUCCESS（此时无业务代码，仅验证模块结构与依赖解析）

- [ ] **Step 5: 不提交（遵循用户会话规则：不主动 git 提交）**

---

### Task 2: 补齐 mall-mbg 缺失的 model + mapper + XML

**Files:**
- Create（从官方 `0resource/mall/mall-mbg` 复制并改包名 `com.macro.mall`→`com.phil.mall`）:
  - model+Example：`OmsCartItem`、`OmsOrder`、`OmsOrderItem`、`OmsOrderSetting`、`OmsOrderOperateHistory`、`UmsMember`、`UmsMemberReceiveAddress`、`SmsCoupon`、`SmsCouponHistory`、`SmsCouponProductRelation`、`SmsCouponProductCategoryRelation`
  - 对应 mapper 接口：`com/phil/mall/mapper/*Mapper.java`
  - 对应 mapper XML：`com/phil/mall/mapper/*Mapper.xml`
- 目标目录：`Backend/mall-mbg/src/main/java/com/phil/mall/model|mapper/` 与 `Backend/mall-mbg/src/main/resources/com/phil/mall/mapper/`

**Interfaces:**
- Produces: `com.phil.mall.model.*` 实体 + `com.phil.mall.mapper.*Mapper` 接口，供 portal service/dao 使用。

- [ ] **Step 1: 先 diff 已有 model，只补缺失的**
  - Run: `ls /Users/litian.phil/phil/java/mall/Backend/mall-mbg/src/main/java/com/phil/mall/model/`
  - 对照上面清单，target 已有的（如 PmsProduct/PmsSkuStock/UmsMemberLevel）跳过；确认缺失的是 Oms*、UmsMember、UmsMemberReceiveAddress、SmsCoupon* 系列。

- [ ] **Step 2: 复制官方 model+Example 到 target model 目录，逐文件把 `package com.macro.mall.model` 改为 `package com.phil.mall.model`，`import com.macro.mall`→`com.phil.mall`**

- [ ] **Step 3: 复制官方对应 `*Mapper.java` 到 target mapper 目录并改包名**

- [ ] **Step 4: 复制官方对应 `*Mapper.xml` 到 target resources mapper 目录，把 XML 里 `namespace`/`type` 中的 `com.macro.mall`→`com.phil.mall`**

- [ ] **Step 5: 编译 mall-mbg**
  - Run: `mvn -pl mall-mbg -am compile`（Backend 目录下）
  - Expected: BUILD SUCCESS，新增 model/mapper 编译通过。

---

### Task 3: 补齐建表 SQL

**Files:**
- Create: `Backend/sql/mall-portal.sql`

**Interfaces:**
- Produces: portal 所需表的建表 DDL + 少量初始数据。

- [ ] **Step 1: 从官方 sql 提取 DDL**
  - 定位官方建表脚本：`ls /Users/litian.phil/phil/java/0resource/mall/document/sql/` 找 `mall.sql`。
  - 提取表：`ums_member`、`ums_member_receive_address`、`oms_cart_item`、`oms_order`、`oms_order_item`、`oms_order_setting`、`oms_order_operate_history`、`sms_coupon`、`sms_coupon_history`、`sms_coupon_product_relation`、`sms_coupon_product_category_relation` 的 `CREATE TABLE` 段（及各自 INSERT 初始数据，取少量演示数据）。
  - 注意：target `mall-admin.sql` 已建 `ums_member_level`——不要重复。

- [ ] **Step 2: 写入 `Backend/sql/mall-portal.sql`，文件头加注释说明用途与执行顺序（在 mall-admin.sql 之后执行）**

- [ ] **Step 3: 验证 SQL 语法**
  - 若本机有 mysql client：`mysql --help` 确认存在；否则人工 review DDL 无语法错误、无与 mall-admin.sql 冲突的重复建表。

---

### Task 4: 迁移 domain（DTO/VO/参数对象）

**Files:**
- Create: `Backend/mall-portal/src/main/java/com/phil/mall/portal/domain/` 下（从官方 portal domain 复制、改包名、springfox 注解换 springdoc）:
  `CartProduct`、`CartPromotionItem`、`ConfirmOrderResult`、`OmsOrderDetail`、`OrderParam`、`PmsPortalProductDetail`、`PmsProductCategoryNode`、`PromotionProduct`、`MemberDetails`、`SmsCouponHistoryDetail`、`QueueEnum`（若被 order 引用可保留枚举，不引 MQ）。
  - 剥离项相关 domain 不迁：`AliPayParam`、`FlashPromotionProduct`、`HomeContentResult`、`HomeFlashPromotion`、`MemberBrandAttention`、`MemberProductCollection`、`MemberReadHistory`、`OmsOrderReturnApplyParam`。

**Interfaces:**
- Produces: `com.phil.mall.portal.domain.*`，供 service/controller 使用。

- [ ] **Step 1: 逐个复制上述 domain 类，改 `package`/`import` 为 `com.phil.mall`**

- [ ] **Step 2: 把 springfox 注解替换为 springdoc**
  - `@ApiModelProperty(value="x")` → `@Schema(title="x")`（import `io.swagger.v3.oas.annotations.media.Schema`）
  - 删除 `@ApiModel`（或换 `@Schema`）。

- [ ] **Step 3: 若某 domain 引用了被剥离的类型（如 flash promotion），删除该字段或该 domain**——以编译通过为准，Task 8 统一验证。

---

### Task 5: 迁移 portal 自定义 dao + mapper XML

**Files:**
- Create: `Backend/mall-portal/src/main/java/com/phil/mall/portal/dao/` : `PortalProductDao`、`PortalOrderDao`、`PortalOrderItemDao`、`SmsCouponHistoryDao`
- Create: `Backend/mall-portal/src/main/resources/dao/` : 对应 4 个 `*.xml`
  - 不迁 `HomeDao`（Home 剥离）。

**Interfaces:**
- Produces: `com.phil.mall.portal.dao.*` 自定义查询接口，供 service 使用。

- [ ] **Step 1: 复制 4 个 dao 接口，改包名；引用的 model/domain 改 `com.phil.mall`**

- [ ] **Step 2: 复制 4 个 mapper XML 到 `resources/dao/`，把 `namespace`、`resultType`、`parameterType` 里的 `com.macro.mall`→`com.phil.mall`**

- [ ] **Step 3: 检查 XML 引用的表/列与 Task 3 建表一致**（尤其 PortalOrderDao 的库存锁定/扣减 SQL 引用 `pms_sku_stock`）。

---

### Task 6: 迁移 service 层

**Files:**
- Create: `Backend/mall-portal/src/main/java/com/phil/mall/portal/service/` + `service/impl/`:
  - `UmsMemberService`+Impl、`UmsMemberCacheService`+Impl
  - `PmsPortalProductService`+Impl
  - `OmsCartItemService`+Impl、`OmsPromotionService`+Impl
  - `UmsMemberCouponService`+Impl
  - `UmsMemberReceiveAddressService`+Impl
  - `OmsPortalOrderService`+Impl
  - 不迁：`HomeService`、`PmsPortalBrandService`、`AlipayService`、MongoDB 系 service、`OmsPortalOrderReturnApplyService`。

**Interfaces:**
- Consumes: Task 2 的 mapper、Task 4 的 domain、Task 5 的 dao、mall-common 的 `RedisService`、mall-security 的 `JwtTokenUtil`。
- Produces: 上述 service 接口，供 controller 注入。

- [ ] **Step 1: 复制 service 接口 + impl，改包名 `com.phil.mall`**

- [ ] **Step 2: 处理 `OmsPortalOrderServiceImpl` 的 RabbitMQ 依赖**
  - 删除对 `CancelOrderSender` 的注入与调用（发送延迟取消消息的那段）；下单主流程（锁库存、生成订单、扣券、清购物车）保留。
  - 保留 `cancelOrder`（手动取消）逻辑，仅去掉 MQ 定时发送部分。

- [ ] **Step 3: 处理被剥离依赖**
  - service 中对 MongoDB service、Alipay、Home 的引用一并删除（MVP 下单闭环不涉及）。

- [ ] **Step 4: RedisService/JwtTokenUtil 的包路径改为 target 的 `com.phil.mall.common.service.RedisService` / `com.phil.mall.security...JwtTokenUtil`**（grep 确认 target 实际类路径）。

---

### Task 7: 迁移 config + 安全配置

**Files:**
- Create: `Backend/mall-portal/src/main/java/com/phil/mall/portal/config/`:
  - `MyBatisConfig`（`@MapperScan({"com.phil.mall.mapper","com.phil.mall.portal.dao"})`）
  - `OpenApiConfig`（继承 `com.phil.mall.common.config.BaseOpenApiConfig`，参照 admin 的 `OpenApiConfig`，title「mall商城前台系统」）
  - `MallSecurityConfig` + `UserDetailsServiceImpl`（基于 `UmsMemberService` 加载 `UmsMember` 为 `UserDetails`，参照官方 portal 的 `MallSecurityConfig`/`MemberDetails`）
  - `GlobalCorsConfig`（参照 admin）
- Create: `Backend/mall-portal/src/main/resources/application.yml`（参照 admin：端口 8085、mybatis mapper-locations、jwt(独立 secret)、redis、`secure.ignored.urls` 白名单：`/sso/register`、`/sso/login`、`/sso/getAuthCode`、`/product/**`、`/swagger-ui/**`、`/v3/api-docs/**`）

**Interfaces:**
- Consumes: mall-security 的 `SecurityConfig`/`JwtAuthenticationTokenFilter`（复用）、Task 6 的 `UmsMemberService`。
- Produces: `UserDetailsService`、`OpenApiConfig`、`application.yml` 运行配置。

- [ ] **Step 1: 写 `MyBatisConfig`（改 @MapperScan 路径）**

- [ ] **Step 2: 参照 `mall-admin/.../config/OpenApiConfig.java` 写 portal 版 `OpenApiConfig`（springdoc）**

- [ ] **Step 3: 写 `MallSecurityConfig` + `UserDetailsServiceImpl`**
  - `loadUserByUsername` 调 `umsMemberService.getByUsername`，包成 `MemberDetails implements UserDetails`。
  - 参照 admin 的 `MallSecurityConfig` 暴露 `UserDetailsService` Bean 给 mall-security 的过滤链。

- [ ] **Step 4: 写 `GlobalCorsConfig` 与 `application.yml`（端口 8085、独立 jwt secret、白名单）**

---

### Task 8: 迁移 6 个 controller（springfox → springdoc）并整体编译

**Files:**
- Create: `Backend/mall-portal/src/main/java/com/phil/mall/portal/controller/`:
  `UmsMemberController`、`PmsPortalProductController`、`OmsCartItemController`、`UmsMemberReceiveAddressController`、`UmsMemberCouponController`、`OmsPortalOrderController`

**Interfaces:**
- Consumes: Task 6 的 service。
- Produces: REST 接口（路径见 spec 表格）。

- [ ] **Step 1: 复制 6 个 controller，改包名**

- [ ] **Step 2: 注解替换 springfox → springdoc**
  - `@Api(tags="x")` → `@Tag(name="x")`（`io.swagger.v3.oas.annotations.tags.Tag`）
  - `@ApiOperation("x")` → `@Operation(summary="x")`（`io.swagger.v3.oas.annotations.Operation`）
  - `@ApiParam` / `@ApiImplicitParam` → `@Parameter`（`io.swagger.v3.oas.annotations.Parameter`）
  - 参照 `mall-admin` 任一 controller 的现有 springdoc 写法对齐。

- [ ] **Step 3: 整体编译**
  - Run: `mvn -pl mall-portal -am compile`（Backend 目录下）
  - Expected: BUILD SUCCESS。若报 springfox 符号找不到→定位残留 `@Api*` 修正；若报被剥离类型→删除相关引用。

- [ ] **Step 4: 打包冒烟（不启动依赖）**
  - Run: `mvn -pl mall-portal -am package -DskipTests`
  - Expected: 生成可执行 jar，BUILD SUCCESS。

- [ ] **Step 5:（可选，本机有 MySQL+Redis 时）启动冒烟**
  - 导入 `sql/mall-admin.sql` + `sql/mall-portal.sql`；启动 `MallPortalApplication`；`curl` 访问 `http://localhost:8085/swagger-ui.html` 与 `/sso/register` 验证。

---

### Task 9: 补充接口文档

**Files:**
- Modify: `/Users/litian.phil/phil/java/mall/docs/apis/API_DOC.md`（续写 mall-portal 章节）
- Modify: `Backend/docs/RUN.md`（补 portal 启动 + curl 冒烟清单）

**Interfaces:**
- Produces: markdown 接口文档，与迁移的 6 个 controller 一一对应。

- [ ] **Step 1: 读 `docs/apis/API_DOC.md` 现有格式与预留的 portal 章节**

- [ ] **Step 2: 按「方法 | 路径 | 说明 | 参数」表格，逐 controller 补全**
  - /sso（注册/登录/信息/token）、/product（搜索/详情）、/cart（增删改查）、/member/address（增删改查）、/member/coupon（领券/我的券/可用券）、/order（确认单/下单/列表/详情/取消/确认收货）。
  - 请求/响应统一说明包 `CommonResult`。

- [ ] **Step 3: 在 `Backend/docs/RUN.md` 补 mall-portal 段**：端口 8085、依赖（MySQL+Redis）、导入 sql 顺序、启动命令、几条 curl 冒烟示例（register→login→加购→下单）。

---

## Self-Review 记录

- **Spec coverage**：6 controller（Task 8）、依赖剥离 RabbitMQ/MongoDB/支付宝（Task 1 pom + Task 6 去 MQ）、springfox→springdoc（Task 4/8）、model+SQL 缺口（Task 2/3）、安全配置（Task 7）、文档（Task 9）——全部覆盖。
- **Placeholder scan**：无 TBD/TODO；文件与注解替换均给出具体规则。
- **Type consistency**：包名统一 `com.phil.mall`；@MapperScan 路径 Task 2/7 一致；service↔controller↔dao 依赖在 Interfaces 块标明。
- **Review Focus**：401/重复注册/空购物车/JWT/springfox 残留——分别由 Task 7 白名单、Task 6 业务异常、Task 6 下单校验、mall-security 复用、Task 8 编译覆盖。
