/*
 * @Author: phil
 * @Date: 2025-12-29 20:02:56
 */

package com.phil.mall.common.exception;

import com.phil.mall.common.api.CommonResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(value = MethodArgumentNotValidException.class)
  public CommonResult<String> handleValidException(MethodArgumentNotValidException e) {
    BindingResult bindingResult = e.getBindingResult();
    String message = null;

    if (bindingResult.hasErrors()) {
      List<FieldError> fieldErrors = bindingResult.getFieldErrors();
      
      if (!fieldErrors.isEmpty()) {
        // 获取所有字段错误信息
        message = fieldErrors.stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        
      }
  }

  return CommonResult.validateFailed(message != null ? message : "参数验证失败");
  }

  @ExceptionHandler(value = Exception.class)
  public CommonResult<String> handleException(Exception e) {
    // 记录异常日志
    log.error("系统异常: ", e);
    // 返回友好的错误信息，避免暴露技术细节
    return CommonResult.failed("系统繁忙，请稍后重试");
  }

  @ResponseBody
  @ExceptionHandler(value = BindException.class)
  public CommonResult handleValidException(BindException e) {
      BindingResult bindingResult = e.getBindingResult();
      String message = null;
      if (bindingResult.hasErrors()) {
          FieldError fieldError = bindingResult.getFieldError();
          if (fieldError != null) {
              message = fieldError.getField()+fieldError.getDefaultMessage();
          }
      }
      return CommonResult.failed(message);
  }
}