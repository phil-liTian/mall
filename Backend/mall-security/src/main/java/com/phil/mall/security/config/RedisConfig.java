package com.phil.mall.security.config;

import com.phil.mall.common.config.BaseRedisConfig;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

/**
 * Redis相关配置
 */
@EnableCaching
@Configuration
public class RedisConfig extends BaseRedisConfig {

}
