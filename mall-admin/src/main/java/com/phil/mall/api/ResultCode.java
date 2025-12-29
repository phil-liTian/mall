/*
 * @Author: phil
 * @Date: 2025-12-29 14:22:42
 */
package com.phil.mall.api;

public enum ResultCode {
  SUCCESS(200, "操作成功");

  private long code;
  private String message;

  ResultCode(long code, String message) {
    this.code = code;
    this.message = message;
  }

  public long getCode() {
    return code;
  }

  public String getMessage() {
    return message;
  }
}