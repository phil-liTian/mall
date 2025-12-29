# 🚀 运行指南

## 📋 前提条件

由于当前环境没有安装Maven，您需要：

1. **安装Maven** (推荐)
   ```bash
   # macOS
   brew install maven
   
   # Ubuntu/Debian
   sudo apt-get install maven
   
   # Windows
   # 下载地址: https://maven.apache.org/download.cgi
   ```

2. **或者** 手动下载Spring Boot依赖JAR包（不推荐，过程复杂）

## 🎯 快速启动步骤

### 步骤1: 安装Maven后运行

```bash
# 1. 进入项目目录
cd simple-java-project

# 2. 编译项目
mvn clean compile

# 3. 启动Spring Boot应用
mvn spring-boot:run
```

### 步骤2: 验证应用启动

应用启动成功后，您会看到类似输出：
```
Tomcat started on port(s): 8080 (http)
Started UserServiceApplication in 3.521 seconds
```

### 步骤3: 访问接口

- **测试页面**: http://localhost:8080/index.html
- **健康检查**: http://localhost:8080/api/users/health
- **API接口**: http://localhost:8080/api/users

## 🧪 测试API

### 使用浏览器测试
1. 打开 http://localhost:8080/index.html
2. 点击"测试健康检查"按钮
3. 如果看到返回JSON数据，说明API正常工作

### 使用curl命令测试
```bash
# 健康检查
curl http://localhost:8080/api/users/health

# 获取所有用户
curl http://localhost:8080/api/users

# 创建用户
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"张三","email":"zhangsan@example.com"}'
```

## 📊 接口文档

### REST API端点

| 方法 | 路径 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/api/users/health` | 健康检查 | 无 | `{"status":"UP","service":"User Service API"}` |
| GET | `/api/users` | 获取所有用户 | 无 | `[{"id":1,"name":"张三","email":"zhangsan@example.com"}]` |
| GET | `/api/users/{id}` | 根据ID获取用户 | 无 | `{"id":1,"name":"张三","email":"zhangsan@example.com"}` |
| POST | `/api/users` | 创建新用户 | `{"name":"张三","email":"zhangsan@example.com"}` | `{"id":3,"name":"张三","email":"zhangsan@example.com"}` |
| PUT | `/api/users/{id}` | 更新用户信息 | `{"name":"李四"}` | `{"id":1,"name":"李四","email":"zhangsan@example.com"}` |
| DELETE | `/api/users/{id}` | 删除用户 | 无 | `{"success":true,"message":"用户删除成功"}` |

## 🔧 前端调用示例

### JavaScript (Fetch API)
```javascript
// 获取所有用户
fetch('http://localhost:8080/api/users')
    .then(response => response.json())
    .then(users => console.log(users));

// 创建用户
fetch('http://localhost:8080/api/users', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name: '张三', email: 'zhangsan@example.com'})
})
.then(response => response.json())
.then(user => console.log(user));
```

### jQuery
```javascript
// 获取用户
$.get('http://localhost:8080/api/users/1', function(user) {
    console.log(user);
});

// 创建用户
$.ajax({
    url: 'http://localhost:8080/api/users',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({name: '张三', email: 'zhangsan@example.com'}),
    success: function(user) {
        console.log(user);
    }
});
```

### Vue.js
```javascript
// 在Vue组件中
methods: {
    async getUsers() {
        try {
            const response = await fetch('http://localhost:8080/api/users');
            const users = await response.json();
            this.users = users;
        } catch (error) {
            console.error('获取用户失败:', error);
        }
    },
    
    async createUser(userData) {
        try {
            const response = await fetch('http://localhost:8080/api/users', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(userData)
            });
            const newUser = await response.json();
            this.users.push(newUser);
        } catch (error) {
            console.error('创建用户失败:', error);
        }
    }
}
```

## 🌐 跨域支持

✅ **已配置跨域支持** - API支持所有域名的跨域请求

```java
@CrossOrigin(origins = "*")  // 允许所有域名访问
```

这意味着您可以从任何前端应用（不同的端口、域名）调用这些API接口。

## 📝 注意事项

1. **数据存储**: 当前使用内存存储，重启应用后数据会丢失
2. **端口占用**: 确保8080端口未被其他应用占用
3. **Java版本**: 需要Java 11或更高版本
4. **Maven版本**: 建议使用Maven 3.6或更高版本

## 🐛 常见问题

### Q: 应用启动失败怎么办？
A: 检查：
- Java版本是否正确（需要Java 11+）
- 8080端口是否被占用
- Maven是否正确安装

### Q: 前端无法调用API？
A: 检查：
- API是否已启动（访问健康检查接口）
- 浏览器控制台是否有跨域错误
- 请求URL是否正确

### Q: 如何修改端口号？
A: 编辑 `src/main/resources/application.yml` 文件：
```yaml
server:
  port: 8081  # 修改为其他端口
```

## 📞 支持

如有问题，请检查应用日志或联系开发者。

## 👨‍💻 作者

phil  
2025-12-25