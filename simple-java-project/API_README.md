# 🚀 用户服务REST API

## 📋 项目简介

本项目将原有的Java接口升级为Spring Boot REST API，提供HTTP接口供前端调用。支持完整的用户CRUD操作，并包含交互式测试页面。

## 🎯 API接口列表

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/users/health` | 健康检查 |
| GET | `/api/users` | 获取所有用户 |
| GET | `/api/users/{id}` | 根据ID获取用户 |
| POST | `/api/users` | 创建新用户 |
| PUT | `/api/users/{id}` | 更新用户信息 |
| DELETE | `/api/users/{id}` | 删除用户 |

## 🚀 快速开始

### 1. 启动应用

```bash
# 进入项目目录
cd simple-java-project

# 编译项目
mvn clean compile

# 启动Spring Boot应用
mvn spring-boot:run
```

### 2. 访问接口

应用启动后，可以通过以下方式访问：

- **测试页面**: http://localhost:8080/index.html
- **健康检查**: http://localhost:8080/api/users/health
- **API文档**: 通过测试页面可以交互式测试所有接口

### 3. 前端调用示例

#### 获取所有用户
```javascript
fetch('http://localhost:8080/api/users')
    .then(response => response.json())
    .then(users => console.log(users));
```

#### 创建新用户
```javascript
fetch('http://localhost:8080/api/users', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        name: '张三',
        email: 'zhangsan@example.com'
    })
})
.then(response => response.json())
.then(user => console.log(user));
```

#### 更新用户
```javascript
fetch('http://localhost:8080/api/users/1', {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        name: '李四'
    })
})
.then(response => response.json())
.then(user => console.log(user));
```

#### 删除用户
```javascript
fetch('http://localhost:8080/api/users/1', {
    method: 'DELETE'
})
.then(response => response.json())
.then(result => console.log(result));
```

## 📊 数据格式

### 用户对象 (User)
```json
{
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com"
}
```

### 响应格式
- **成功响应**: 返回相应的用户数据或状态信息
- **错误响应**: 返回404状态码（用户不存在）或400状态码（参数错误）

## 🔧 技术栈

- **后端框架**: Spring Boot 2.7.0
- **依赖注入**: Spring Framework
- **JSON处理**: Jackson
- **跨域支持**: Spring MVC CORS
- **前端测试**: HTML5 + JavaScript (Fetch API)

## 📁 项目结构

```
simple-java-project/
├── src/main/java/com/example/
│   ├── UserServiceApplication.java    # Spring Boot启动类
│   ├── UserService.java               # 用户服务接口
│   ├── UserServiceImpl.java           # 用户服务实现
│   ├── controller/
│   │   └── UserController.java        # REST控制器
│   └── model/
│       └── User.java                  # 用户实体类
├── src/main/resources/
│   ├── application.yml              # 应用配置
│   └── static/
│       └── index.html               # 测试页面
└── pom.xml                           # Maven配置
```

## 🌐 跨域支持

API已配置跨域支持（CORS），允许所有域名访问：
```java
@CrossOrigin(origins = "*")
```

## 🧪 测试

### 使用测试页面
1. 启动应用后访问 http://localhost:8080/index.html
2. 点击各个按钮测试对应的API接口
3. 查看实时响应结果

### 使用curl命令
```bash
# 健康检查
curl http://localhost:8080/api/users/health

# 获取所有用户
curl http://localhost:8080/api/users

# 创建用户
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"王五","email":"wangwu@example.com"}'
```

## 🔍 调试

- **日志级别**: 在application.yml中配置日志级别
- **开发工具**: 支持Spring Boot DevTools热部署
- **调试端口**: 应用运行在8080端口，管理端口在8081

## 📈 扩展建议

1. **数据库集成**: 添加MySQL/PostgreSQL支持
2. **数据验证**: 添加更严格的参数验证
3. **异常处理**: 添加全局异常处理
4. **API文档**: 集成Swagger/OpenAPI
5. **安全认证**: 添加JWT认证
6. **单元测试**: 添加完整的测试覆盖

## 📝 注意事项

- 当前使用内存存储，重启应用后数据会丢失
- 生产环境建议添加数据库支持
- 建议添加适当的错误处理和日志记录
- 考虑添加API限流和认证机制

## 👨‍💻 作者

phil  
2025-12-25