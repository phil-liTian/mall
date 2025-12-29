package com.phil.mall.service.impl;

import com.phil.mall.service.UmsAdminService;
import org.springframework.stereotype.Service;

@Service
public class UmsAdminServiceImpl implements UmsAdminService {
  
  @Override
  public String login(String username, String password) {
    System.out.println("login");
    String token = null;
    return token;
  }
}