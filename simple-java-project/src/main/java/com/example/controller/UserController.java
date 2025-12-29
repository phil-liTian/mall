/*
 * @Author: phil
 * @Date: 2025-12-25 13:17:33
 */
package com.example.controller;

import com.example.service.RedisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * 用户REST控制器
 * 暴露HTTP接口供前端调用
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // 支持跨域请求
public class UserController {

    @Autowired
    private RedisService redisService;

    /**
     * 健康检查接口
     * GET /api/users/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "User Service API");
        health.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(health);
    }

    /**
     * Redis测试 - 设置键值对
     * POST /api/users/redis/set
     */
    @PostMapping("/redis/set")
    public ResponseEntity<Map<String, Object>> redisSet(@RequestParam String key, @RequestParam String value) {
        Map<String, Object> response = new HashMap<>();
        try {
            redisService.set(key, value);
            response.put("success", true);
            response.put("message", "成功设置键值对: " + key + " = " + value);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "设置键值对失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Redis测试 - 获取值
     * GET /api/users/redis/get
     */
    @GetMapping("/redis/get")
    public ResponseEntity<Map<String, Object>> redisGet(@RequestParam String key) {
        Map<String, Object> response = new HashMap<>();
        try {
            Object value = redisService.get(key);
            if (value != null) {
                response.put("success", true);
                response.put("message", "键 " + key + " 的值: " + value.toString());
                response.put("value", value);
            } else {
                response.put("success", true);
                response.put("message", "键 " + key + " 不存在");
                response.put("value", null);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取值失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Redis数据库操作 - 保存用户数据到Redis
     * POST /api/users/redis/save-user
     */
    @PostMapping("/redis/save-user")
    public ResponseEntity<Map<String, Object>> redisSaveUser(@RequestParam String userId,
                                                            @RequestParam String username,
                                                            @RequestParam String email) {
        Map<String, Object> response = new HashMap<>();
        try {
            // 构建用户数据
            Map<String, String> userData = new HashMap<>();
            userData.put("username", username);
            userData.put("email", email);
            userData.put("createdTime", String.valueOf(System.currentTimeMillis()));
            
            // 使用Hash结构存储用户数据，便于后续查询和更新
            String userKey = "user:" + userId;
            redisService.set(userKey + ":username", username);
            redisService.set(userKey + ":email", email);
            redisService.set(userKey + ":createdTime", String.valueOf(System.currentTimeMillis()));
            
            // 将用户ID添加到用户列表中，便于获取所有用户
            redisService.set("users:list:" + userId, username);
            
            response.put("success", true);
            response.put("message", "用户数据成功保存到Redis数据库");
            response.put("userId", userId);
            response.put("username", username);
            response.put("email", email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "保存用户数据失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    

    /**
     * Redis数据库操作 - 从Redis获取用户数据
     * GET /api/users/redis/get-user
     */
    @GetMapping("/redis/get-user")
    public ResponseEntity<Map<String, Object>> redisGetUser(@RequestParam String userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            String userKey = "user:" + userId;
            String username = (String) redisService.get(userKey + ":username");
            String email = (String) redisService.get(userKey + ":email");
            String createdTime = (String) redisService.get(userKey + ":createdTime");
            
            if (username != null) {
                Map<String, Object> userData = new HashMap<>();
                userData.put("userId", userId);
                userData.put("username", username);
                userData.put("email", email);
                userData.put("createdTime", createdTime);
                
                response.put("success", true);
                response.put("message", "成功获取用户数据");
                response.put("userData", userData);
            } else {
                response.put("success", false);
                response.put("message", "用户不存在");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取用户数据失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Redis数据库操作 - 获取所有用户列表
     * GET /api/users/redis/get-all-users
     */
    @GetMapping("/redis/get-all-users")
    public ResponseEntity<Map<String, Object>> redisGetAllUsers() {
        Map<String, Object> response = new HashMap<>();
        try {
            // 这里简化处理，实际项目中可能需要使用Redis的SCAN命令
            response.put("success", true);
            response.put("message", "获取用户列表功能需要实现Redis键扫描");
            response.put("users", new ArrayList<>());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取用户列表失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Redis测试 - 测试Redis连接
     * GET /api/users/redis/test
     */
    @GetMapping("/redis/test")
    public ResponseEntity<Map<String, Object>> redisTestConnection() {
        Map<String, Object> response = new HashMap<>();
        try {
            // 测试写入和读取
            String testKey = "test:connection";
            String testValue = "Redis连接成功！";
            
            redisService.set(testKey, testValue);
            Object result = redisService.get(testKey);
            redisService.delete(testKey);
            
            if (testValue.equals(result)) {
                response.put("success", true);
                response.put("message", "Redis连接测试成功！数据库名称: mall，地址: localhost:6379");
            } else {
                response.put("success", false);
                response.put("message", "Redis连接测试失败：值不匹配");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Redis连接测试失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}