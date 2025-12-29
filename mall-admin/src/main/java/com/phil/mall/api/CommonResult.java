package com.phil.mall.api;

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