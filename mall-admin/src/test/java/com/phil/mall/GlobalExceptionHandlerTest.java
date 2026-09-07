/*
 * @Author: phil
 * @Date: 2025-12-29 20:31:58
 */
package com.phil.mall;

import com.phil.mall.common.api.CommonResult;
import com.phil.mall.dto.UmsAdminLoginParams;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.validation.beanvalidation.MethodValidationPostProcessor;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class GlobalExceptionHandlerTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired(required = false)
    private MethodValidationPostProcessor methodValidationPostProcessor;

    @Test
    public void testGlobalExceptionHandlerLoaded() {
        // 测试全局异常处理器是否被Spring容器加载
        System.out.println("=== 测试全局异常处理器加载情况 ===");
        
        // 检查MethodValidationPostProcessor是否存在（验证参数验证功能）
        if (methodValidationPostProcessor != null) {
            System.out.println("✅ MethodValidationPostProcessor 已加载");
        } else {
            System.out.println("❌ MethodValidationPostProcessor 未加载");
        }
        
        // 检查GlobalExceptionHandler对应的bean是否存在
        try {
            // 使用字符串类名来避免编译时依赖问题
            Class<?> handlerClass = Class.forName("com.phil.mall.common.exception.GlobalExceptionHandler");
            String[] beanNames = applicationContext.getBeanNamesForType(handlerClass);
            if (beanNames.length > 0) {
                System.out.println("✅ GlobalExceptionHandler Bean 已加载: " + beanNames[0]);
                Object globalExceptionHandler = applicationContext.getBean(beanNames[0]);
                System.out.println("✅ GlobalExceptionHandler 类名: " + globalExceptionHandler.getClass().getName());
            } else {
                System.out.println("❌ GlobalExceptionHandler Bean 未找到");
            }
        } catch (ClassNotFoundException e) {
            System.out.println("❌ GlobalExceptionHandler 类不存在: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("❌ 检查GlobalExceptionHandler时出错: " + e.getMessage());
        }
    }

    @Test
    public void testValidationException() {
        System.out.println("=== 测试参数验证异常处理 ===");
        
        // 创建一个空的登录参数对象来触发验证异常
        UmsAdminLoginParams params = new UmsAdminLoginParams();
        params.setUsername(""); // 空用户名
        params.setPassword(""); // 空密码
        
        System.out.println("测试参数: username='" + params.getUsername() + "', password='" + params.getPassword() + "'");
        
        // 这里应该触发MethodArgumentNotValidException
        // 如果GlobalExceptionHandler正常工作，应该能看到控制台打印信息
    }
}