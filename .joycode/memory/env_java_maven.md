---
name: Maven 需显式指定 JDK 17 编译（Lombok 与 JDK 25 不兼容）
description: >-
  本机 mvn 默认跑在 Homebrew JDK 25 上,Loembok 1.18.30 注解处理会静默失效,编译必须 JAVA_HOME 指向 JDK
  17
type: project
---

Backend（com.phil.mall）用 Maven 编译时必须显式指定 JAVA_HOME 为 JDK 17,例如:

```bash
cd Backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn -pl mall-portal -am compile -DskipTests
```

**Why:** Homebrew 安装的 Maven 3.9.12 默认使用 openjdk 25.0.1 运行,而项目依赖的 Lombok 1.18.30 不支持 JDK 23+,注解处理器静默失效,javac 报出大量"找不到符号:方法 getXxx()/setXxx()"的假错误（并非代码问题）。本机可用 JDK: 17.0.20.1 (Microsoft)、17.0.19、17.0.13 (Temurin 默认 java 命令,但 mvn 不用它)、corretto-18、11。

**How to apply:** 本机执行任何 mvn 编译/打包前先 `JAVA_HOME=$(/usr/libexec/java_home -v 17)`;若看到海量 getter/setter "找不到符号"错误,优先怀疑是 Lombok + JDK 版本不兼容而非代码缺陷。另外,单独 `mvn -pl mall-portal compile`(不带 -am)会因本地 .m2 中 1.0-SNAPSHOT 依赖 jar 过期而报缺包,需用 `-am` 走 reactor 或先 install。