# ============================================================
# mall-admin 多阶段构建
# 阶段1：用 Maven 编译打包（JDK 8）
# 阶段2：仅拷贝 jar 到精简 JRE 运行
# 构建：docker compose build（compose 中已指定 context/dockerfile）
# ============================================================

# ---------- build stage ----------
FROM maven:3.8-eclipse-temurin-8 AS build
WORKDIR /build
# 使用阿里云 Maven 镜像加速依赖下载
COPY settings-docker.xml /root/.m2/settings.xml
# 先拷贝所有模块的 pom，利用缓存预拉依赖
COPY pom.xml ./
COPY mall-common/pom.xml mall-common/
COPY mall-mbg/pom.xml mall-mbg/
COPY mall-security/pom.xml mall-security/
COPY mall-admin/pom.xml mall-admin/
RUN mvn -q -B dependency:go-offline -DskipTests || true
# 再拷贝源码进行打包
COPY . .
RUN mvn -q -B clean package -DskipTests

# ---------- run stage ----------
FROM eclipse-temurin:8-jre
WORKDIR /app
ENV TZ=Asia/Shanghai
COPY --from=build /build/mall-admin/target/mall-admin-*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "/app/app.jar"]