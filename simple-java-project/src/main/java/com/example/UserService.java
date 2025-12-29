/*
 * @Author: phil
 * @Date: 2025-12-25 13:17:33
 */
package com.example;

/**
 * 用户服务接口 - 定义用户相关的业务操作
 */
public interface UserService {
    
    /**
     * 根据用户ID获取用户信息
     * @param userId 用户ID
     * @return 用户名称，如果用户不存在返回null
     */
    String getUserById(Long userId);
    
    /**
     * 创建新用户
     * @param userName 用户名称
     * @param email 用户邮箱
     * @return 创建成功的用户ID
     */
    Long createUser(String userName, String email);
    
    /**
     * 更新用户信息
     * @param userId 用户ID
     * @param newUserName 新的用户名称
     * @return 更新是否成功
     */
    boolean updateUser(Long userId, String newUserName);
    
    /**
     * 删除用户
     * @param userId 用户ID
     * @return 删除是否成功
     */
    boolean deleteUser(Long userId);
}