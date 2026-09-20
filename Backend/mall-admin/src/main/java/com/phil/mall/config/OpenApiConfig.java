package com.phil.mall.config;

import com.phil.mall.common.config.BaseOpenApiConfig;
import org.springframework.context.annotation.Configuration;

/**
 * springdoc-openapi 配置
 * ponytail: 替代参考项目的 springfox SwaggerConfig，基于 BaseOpenApiConfig
 */
@Configuration
public class OpenApiConfig extends BaseOpenApiConfig {

    @Override
    public String title() {
        return "mall后台系统";
    }

    @Override
    public String description() {
        return "mall后台相关接口文档";
    }

    @Override
    public String contactName() {
        return "phil";
    }

    @Override
    public String contactUrl() {
        return "";
    }

    @Override
    public String contactEmail() {
        return "";
    }

    @Override
    public String version() {
        return "1.0";
    }
}
