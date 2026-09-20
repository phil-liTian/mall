package com.phil.mall.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;

/**
 * springdoc-openapi 基础配置
 * 子类通过覆盖 openApiInfo() / apiBasePackage() 自定义
 */
public abstract class BaseOpenApiConfig {

    @Bean
    public OpenAPI createRestApi() {
        return new OpenAPI()
                .info(apiInfo())
                .components(new Components()
                        .addSecuritySchemes("Authorization",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.APIKEY)
                                        .in(SecurityScheme.In.HEADER)
                                        .name("Authorization")));
    }

    private io.swagger.v3.oas.models.info.Info apiInfo() {
        return new Info()
                .title(title())
                .description(description())
                .contact(new Contact().name(contactName()).url(contactUrl()).email(contactEmail()))
                .version(version());
    }

    public abstract String title();

    public abstract String description();

    public abstract String contactName();

    public abstract String contactUrl();

    public abstract String contactEmail();

    public abstract String version();
}
