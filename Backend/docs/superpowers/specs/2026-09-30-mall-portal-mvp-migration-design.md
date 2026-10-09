# mall-portal MVP 迁移设计

日期：2026-09-30
源：`/Users/litian.phil/phil/java/0resource/mall/mall-portal`（macrozheng/mall，包名 `com.macro.mall`）
目标：`/Users/litian.phil/phil/java/mall/Backend`（`com.phil.mall`，Spring Boot 2.7.5，Java 8，springdoc-openapi）

## 目标

把 mall-portal（C 端商城前台）的**下单最小闭环**迁移进 Backend，交付一个能 `mvn compile` 通过并启动的 `mall-portal` 模块，并补充接口文档。剥离一切第三方/非必需依赖（支付宝、MongoDB、RabbitMQ）。

## 范围

### 保留的 6 个 Controller（下单闭环必需）

| Controller | 路径 | 作用 |
|---|---|---|
| UmsMemberController | /sso | 会员注册/登录/获取信息/token 刷新 |
| PmsPortalProductController | /product | 商品搜索/详情 |
| OmsCartItemController | /cart | 购物车增删改查/促销计算 |
| UmsMemberReceiveAddressController | /member/address | 收货地址增删改查 |
| UmsMemberCouponController | /member/coupon | 领券/我的券/下单可用券 |
| OmsPortalOrderController | /order | 确认单/下单/订单列表/详情/取消/确认收货 |

### 剥离（MVP 不迁）

- AlipayController + AlipayService + AlipayConfig/AlipayClientConfig（支付宝 SDK）
- MemberProductCollection / MemberAttention / MemberReadHistory（MongoDB 三件套）
- OmsPortalOrderReturnApply（退货申请）
- HomeController（首页聚合，非下单必需）
- PmsPortalBrandController（品牌，非下单必需）

## 依赖处理（决定能否跑通）

- **RabbitMQ → 去掉**。删除 `component` 包（CancelOrderSender/Receiver/OrderTimeOutCancelTask）与 `RabbitMqConfig`。订单超时自动取消功能 MVP 不做，下单本身不受影响。不引入 amqp 依赖。
- **MongoDB / 支付宝 SDK → 不引入**。
- **Swagger**：源用 springfox（`@Api/@ApiOperation`），目标用 springdoc。→ 新建 `OpenApiConfig` 继承 mall-common 的 `BaseOpenApiConfig`；controller 注解改为 springdoc 的 `@Tag/@Operation/@Parameter`。

## 结构（对齐 mall-admin）

- 新建 `Backend/mall-portal` 模块，包名统一 `com.macro.mall` → `com.phil.mall`。
- 新建启动类 `MallPortalApplication`（端口 8085）。
- 新建 `application.yml`（独立 jwt secret、mybatis mapper-locations、redis、secure.ignored.urls 白名单：/sso/**、/product/** 等）。
- 新建 portal 版 `MallSecurityConfig` + 基于 `UmsMember` 的 `UserDetailsService`（复用 mall-security 的 JWT 过滤器/白名单/异常入口）。
- `MyBatisConfig` 的 `@MapperScan` 路径改为 `com.phil.mall.mapper` + `com.phil.mall.portal.dao`。
- 复用 mall-common：CommonResult / CommonPage / GlobalExceptionHandler / RedisService / BaseOpenApiConfig，无需改动 common。
- 根 pom `<modules>` 追加 `mall-portal`；`mall-portal/pom.xml` 依赖 mall-mbg + mall-security（+ redis）。

## 数据层（最大工作量）

目标 mall-mbg 缺 portal 所需业务表。需补：

- **model/mapper/XML**（从官方 mall 的 mall-mbg generator 产物提取，改包名）：
  `ums_member`、`ums_member_receive_address`、`oms_cart_item`、`oms_order`、`oms_order_item`、`oms_order_setting`、`sms_coupon`、`sms_coupon_history`、`sms_coupon_product_relation`、`sms_coupon_product_category_relation` 等下单/优惠券链路涉及的表。
- **建表 SQL**：从官方 mall sql 提取上述表的建表语句 + 少量初始数据，整理进 `Backend/sql/mall-portal.sql`。
- **portal 自定义 dao + mapper XML**（原样迁入、改包名）：
  PortalProductDao、PortalOrderDao、PortalOrderItemDao、SmsCouponHistoryDao。（HomeDao 因剥离 Home 不迁。）

## 交付物

1. `Backend/mall-portal` 模块，`mvn compile` 通过并可启动。
2. `Backend/sql/mall-portal.sql` 建表脚本。
3. 接口文档：续写 `/Users/litian.phil/phil/java/mall/docs/apis/API_DOC.md` 的 mall-portal 章节（markdown 表格：方法/路径/说明/参数），覆盖 6 个 controller。

## 验证标准

- 根目录 `mvn -pl mall-portal -am compile` 通过。
- `MallPortalApplication` 能启动（在 MySQL + Redis 就绪、导入 mall-portal.sql 后）。
- 接口文档与迁移的 controller 一一对应。

## 已知取舍

- 订单超时自动取消功能被裁掉（依赖 RabbitMQ）。未来补：可用 `@Scheduled` 定时任务扫描 `oms_order_setting` 超时时间兜底，或重新引入 RabbitMQ 延迟队列。
- 优惠券与收货地址保留：因 `OmsPortalOrderService` 代码直接依赖，去掉需改下单逻辑、偏离原样迁移。
