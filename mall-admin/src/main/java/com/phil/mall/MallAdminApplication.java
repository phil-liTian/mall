/*
 * @Author: phil
 * @Date: 2025-12-29 12:47:38
 */
package com.phil.mall;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.phil.mall", "com.phil.mall.common", "com.phil.mall.common.exception"})
public class MallAdminApplication {
   public static void main(String[] args) {
      SpringApplication.run(MallAdminApplication.class, args);
   }
}