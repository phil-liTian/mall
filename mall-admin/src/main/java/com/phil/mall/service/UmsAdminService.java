package com.phil.mall.service;

/*
 * @Author: phil
 * @Date: 2025-12-29 13:54:36
 */



public interface UmsAdminService {

  /**
 * 登录功能
 * @param username 用户名
 * @param password 密码
 * @return 生成的JWT的token
 */
  String login(String username, String password);
}