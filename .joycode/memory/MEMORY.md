- [容器运行时是 Colima 而非 Docker Desktop](env_container_runtime.md) — 本机 docker/docker compose 底层由 Colima 提供,配置与镜像加速改法特殊

- [Colima 下跨架构构建 amd64 镜像的 buildx 配置](env_crossbuild_buildx.md) — 在 Mac(arm64/Colima) 上为京东云 amd64 服务器交叉编译 docker 镜像的环境配置

- [Maven 需显式指定 JDK 17 编译（Lombok 与 JDK 25 不兼容）](env_java_maven.md) — 本机 mvn 默认跑在 Homebrew JDK 25 上,Loembok 1.18.30 注解处理会静默失效,编译必须 JAVA_HOME 指向 JDK 17
