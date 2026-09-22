<!--
 * @Author: phil
 * @Date: 2026-09-20 14:05:58
-->
# Docker 启动说明

mall-admin 用 Docker 运行三个中间件：**MySQL 8 + Redis 7 + MinIO**。应用本身（Spring Boot）不进容器，用 Maven 在本机跑。

编排文件：`Backend/docker-compose.yml`

## 前置条件

- 安装 Docker Desktop 并启动
- 端口未被占用：`3306`（MySQL）、`6379`（Redis）、`9000/9001`（MinIO）

## 一键启动

```bash
cd /Users/litian.phil/phil/java/mall/Backend
docker compose up -d
```

首次启动 MySQL 会自动执行 `sql/mall-admin.sql` 建库建表并写入初始数据（约 10~20s）。

## 服务清单

| 服务 | 容器名 | 端口 | 账号 | 说明 |
|------|--------|------|------|------|
| MySQL | mall-mysql | 3306 | root / root | 库名 `mall`，首次启动自动初始化 |
| Redis | mall-redis | 6379 | 无密码 | 开启 AOF 持久化 |
| MinIO | mall-minio | 9000 (API) / 9001 (控制台) | minioadmin / minioadmin | 自动创建 bucket `mall` 并设为可下载 |

这些端口/账号与 `mall-admin/src/main/resources/application-dev.yml` 一一对应，无需改配置。

## 常用命令

```bash
docker compose ps                 # 查看容器状态，应均为 running/healthy
docker compose logs -f mysql      # 跟踪 MySQL 日志，看到 "ready for connections" 即就绪
docker compose stop               # 停止（保留数据）
docker compose start              # 再次启动
docker compose down               # 停止并删除容器（数据卷保留）
docker compose down -v            # 停止并删除容器 + 数据卷（彻底清空，慎用）
```

## 验证就绪

```bash
# MySQL：确认库表已建好
docker exec -it mall-mysql mysql -uroot -proot -e "use mall; show tables;"

# Redis
docker exec -it mall-redis redis-cli ping        # 返回 PONG

# MinIO 控制台
open http://localhost:9001                       # 用 minioadmin/minioadmin 登录
```

## 数据持久化

数据存放在 Docker 命名卷（`docker-compose.yml` 底部 `volumes:`）：

- `mysql-data`、`redis-data`、`minio-data`

`docker compose down` 不会删除这些卷；只有 `down -v` 才会。**注意**：`mall-admin.sql` 只在 MySQL 卷为空的首次启动时执行，重新执行初始化脚本需先 `docker compose down -v` 再 `up`。

## 常见问题

- **端口被占用**：`lsof -i :3306` 查出占用进程，停掉它或改 `docker-compose.yml` 的宿主机端口映射（如 `"13306:3306"`，同时改 `application-dev.yml`）。
- **连接 MySQL 报 Public Key Retrieval**：应用侧 URL 已带 `allowPublicKeyRetrieval=true`，若用其他客户端连接需自行加上。
- **改了 SQL 但表没变**：初始化脚本只跑一次，须 `docker compose down -v` 清空数据卷后重启。
- **MinIO 没有 bucket**：`docker compose logs minio` 看启动脚本是否执行成功；也可登录控制台手动建 `mall`。

## 启动后

中间件就绪后，编译并启动应用：

```bash
cd /Users/litian.phil/phil/java/mall/Backend
mvn clean install -DskipTests
cd mall-admin && mvn spring-boot:run
```

访问 `http://localhost:8082/swagger-ui/index.html`。完整启动与冒烟测试见 [RUN.md](RUN.md)。


mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://mirrors.aliyun.com",
  ]
}
EOF
