/*
 * @Author: phil
 * @Date: 2025-12-25 13:17:33
 */
package com.example;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 用户服务接口的实现类
 * 使用内存存储模拟数据库操作
 */
@Service
public class UserServiceImpl implements UserService {
    
    // 模拟数据库存储
    private static final Map<Long, String> userDatabase = new HashMap<>();
    private static final Map<Long, String> userEmailDatabase = new HashMap<>();
    
    // 自增ID生成器
    private static final AtomicLong idGenerator = new AtomicLong(1);
    
    static {
        // 初始化一些测试数据
        userDatabase.put(1L, "张三");
        userEmailDatabase.put(1L, "zhangsan@example.com");
        userDatabase.put(2L, "李四");
        userEmailDatabase.put(2L, "lisi@example.com");
        idGenerator.set(3L); // 设置下一个ID从3开始
    }
    
    @Override
    public String getUserById(Long userId) {
        System.out.println("执行getUserById操作，用户ID: " + userId);
        return userDatabase.get(userId);
    }
    
    @Override
    public Long createUser(String userName, String email) {
        System.out.println("执行createUser操作，用户名: " + userName + ", 邮箱: " + email);
        
        // 参数验证
        if (userName == null || userName.trim().isEmpty()) {
            throw new IllegalArgumentException("用户名不能为空");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("邮箱不能为空");
        }
        
        // 生成新ID
        Long newId = idGenerator.getAndIncrement();
        
        // 保存用户数据
        userDatabase.put(newId, userName);
        userEmailDatabase.put(newId, email);
        
        System.out.println("用户创建成功，分配ID: " + newId);
        return newId;
    }
    
    @Override
    public boolean updateUser(Long userId, String newUserName) {
        System.out.println("执行updateUser操作，用户ID: " + userId + ", 新用户名: " + newUserName);
        
        // 参数验证
        if (userId == null) {
            throw new IllegalArgumentException("用户ID不能为空");
        }
        if (newUserName == null || newUserName.trim().isEmpty()) {
            throw new IllegalArgumentException("新用户名不能为空");
        }
        
        // 检查用户是否存在
        if (!userDatabase.containsKey(userId)) {
            System.out.println("用户不存在，ID: " + userId);
            return false;
        }
        
        // 更新用户信息
        userDatabase.put(userId, newUserName);
        System.out.println("用户更新成功，ID: " + userId);
        return true;
    }
    
    @Override
    public boolean deleteUser(Long userId) {
        System.out.println("执行deleteUser操作，用户ID: " + userId);
        
        // 参数验证
        if (userId == null) {
            throw new IllegalArgumentException("用户ID不能为空");
        }
        
        // 检查用户是否存在
        if (!userDatabase.containsKey(userId)) {
            System.out.println("用户不存在，ID: " + userId);
            return false;
        }
        
        // 删除用户数据
        userDatabase.remove(userId);
        userEmailDatabase.remove(userId);
        System.out.println("用户删除成功，ID: " + userId);
        return true;
    }
    
    /**
     * 获取所有用户信息（辅助方法，用于演示）
     */
    public void printAllUsers() {
        System.out.println("\n=== 当前所有用户 ===");
        if (userDatabase.isEmpty()) {
            System.out.println("暂无用户数据");
        } else {
            userDatabase.forEach((id, name) -> {
                String email = userEmailDatabase.get(id);
                System.out.println("ID: " + id + ", 姓名: " + name + ", 邮箱: " + email);
            });
        }
        System.out.println("==================\n");
    }
}