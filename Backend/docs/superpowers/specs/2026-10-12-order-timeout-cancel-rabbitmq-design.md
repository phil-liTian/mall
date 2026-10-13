# 订单超时自动取消设计（RabbitMQ 延迟队列）

日期：2026-10-12
参考实现：`/Users/litian.phil/phil/java/0resource/mall/mall-portal`（macrozheng/mall，包名 `com.macro.mall`）
目标：`/Users/litian.phil/phil/java/mall/Backend/mall-portal`（`com.phil.mall.portal`，Spring Boot 2.7.5，Java 8）

## 目标

引入 RabbitMQ，用 **TTL + 死信队列（DLX）** 实现订单超时未付款自动关单（回滚库存、优惠券、积分），补上 [2026-09-30 MVP 迁移设计](./2026-09-30-mall-portal-mvp-migration-design.md) 中被裁掉的功能。

**本次定位是学习/练手**：只落地本地环境（`docker-compose.local.yml`）与后端代码，生产部署不在范围内。但代码按生产标准写（幂等、消费失败兜底、broker 容错）。

## 现状：不是从零开始

上次 MVP 迁移剥离 RabbitMQ 时留下了残留，本次是**填空**而非新建：

| 位置 | 现状 |
|---|---|
| `domain/QueueEnum.java` | **已存在**，内容与参考实现一致，但无任何引用 |
| `OmsPortalOrderService:49` | **已声明** `sendDelayMessageCancelOrder(Long orderId)` |
| `OmsPortalOrderServiceImpl:348-354` | **空壳**：读了 `orderSetting`、算了 `delayTimes`，然后什么都不做，只留一行 MVP 注释 |
| `OmsPortalOrderServiceImpl:244` | 下单流程**已在调用** `sendDelayMessageCancelOrder` —— 接线就位 |
| `OmsPortalOrderServiceImpl:312` | `cancelOrder(Long)` **已实现**（关单 + 回滚库存/券/积分） |
| `OmsPortalOrderServiceImpl:283` | `cancelTimeOutOrder()` 批量扫描版**已实现**，暴露为 `POST /order/cancelTimeOutOrder` |
| — | 但**没有任何定时器调用它**，所以当前超时订单永远不会被关闭 |
| `mall-portal/pom.xml` | 无 `spring-boot-starter-amqp` |
| `application-dev.yml` | 无 `spring.rabbitmq.*` |
| `docker-compose.local.yml` | 无 rabbitmq 服务 |

前提条件已确认可用：

- `oms_order_setting` 表与 `id=1` 记录存在（`Backend/sql/mall-portal.sql:114,179`），`normal_order_overtime = 120`（分钟）
- `OmsOrderSettingMapper` 已由 MyBatis Generator 生成在 `mall-mbg`，可直接注入
- 父 pom（`Backend/pom.xml:62-66`）已含 `spring-boot-starter-test`（JUnit 5 + Mockito + AssertJ）
- 项目**没有任何测试代码**（无 `src/test` 目录）

## 方案选择：TTL + DLX，而非延迟消息插件

RabbitMQ 没有原生延迟队列，主流模拟方式有两种：

| 方案 | 取舍 |
|---|---|
| **TTL + 死信队列**（选定） | RabbitMQ 原生能力，`rabbitmq:3.9-management` 镜像开箱可用。能学到 TTL 与 DLX 两个核心概念，是面试与实际工作中最常见的做法。缺陷：队头阻塞（见下文，本项目当前不受影响） |
| 延迟消息插件 | `rabbitmq_delayed_message_exchange` + `x-delayed-message` 交换机。每条消息可带任意延迟，无队头阻塞，代码更简单。代价：需自建带插件的镜像，且跳过了 DLX 这个知识点 |

选 TTL + DLX：与参考实现一致，无需额外镜像，知识点覆盖更广。

## 消息拓扑

`QueueEnum` 在现有两项基础上**新增第三项**：

```java
QUEUE_DLQ_ORDER_CANCEL("mall.order.cancel.dlx", "mall.order.cancel.dlq", "mall.order.cancel.dlq");
```

完整拓扑（3 交换机 / 3 队列 / 3 绑定，全部 durable）：

```
                              ⏳ 延迟（等待 TTL 过期）
mall.order.direct.ttl ──▶ mall.order.cancel.ttl ──DLX──┐
   DirectExchange            （故意无消费者）           │
                             x-dead-letter-exchange    │
                               = mall.order.direct     │
                             x-dead-letter-routing-key │
                               = mall.order.cancel     │
                                                        ▼
                                      mall.order.direct ──▶ mall.order.cancel
                                        DirectExchange       │  ← CancelOrderReceiver
                                                             │     x-dead-letter-exchange
                              💀 消费抛异常（不重投）         │       = mall.order.cancel.dlx
                              ┌──────────────────────────────┘     x-dead-letter-routing-key
                              ▼                                      = mall.order.cancel.dlq
            mall.order.cancel.dlx ──▶ mall.order.cancel.dlq
                DirectExchange            （留痕，待人工处理）
```

**核心技巧**：RabbitMQ 没有延迟队列，但它有两个能力——消息可设过期时间（TTL），队列可配死信转发（DLX）。让消息在一个**没有消费者的队列**里过期，过期瞬间被自动投递到真正的消费队列。"延迟"就是"等待过期"。

**同一个 DLX 机制在此被用了两次，目的完全不同**：上半截当"定时器"（让消息延迟投递），下半截当"失败兜底"（让坏消息离开主队列）。DLX 本身只是"消息离开队列时转发到别处"，延迟与容错都只是它的应用方式。

因为 `mall.order.cancel` 现在也要配死信，它不能用参考实现的 `new Queue(name)`，须改为 `QueueBuilder.durable(...).withArgument(...)`。

## 数据流

```
用户下单
  └─ OmsPortalOrderServiceImpl.generateOrder()            已有
       └─ :244 sendDelayMessageCancelOrder(orderId)        已在调，本次实现
            ├─ 读 oms_order_setting(id=1).normal_order_overtime → 120 分
            ├─ delayTimes = 120 * 60 * 1000 ms
            └─ CancelOrderSender.sendMessage(orderId, delayTimes)      新增
                 └─ 发到 ttl 交换机，MessagePostProcessor 设 expiration
                 └─ 异常被吞掉 + 打 error 日志（见「broker 容错」）
                          ⏳ 等待
            ┌─ 期间用户付款 → order.status 由 0 变 1（消息不撤回，继续躺着）
            │
  消息过期 → DLX 转发 → mall.order.cancel
       └─ CancelOrderReceiver.handle(orderId)              新增
            └─ cancelOrder(orderId)                         已有
                 ├─ 按 id + status=0 + delete_status=0 查询
                 │    └─ 查不到（已付款/已删除）→ 直接 return    ← 幂等保护
                 ├─ status 置 4（已关闭）
                 ├─ 逐个 SKU 释放锁定库存
                 ├─ 优惠券使用状态回滚
                 └─ 返还积分
```

**消息不需要撤回**。用户付款后消息照常过期投递，但 `cancelOrder` 查不到 `status=0` 的订单就直接返回。靠查询条件做幂等，比去 MQ 里删消息简单得多。

## 文件清单

### 新增 4 个

`component/` 包目前不存在，新建（与参考实现一致）。

| 文件 | 职责 | 依赖 |
|---|---|---|
| `config/RabbitMqConfig.java` | 声明 3 交换机 + 3 队列 + 3 绑定 | `QueueEnum` |
| `component/CancelOrderSender.java` | 发延迟消息，设 `expiration`，吞异常 | `AmqpTemplate` |
| `component/CancelOrderReceiver.java` | `@RabbitListener` 消费，调 `cancelOrder` | `OmsPortalOrderService` |
| `component/OrderTimeOutCancelTask.java` | `@Scheduled` 定时兜底，调 `cancelTimeOutOrder()` | `OmsPortalOrderService` |

### 修改 6 个

| 文件 | 改动 |
|---|---|
| `domain/QueueEnum.java` | 新增 `QUEUE_DLQ_ORDER_CANCEL` 枚举项 |
| `mall-portal/pom.xml` | 加 `spring-boot-starter-amqp` |
| `application-dev.yml` | 加 `spring.rabbitmq.*` 与 `listener.simple.default-requeue-rejected: false` |
| `service/impl/OmsPortalOrderServiceImpl.java` | 实现 `:348-354` 空壳方法，注入 `CancelOrderSender`（仅此一处，兜底逻辑不放这里） |
| `MallPortalApplication.java` | 加 `@EnableScheduling` |
| `docker-compose.local.yml`（仓库根） | 加 rabbitmq 服务、portal 的 env 与 depends_on、`rabbitmq-data` volume |

### 新增测试 1 个

| 文件 | 内容 |
|---|---|
| `src/test/java/com/phil/mall/portal/component/CancelOrderSenderTest.java` | mock `AmqpTemplate`，断言 exchange / routingKey / expiration |

### 明确不改

`docker-compose.prod.yml`、`docker-compose.verify.yml`、`deploy-*.sh`、`Dockerfile.portal`。

## 可靠性设计

①② 是参考实现的真实缺陷，本次按正确做法实现；③ 与 ② 配套；④ 记录两处无需动手的点，避免过度设计。

### ① 消费失败不得无限重投

`cancelOrder:333` 有 `Asserts.fail("库存不足，无法释放！")`。Spring AMQP 默认行为：监听方法抛异常 → 消息 nack 且 **requeue=true** → 回到队首 → 立刻重投 → 再抛 → 死循环，CPU 打满、日志刷爆。

修法两部分：

1. 配置 `spring.rabbitmq.listener.simple.default-requeue-rejected: false` —— 失败不重回队列
2. 给 `mall.order.cancel` 配死信，失败消息进 `mall.order.cancel.dlq` 留痕

失败消息"落袋"而非打转。

### ② broker 挂掉不得影响下单

`generateOrder` 是 `@Transactional`（声明在接口 `OmsPortalOrderService:25-26`），`sendDelayMessageCancelOrder` 在其**事务内部**被调用（`:244`）。若 RabbitMQ 连不上，`convertAndSend` 抛 `AmqpConnectException` → 向上传播 → **整个下单事务回滚 → 用户下单失败**。

一个本只负责"稍后关单"的旁路功能，变成了下单的硬依赖。这是引入 MQ 最容易踩的坑：**把旁路写成了主路**。

决定：**`CancelOrderSender.sendMessage` 内部 try-catch 吞掉异常并打 error 日志**，保证 MQ 故障不影响主流程。

反方向是安全的：消息发出后若事务回滚，消息指向不存在的 orderId，消费时 `cancelOrder` 查不到直接 return，无害。幂等查询顺手覆盖了这个场景。

### ③ 定时任务兜底（与 ② 配套，不可省）

一旦吞掉发送异常，broker 故障期间的订单就会**静默泄漏**——永远不会被关闭。因此必须有兜底：

新建 `component/OrderTimeOutCancelTask.java` 调用已有的 `cancelTimeOutOrder()`，并在 `MallPortalApplication` 加 `@EnableScheduling`：

```java
@Scheduled(fixedDelay = 30 * 60 * 1000)   // 上次执行完成后 30 分钟再跑
```

用 `fixedDelay` 而非 `cron`：一是上次没跑完不会叠加执行，二是避免所有实例都卡在 `:00` / `:30` 整点同时扫库。

**不把 `@Scheduled` 直接加在 `OmsPortalOrderServiceImpl.cancelTimeOutOrder()` 上**：该方法同时被 `POST /order/cancelTimeOutOrder` 调用，混入调度注解会让一个方法承担"业务逻辑"和"调度入口"两种职责。独立的 task 类也与参考实现一致（上次 MVP 迁移剥离的正是 `OrderTimeOutCancelTask`）。

分工：**MQ 管及时性，定时任务管最终一致性**。这是生产级标准做法。

两条路径的日志必须用不同措辞（如 MQ 侧 `process orderId:{}` vs 定时侧 `scheduled fallback cancelled {} orders`），便于验证时区分是谁关的单。

### ④ 无需额外处理的两点

- **幂等**：`cancelOrder` 以 `status=0 and delete_status=0` 为唯一触发条件，关单后 status 变 4，重复投递查不到。天然幂等，不需要 Redis 去重。
- **消息持久化**：Spring AMQP 的 `MessageProperties.DEFAULT_DELIVERY_MODE` 本就是 `PERSISTENT`，配合 durable 队列，broker 重启消息不丢。默认值站在我们这边，无需改代码。

## 已知局限：队头阻塞

TTL 队列中，RabbitMQ **只检查队首消息是否过期**。当前所有订单共用 `normal_order_overtime` 这一个配置值，TTL 全部相同，先进先过期，顺序天然正确，**本项目不受影响**。

但 `oms_order_setting` 表还有 `flash_order_overtime = 60`（秒杀订单，60 分钟）。若将来秒杀订单也走**同一个** TTL 队列：

```
队首：普通订单 TTL=120 分  ← RabbitMQ 只盯它
队尾：秒杀订单 TTL=60 分   ← 早该过期，但必须等前面那个先走
```

秒杀订单会被硬拖到 120 分钟才关单。届时的正确做法：**按超时时长拆独立 TTL 队列**（一个 60 分、一个 120 分），或换用延迟消息插件。

## 本地环境

### docker-compose.local.yml

```yaml
  rabbitmq:
    image: rabbitmq:3.9.11-management
    container_name: mall-rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"   # 管理界面
    environment:
      RABBITMQ_DEFAULT_USER: mall
      RABBITMQ_DEFAULT_PASS: mall
      RABBITMQ_DEFAULT_VHOST: /mall
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    restart: unless-stopped
```

`mall-portal` 服务补 `SPRING_RABBITMQ_HOST: rabbitmq` 与 `depends_on: rabbitmq`；文件末尾 `volumes:` 段补 `rabbitmq-data:`。

两个选择的理由：

- **用 `RABBITMQ_DEFAULT_*` 自动建 vhost 与用户**。参考实现配了 vhost `/mall` + 用户 `mall/mall`，但未交代如何创建（需手动 `rabbitmqctl add_vhost`）。用这三个环境变量让容器启动即就位，零手工步骤。
- **不用 guest/guest**。RabbitMQ 限制 guest 仅可从 loopback 登录，从宿主机浏览器开管理界面会被拒。自建用户直接绕开。

### application-dev.yml

```yaml
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    virtual-host: ${RABBITMQ_VHOST:/mall}
    username: ${RABBITMQ_USERNAME:mall}
    password: ${RABBITMQ_PASSWORD:mall}
    listener:
      simple:
        default-requeue-rejected: false
```

`${ENV:默认值}` 占位符 + compose 中以 `SPRING_` 前缀覆盖 host，与项目现有 redis 配置同一套路（`application-dev.yml:18-21` 用 `${REDIS_HOST:localhost}`，compose 中设 `SPRING_REDIS_HOST: redis`），不引入第三种风格。

## 验证

超时时间 120 分钟无法用于验证。**临时改数据库**，不加代码级开关：

```sql
UPDATE oms_order_setting SET normal_order_overtime = 1 WHERE id = 1;  -- 验证完改回 120
```

不加 `cancel-delay-override-ms` 这类配置项：一个只在本地用的开关，就多一条泄漏到生产的路径；改一行 SQL 零代码、零残留。改为 1 分钟后定时兜底（30 分钟）也会变激进，但本地反而更好——MQ 1 分钟就触发，定时任务 30 分钟后才跑，日志可清楚区分。

验证步骤：

1. `docker compose -f docker-compose.local.yml up -d --build`
2. 开 http://localhost:15672（mall/mall），确认 `/mall` 下 3 交换机 3 队列已自动声明
3. 执行上面的 SQL 把超时改为 1 分钟
4. 下单，立刻确认 `mall.order.cancel.ttl` 队列 `Ready = 1`
5. 等 1 分钟 → ttl 队列清空 → 日志出现 `process orderId:xxx`
6. 查库：`oms_order.status = 4`、`pms_sku_stock.lock_stock` 已回滚
7. **幂等反向验证**：再下一单，1 分钟内调 `POST /order/paySuccess`，等过期后确认订单仍为 `status=1`，未被误关
8. **broker 容错验证**：`docker stop mall-rabbitmq` 后下单，确认**下单仍然成功**，日志只有一条 error

## 测试策略

只加一个轻量单测：`CancelOrderSenderTest`，mock `AmqpTemplate`，断言

- exchange = `mall.order.direct.ttl`
- routingKey = `mall.order.cancel.ttl`
- `MessagePostProcessor` 确实把 `expiration` 设为传入的毫秒值

**只测这一处的理由**：发送参数是最容易写错、且错了最难发现的地方——路由键写错，消息会被**静默丢弃**，队列里什么都看不到，容易盯着空队列查很久。消费侧的 `cancelOrder` 是已有代码，不在本次改动范围；端到端行为靠上面的手工验证覆盖。

不引入 Testcontainers：给一个零测试的项目加 Docker-in-test 基础设施，成本远超本次收益。

## 误部署风险评估

因为选了"吞异常 + 定时兜底"，**即使生产环境没有 RabbitMQ，这份代码部署上去也不会坏**：Spring Boot 不会因连不上 broker 而启动失败，下单正常，关单由定时任务接管，仅日志周期性刷连接失败。误部署代价很低。
