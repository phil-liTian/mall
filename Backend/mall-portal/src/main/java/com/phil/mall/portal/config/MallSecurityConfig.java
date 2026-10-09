package com.phil.mall.portal.config;

import com.phil.mall.portal.service.UmsMemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;

/**
 * mall-security 模块相关配置
 * ponytail: 提供基于 UmsMember 的会员版 UserDetailsService，供 JWT 过滤器使用
 */
@Configuration
public class MallSecurityConfig {

    @Autowired
    private UmsMemberService memberService;

    @Bean
    public UserDetailsService userDetailsService() {
        //获取登录会员信息
        return username -> memberService.loadUserByUsername(username);
    }
}
