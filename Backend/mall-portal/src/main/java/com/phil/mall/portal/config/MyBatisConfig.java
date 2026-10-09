package com.phil.mall.portal.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * MyBatis相关配置
 */
@Configuration
@EnableTransactionManagement
@MapperScan({"com.phil.mall.mapper", "com.phil.mall.portal.dao"})
public class MyBatisConfig {
}
