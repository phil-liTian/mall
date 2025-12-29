/*
 * @Author: phil
 * @Date: 2025-12-29 14:53:58
 */
package com.phil.mall.common.api;

public class CommonResult<T> {
  private long code;
  private String message;
  private T data;

  public CommonResult(long code, String message, T data) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  public static <T> CommonResult<T> success(T data) {
    return new CommonResult<>(ResultCode.SUCCESS.getCode(), ResultCode.SUCCESS.getMessage(), data);
  }

  public static <T> CommonResult<T> failed(String message) {
    return new CommonResult<>(ResultCode.FAILED.getCode(), message, null);
  }

  public long getCode() {
    return code;
  }

  public String getMessage() {
    return message;
  }

  public T getData() {
    return data;
  }
}