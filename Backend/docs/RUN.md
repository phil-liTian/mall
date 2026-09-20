# mall-admin 启动与冒烟测试

## 前置环境

- JDK 8+（实测 JDK 11 可编译运行；JDK 17 也可，需加 `--add-opens` 兼容参数，建议用 JDK 8/11）
- Maven 3.6+
- Docker Desktop（提供 MySQL / Redis / MinIO）

## 1. 启动中间件

```bash
cd /Users/litian.phil/phil/java/mall/Backend
docker compose up -d
```

启动后检查三个容器均为 `running`：

```bash
docker compose ps
```

| 服务 | 端口 | 说明 |
|------|------|------|
| MySQL | 3306 | root/root，首次启动自动执行 `sql/mall-admin.sql` 建库建表+初始数据 |
| Redis | 6379 | 无密码 |
| MinIO | 9000(API) / 9001(控制台) | minioadmin/minioadmin，自动创建 bucket `mall` |

> 首次启动 MySQL 需等它跑完 init sql（约 10~20s）。查看进度：
> `docker compose logs -f mysql`，看到 `ready for connections` 即可。

## 2. 编译

```bash
cd /Users/litian.phil/phil/java/mall/Backend
mvn clean install -DskipTests
```

成功标志：`BUILD SUCCESS`，产出 `mall-admin/target/mall-admin-1.0-SNAPSHOT.jar`。

## 3. 启动 mall-admin

```bash
cd mall-admin
mvn spring-boot:run
# 或
java -jar target/mall-admin-1.0-SNAPSHOT.jar
```

成功标志：日志出现 `Started MallAdminApplication in x seconds`，监听 `8082`。

## 4. 冒烟测试清单

> ponytail: 不写 JUnit，用以下手动冒烟清单覆盖核心链路。

### 4.1 登录（白名单接口）

```bash
curl -s -X POST http://localhost:8082/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"123456"}'
```

- [ ] 返回 `code:200`，body 含 `data.token`（以 `Bearer ` 开头）
- [ ] 错误密码返回 `code:401` 或 `用户名或密码错误`

保存 token：

```bash
TOKEN=$(curl -s -X POST http://localhost:8082/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"123456"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
echo $TOKEN
```

### 4.2 获取当前用户信息（鉴权接口）

```bash
curl -s http://localhost:8082/admin/info -H "Authorization: $TOKEN"
```

- [ ] 返回 `username: admin`、`roles` 含 `超级管理员`、`menus` 非空

### 4.3 动态权限校验

带 token 访问资源接口（ums_resource 中配置了 url→权限）：

```bash
curl -s http://localhost:8082/resource/list -H "Authorization: $TOKEN"
```

- [ ] 返回 `code:200` 与资源列表
- [ ] 不带 token 访问，返回 `401` / `未登录`（`RestAuthenticationEntryPoint`）

### 4.4 商品 CRUD（PMS）

```bash
# 品牌列表
curl -s "http://localhost:8082/brand/list?pageNum=1&pageSize=5" -H "Authorization: $TOKEN"
# 商品分类（带子分类）
curl -s http://localhost:8082/productCategory/list/withChildren -H "Authorization: $TOKEN"
# 商品列表
curl -s "http://localhost:8082/product/list?pageNum=1&pageSize=5" -H "Authorization: $TOKEN"
```

- [ ] 三个接口均 `code:200`，分页数据非空

### 4.5 文件上传（MinIO）

```bash
# 准备一张测试图
echo "test" > /tmp/test.txt
curl -s -X POST http://localhost:8082/minio/upload \
  -H "Authorization: $TOKEN" \
  -F "file=@/tmp/test.txt"
```

- [ ] 返回 `code:200`，`data` 为可访问的文件 URL
- [ ] 浏览器访问该 URL（MinIO bucket `mall` 已设为匿名下载）能拿到文件

### 4.6 OpenAPI 文档

浏览器打开：

```
http://localhost:8082/swagger-ui/index.html
```

- [ ] 页面正常加载，标题 `mall后台系统`
- [ ] 能看到 `admin` / `brand` / `product` / `resource` 等分组接口
- [ ] 右上角 Authorize 输入 `Bearer <token>` 后，可直接在页面调试鉴权接口

### 4.7 Druid 监控

```
http://localhost:8082/druid/index.html
```

- [ ] 用 `druid / druid` 登录，能看到 SQL 监控数据

## 5. 停止与清理

```bash
# 停止应用：Ctrl+C 或 kill 进程
# 停止中间件
docker compose down
# 清理数据卷（⚠️ 会删除所有数据，仅重置时用）
docker compose down -v
```

## 6. 常见问题

| 现象 | 原因 | 解决 |
|------|------|------|
| 启动报 `Communications link failure` | MySQL 未就绪 | `docker compose logs mysql` 等到 ready 再启应用 |
| 登录返回 `密码错误` | 数据未初始化 | 确认 `mall-admin.sql` 已执行：`docker exec mall-mysql mysql -uroot -proot -e 'use mall; show tables;'` |
| 上传返回 `bucket does not exist` | MinIO bucket 未建 | `docker exec mall-minio mc mb -p local/mall` |
| 404 swagger-ui | springdoc 路径 | 本项目用 `/swagger-ui/index.html`（非老的 `/swagger-ui.html`） |
| JDK17 启动报模块限制 | 反射受限 | 加 JVM 参数 `--add-opens java.base/java.lang=ALL-UNNAMED` 等，或直接用 JDK 8/11 |
