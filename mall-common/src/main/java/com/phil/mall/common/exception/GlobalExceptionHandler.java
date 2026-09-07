/*
 * @Author: phil
 * @Date: 2025-12-29 20:02:56
 */

package com.phil.mall.common.exception;

import com.phil.mall.common.api.CommonResult;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(value = MethodArgumentNotValidException.class)
  public CommonResult<String> handleValidException(MethodArgumentNotValidException e) {
    
    BindingResult bindingResult = e.getBindingResult();
    String message = null;

    if (bindingResult.hasErrors()) {
      List<FieldError> fieldErrors = bindingResult.getFieldErrors();
      System.out.println("找到 " + fieldErrors.size() + " 个字段错误");
      
      if (!fieldErrors.isEmpty()) {
        // 获取所有字段错误信息
        message = fieldErrors.stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        
        System.out.println("错误信息: " + message);
      }
    }

    System.out.println("返回消息: " + (message != null ? message : "参数验证失败"));
    return CommonResult.failed(message != null ? message : "参数验证失败");
  }

  @ExceptionHandler(value = Exception.class)
  public CommonResult<String> handleException(Exception e) {
    System.out.println("=== GlobalExceptionHandler 捕获到 Exception: " + e.getClass().getSimpleName() + " ===");
    System.out.println("异常消息: " + e.getMessage());
    return CommonResult.failed("系统异常: " + e.getMessage());
  }
}