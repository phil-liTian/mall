# 简单Java项目 - Spring Boot风格

这是一个基础的Java项目示例，采用Spring Boot架构，展示了如何组织、编译和运行一个简单的Java服务应用。

## 项目结构

```
simple-java-project/
├── pom.xml                      # Maven项目描述文件
├── README.md                    # 项目说明文档
├── MAVEN_INSTALL_GUIDE.md       # Maven安装指南
├── RUN_INSTRUCTIONS.md          # 运行指引
├── API_README.md                # API接口说明
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           ├── UserServiceApplication.java     # 主启动类
│   │   │           ├── UserService.java               # 服务接口
│   │   │           ├── UserServiceImpl.java           # 服务实现
│   │   │           ├── config/
│   │   │           │   ├── CorsConfig.java            # 跨域配置
│   │   │           │   └── RedisConfig.java           # Redis配置
│   │   │           ├── controller/
│   │   │           │   ├── ProductController.java     # 产品控制器
│   │   │           │   └── UserController.java        # 用户控制器
│   │   │           ├── model/
│   │   │           │   ├── Product.java               # 产品实体
│   │   │           │   └── User.java                  # 用户实体
│   │   │           ├── repository/
│   │   │           │   └── ProductRepository.java     # 产品仓储
│   │   │           ├── service/
│   │   │           │   ├── ProductService.java        # 产品服务
│   │   │           │   └── RedisService.java          # Redis服务
│   ├── resources/
│   │   ├── application.yml            # 应用配置
│   │   └── static/
│   │       ├── demo.html              # 演示页面
│   │       └── product-demo.html      # 产品演示页面
│   └── target/                        # 编译输出
```

## 主要模块说明

- **主启动类**：[`UserServiceApplication.java`](simple-java-project/src/main/java/com/example/UserServiceApplication.java:1) 启动Spring Boot应用
- **服务层**：定义业务接口[`UserService.java`](simple-java-project/src/main/java/com/example/UserService.java:1)，实现类[`UserServiceImpl.java`](simple-java-project/src/main/java/com/example/UserServiceImpl.java:1)
- **配置类**：跨域配置[`CorsConfig.java`](simple-java-project/src/main/java/com/example/config/CorsConfig.java:1)、Redis配置[`RedisConfig.java`](simple-java-project/src/main/java/com/example/config/RedisConfig.java:1)
- **控制器**：用户控制器[`UserController.java`](simple-java-project/src/main/java/com/example/controller/UserController.java:1)、产品控制器[`ProductController.java`](simple-java-project/src/main/java/com/example/controller/ProductController.java:1)
- **模型类**：用户模型[`User.java`](simple-java-project/src/main/java/com/example/model/User.java:1)、产品模型[`Product.java`](simple-java-project/src/main/java/com/example/model/Product.java:1)
- **仓储类**：产品仓储[`ProductRepository.java`](simple-java-project/src/main/java/com/example/repository/ProductRepository.java:1)
- **服务类**：产品服务[`ProductService.java`](simple-java-project/src/main/java/com/example/service/ProductService.java:1)、Redis服务[`RedisService.java`](simple-java-project/src/main/java/com/example/service/RedisService.java:1)
- **资源文件**：应用配置[`application.yml`](simple-java-project/src/main/resources/application.yml:1)、静态页面[`demo.html`](simple-java-project/src/main/resources/static/demo.html:1)、[`product-demo.html`](simple-java-project/src/main/resources/static/product-demo.html:1)

## 构建与运行

1. **编译项目**
   ```bash
   mvn clean package
   ```
2. **运行项目**
   ```bash
   java -jar target/*.jar
   ```
3. **访问接口与页面**
   - REST接口详见 [`API_README.md`](simple-java-project/API_README.md:1)
   - 运行后可通过浏览器访问静态页面

## 环境要求

- JDK 8 及以上
- Maven 3.6+
- 推荐使用IDEA或Eclipse

## 学习要点

- Spring Boot项目结构与约定
- 控制层、服务层、模型层分离
- 配置与依赖管理
- Maven项目标准化

---

本项目适合Spring Boot与Java入门实践，欢迎扩展更多业务模块和功能！