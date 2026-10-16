# 秒杀下单链路 + 超时自动取消 设计方案

- 日期：2026-10-14
- 范围：仅 `mall-portal`（C 端）。秒杀活动/场次/商品配额数据由人工 SQL 准备，不做 `mall-admin` 管理端界面。
- 目标：让 `oms_order_setting.flash_order_overtime`（秒杀订单超时关闭时间，分钟）真正生效。

---

## 1. 背景与问题

### 1.1 现状

`oms_order_setting` 表里有两个超时字段，种子数据 `Backend/sql/mall-portal.sql:179`：

```sql
INSERT INTO oms_order_setting VALUES (1, 60, 120, 15, 7, 7);
-- flash_order_overtime = 60, normal_order_overtime = 120
```

管理端 UI 两个字段都已经能改（`frontend/src/pages/oms/orderSetting/index.tsx:45-50`，`SETTING_ID = 1`）。

但 `flash_order_overtime` 在业务代码里**零引用**。原因不是"字段没接线"，而是**整条秒杀下单链路不存在**：

1. `OmsPortalOrderServiceImpl.generateOrder()` 里 `order.setOrderType(0)` 是硬编码的（`:200`），所有订单都是普通订单。
2. 没有任何接口能产出 `order_type = 1` 的订单。
3. `sendDelayMessageCancelOrder()` 无条件读 `getNormalOrderOvertime()`（`:351-357`）。
4. 两张秒杀表缺 DDL：`sms_flash_promotion_session`、`sms_flash_promotion_product_relation`。MBG 生成的 model/mapper 存在，但建表语句不在 `Backend/sql/` 下。

所以用户在管理端"订单分类"下拉框选"秒杀订单"筛选，结果永远是空的（`frontend/src/pages/oms/order/index.tsx:179`，后端过滤已通到 `OmsOrderDao.xml:23-24`）。

### 1.2 本次范围

只做：**秒杀下单 + 超时取消秒杀订单 + 释放秒杀库存**。

不做：管理端秒杀活动 CRUD 界面、秒杀商品列表页改造、Redis 预减库存。

---

## 2. 关键前置认知（库存模型）

这一点是整个设计的基础，容易搞错：

| 维度 | 存储位置 | 含义 |
| --- | --- | --- |
| 真实仓库库存 | `pms_sku_stock.stock` / `lock_stock` | 实际有多少货 |
| 秒杀活动配额 | `sms_flash_promotion_product_relation.flash_promotion_count` | 本场活动最多卖多少件 |

**两者是不同维度，下单时必须都校验、都扣减。**

- 只扣配额 → 超卖真实库存。
- 只锁真实库存 → 活动限量形同虚设。

防超卖手段沿用项目现有的**原子条件 UPDATE**（`PortalOrderDao.xml:91-97` 的 `lockStockBySkuId` 就是这个套路：`WHERE ... AND lock_stock + #{quantity} <= stock`，影响行数为 0 即表示库存不足）。**不引入 Redis** —— Redis 预减解决的是数据库 QPS 压力，不是超卖；本项目当前量级不需要。

---

## 3. 第一节：数据模型

### 3.1 补 `sms_flash_promotion_session` DDL

必须与已有 MBG model 逐字段对齐，否则生成的 mapper 运行期报错。字段类型取自 `Backend/mall-mbg/.../SmsFlashPromotionSessionMapper.xml:5-10` 的 jdbcType：

```sql
CREATE TABLE `sms_flash_promotion_session` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NULL COMMENT '场次名称',
  `start_time` time NULL COMMENT '每日开始时间',
  `end_time` time NULL COMMENT '每日结束时间',
  `status` int(1) NULL COMMENT '启用状态：0->不启用；1->启用',
  `create_time` datetime NULL,
  PRIMARY KEY (`id`)
) COMMENT='限时购场次表';
```

注意 `start_time` / `end_time` 是 MySQL `time`（jdbcType `TIME`），表示**每天重复的时间窗**，不是 datetime。

### 3.2 补 `sms_flash_promotion_product_relation` DDL

字段来源是唯一的真相：`Backend/mall-portal/src/main/resources/dao/HomeDao.xml:24-36`。

```sql
CREATE TABLE `sms_flash_promotion_product_relation` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `flash_promotion_id` bigint(20) NULL,
  `flash_promotion_session_id` bigint(20) NULL COMMENT '场次id',
  `product_id` bigint(20) NULL,
  `flash_promotion_price` decimal(10,2) NULL COMMENT '秒杀价格',
  `flash_promotion_count` int(11) NULL COMMENT '秒杀配额（本场最多卖多少件）',
  `flash_promotion_limit` int(11) NULL COMMENT '每人限购数量',
  `sort` int(11) NULL,
  PRIMARY KEY (`id`)
) COMMENT='商品限时购与商品关系表';
```

**决策：配额保持商品级（product_id），不细化到 SKU 级。** 理由：`HomeDao.xml` 的 `getFlashProductList` 是 `LEFT JOIN pms_product p ON pr.product_id = p.id`，改成 SKU 级就要改首页查询和结果映射，超出本次范围。

### 3.3 数据访问方式

**决策：新建自定义 `PortalFlashPromotionDao` + 对应 XML，不重跑 MBG。**

理由：MBG 重跑会波及 `mall-mbg` 下大量已生成文件，且 `mall-admin` 共用这些 model，风险面远大于收益。本次只需要几个定制 SQL（原子扣配额、原子回配额、按 relation 查活动+场次）。

### 3.4 测试数据注意

`Backend/sql/mall-sms-cms.sql:159` 的种子活动是：

```sql
('双11特卖活动', '2022-11-09', '2023-12-31', 1)
```

**已过期**。联调前需要插入一条 `start_date <= 今天 <= end_date` 的活动，以及一条覆盖当前时刻的场次。

---

## 4. 第二节：秒杀下单链路

### 4.1 订单与秒杀配额的关联

超时取消时要把配额还回去，就必须知道"这笔订单占用了哪条 relation 的多少配额"。

**决策：新建独立表，不改 `oms_order`。**

```sql
CREATE TABLE `oms_order_flash_relation` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) NOT NULL,
  `flash_promotion_relation_id` bigint(20) NOT NULL COMMENT 'sms_flash_promotion_product_relation.id',
  `product_sku_id` bigint(20) NOT NULL,
  `quantity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`)
) COMMENT='秒杀订单与秒杀商品配额关联表';
```

理由：`OmsOrder` 是 MBG 生成的，且 `mall-admin` 大量复用。给它加字段意味着改 model + mapper + 所有 example 类，并且管理端也会受影响。独立表把影响面压在 portal 内部。

### 4.2 新接口

```
POST /order/flash/generate
```

请求参数**只接受**：

| 字段 | 说明 |
| --- | --- |
| `flashPromotionRelationId` | 秒杀商品关系 id |
| `productSkuId` | 选中的 SKU |
| `quantity` | 购买数量 |
| `memberReceiveAddressId` | 收货地址 |
| `payType` | 支付方式 |

**价格一律服务端从 `flash_promotion_price` 取，绝不接受客户端传价。**

**决策：独立 `generateFlashOrder` 方法，不在 `generateOrder` 里加分支。**

理由：`generateOrder` 有 157 行（`:96-252`），且**全程以购物车为驱动**（`:104` `cartItemService.listPromotion(...)`、`:114` 用 `cartPromotionItem.getPrice()`、`:167` `lockStock(cartPromotionItemList)`）。秒杀是单商品直接下单，没有购物车。塞进去会让两条链路互相污染。

### 4.3 下单八步

整个方法标注 `@Transactional`：

1. 查 relation + 关联的 `sms_flash_promotion` + `sms_flash_promotion_session`，校验活动 `status=1`、今天在 `[start_date, end_date]` 内、场次 `status=1`、当前时刻在 `[start_time, end_time]` 内。
2. 校验 `productSkuId` 确实属于 relation 的 `product_id`（防止用 A 商品的秒杀价买 B 商品的 SKU）。
3. 限购校验：该会员在本场该商品的历史购买量 + `quantity` <= `flash_promotion_limit`。
4. **原子扣配额**：
   ```sql
   UPDATE sms_flash_promotion_product_relation
   SET flash_promotion_count = flash_promotion_count - #{quantity}
   WHERE id = #{relationId} AND flash_promotion_count - #{quantity} >= 0
   ```
   影响行数 0 → 抛业务异常"已抢完"。
5. **原子锁真实库存**：复用现有 `lockStockBySkuId`。影响行数 0 → 抛"库存不足"。
6. 构建订单：`orderType = 1`、`status = 0`、`sourceType` 与现有一致，单价取 `flash_promotion_price`。
7. 插入 `oms_order` + `oms_order_item` + `oms_order_flash_relation`。
8. 发延迟消息：`sendDelayMessageCancelOrder(order.getId())`。

**配额回滚靠 `@Transactional`，不写手工补偿。** 第 5 步失败时事务回滚，第 4 步的配额扣减自动撤销。

### 4.4 已知取舍

**每人限购的并发竞态不做加固。** 第 3 步的"查历史购买量 + 校验"在高并发下可能被绕过（两个请求同时读到同样的历史量）。做严格需要唯一索引或悲观锁，代价不成比例。配额总量由第 4 步的原子 UPDATE 严格守住，不会超卖——只是极端并发下个别用户可能多买一件。

---

## 5. 第三节：超时取消分流

### 5.1 延迟消息按订单类型取超时时间

现状 `OmsPortalOrderServiceImpl:351-357`：

```java
OmsOrderSetting orderSetting = orderSettingMapper.selectByPrimaryKey(1L);
long delayTimes = orderSetting.getNormalOrderOvertime() * 60 * 1000;
cancelOrderSender.sendMessage(orderId, delayTimes);
```

改为在方法内部查出该订单的 `order_type`，再选字段：

- `order_type == 1` → `getFlashOrderOvertime()`
- 否则 → `getNormalOrderOvertime()`
- **秒杀字段为 null 时回落到 `normal_order_overtime`**

null 兜底是必要的：虽然种子数据给了 60，但管理端用的是 antd `InputNumber`，用户可以清空保存成 null。

**连带影响：** `sendDelayMessageCancelOrder` 除了下单时调用（`:247`），还被 `POST /order/cancelOrder`（"取消单个超时订单"，`OmsPortalOrderController:63-69`）调用。改完之后，对秒杀订单调这个接口会按 `flash_order_overtime` 重新排一次延迟，这是符合预期的。用户主动取消走的是 `POST /order/cancelUserOrder` → `cancelOrder()` 立即取消（`:89-95`），不受本项改动影响。

### 5.2 取消时归还配额（两条路径都要改）

**前提：项目里有两条互不调用的取消路径，必须都改。**

| 路径 | 入口 | 改状态的方式 | 释放库存的方式 |
| --- | --- | --- | --- |
| MQ 消费 / 单笔取消 | `cancelOrder(Long)` `:315-348` | `orderMapper.updateByPrimaryKeySelective`，前置 select 带 `andStatusEqualTo(0)` | `releaseStockBySkuId` 逐 SKU |
| 定时兜底 | `cancelTimeOutOrder()` `:286-312` | `portalOrderDao.updateOrderStatus(ids, 4)` 批量 | `releaseSkuStockLock` 批量 |

`cancelTimeOutOrder` **不会**调用 `cancelOrder`，所以归还配额的逻辑要在两处分别接入（抽成一个私有方法 `returnFlashQuota(orderId)` 复用）。

归还 SQL：

```sql
UPDATE sms_flash_promotion_product_relation
SET flash_promotion_count = flash_promotion_count + #{quantity}
WHERE id = #{relationId}
```

普通订单在 `oms_order_flash_relation` 查不到记录，自然跳过。

### 5.3 定时兜底任务按类型分流

`cancelTimeOutOrder()`（`:286-312`）现在只用 `getNormalOrderOvertime()`（`:290`），且 `getTimeOutOrders`（`PortalOrderDao.xml:29-48`）**没有 order_type 过滤**。

改法：

1. `getTimeOutOrders` 增加 `AND o.order_type = #{orderType}`。
2. `cancelTimeOutOrder()` 拆成两次查询：普通订单用 `normal_order_overtime`，秒杀订单用 `flash_order_overtime`，分别处理。

### 5.4 `paySuccess` 不改

已确认无需改动：支付成功走 `reduceSkuStock`（`PortalOrderDao.xml:98-106`），把 `lock_stock` 和 `stock` 一起扣掉，秒杀配额本来就该在下单时就消耗掉、支付成功后不归还。

### 5.5 `updateOrderStatus` 加状态条件（附带修一个既有隐患）

此项只影响**定时兜底路径**（`cancelTimeOutOrder`）。`cancelOrder` 路径已有自己的 `andStatusEqualTo(0)` 前置过滤，不需要改。

现状 `PortalOrderDao.xml:69-76` 是无条件 UPDATE：

```sql
update oms_order set status=#{status} where id in (...)
```

改为：

```sql
update oms_order set status=#{status} where status = 0 and id in (...)
```

并**用影响行数决定是否执行后续的配额归还 / 库存释放 / 优惠券与积分返还**。影响 0 行说明这批订单已被 MQ 路径取消过了，后续动作必须全部跳过。

这不只是为秒杀服务——它同时修掉一个既有隐患：定时任务和 MQ 消费可能对同一笔订单重复执行取消，当前代码会**重复释放 `lock_stock`、重复返还积分**。

**注意实现细节：** 现在是"批量改状态 + 循环处理每笔订单"，批量 UPDATE 只能拿到总影响行数，无法分辨**哪几笔**成功。所以这里要改成**逐笔 UPDATE**（`where id = #{id} and status = 0`），按单笔影响行数决定该笔订单是否继续走后续动作。订单量是超时未付款订单，规模小，逐笔可接受。

---

## 6. 决策记录

| 决策 | 选择 | 否决的方案与理由 |
| --- | --- | --- |
| 防超卖 | 数据库原子条件 UPDATE | Redis 预减——解决的是 QPS 不是超卖，当前量级不需要 |
| 库存扣减维度 | 配额 + 真实库存**双扣** | 只扣一边——两者是不同维度，漏任一边都有正确性问题 |
| 配额粒度 | 商品级（product_id） | SKU 级——要改 `HomeDao.xml` 和首页查询，超范围 |
| 订单↔配额关联 | 新建 `oms_order_flash_relation` | 改 `oms_order` 加字段——MBG 生成且 admin 共用，影响面过大 |
| 下单入口 | 独立 `generateFlashOrder` | 在 `generateOrder` 加分支——157 行且全程购物车驱动，会互相污染 |
| 数据访问 | 自定义 `PortalFlashPromotionDao` | 重跑 MBG——波及 mall-mbg 大量文件，admin 共用 |
| 配额回滚 | `@Transactional` | 手工补偿代码——没必要，事务已覆盖 |
| 每人限购并发 | 不加固 | 唯一索引/悲观锁——代价不成比例，总配额已有原子保护 |
| 超时字段 null | 回落 `normal_order_overtime` | 抛异常/用默认常量——静默降级更合适，管理端可清空该字段 |

---

## 7. 测试策略

### 单元测试

- 超时字段选择：`order_type=0` → normal；`order_type=1` → flash；`order_type=1` 且 flash 为 null → normal。
- 原子扣配额边界：`flash_promotion_count` 恰好等于 `quantity` 时成功，少 1 时影响行数为 0。

### 集成测试

1. 插入当前有效的活动 + 场次 + relation 测试数据。
2. 调 `POST /order/flash/generate` 下单，验证订单 `order_type = 1`、价格等于 `flash_promotion_price`、配额减少、`lock_stock` 增加。
3. 把 `flash_order_overtime` 调到 1 分钟，等待超时，验证订单 `status = 4`、配额已归还、`lock_stock` 已释放。
4. 重复触发取消（手动再发一次消息 / 跑定时任务），验证配额**不会**被归还两次。

### 手工验证

- RabbitMQ 管理界面 http://localhost:15672（mall/mall）观察消息在 `mall.order.cancel.ttl` 队列的驻留时间是否等于 `flash_order_overtime`。
- 管理端订单列表"订单分类"选"秒杀订单"，应能查到新建的订单。

---

## 8. 已知限制

1. **生产环境没有 RabbitMQ**（`Backend/docker-compose.prod.yml` 无该服务，2G 内存限制）。生产靠 `OrderTimeOutCancelTask` 的 `@Scheduled(fixedDelay = 30 * 60 * 1000)` 兜底，意味着**生产环境秒杀超时取消的实际精度是 30 分钟**，而非 `flash_order_overtime` 的精确值。这是既有的、有意的降级设计。
2. 每人限购在极端并发下可能被突破一件（见 4.4）。
3. 秒杀商品数据只能人工 SQL 维护，没有管理端界面（本次范围约定）。
4. 配额是商品级而非 SKU 级，同一商品不同 SKU 共享配额。
