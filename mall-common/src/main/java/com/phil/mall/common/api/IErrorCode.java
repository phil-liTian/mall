/*
 * @Author: phil
 * @Date: 2025-12-29 20:48:13
 */
package com.phil.mall.common.api;

/**
 * API返回码接口
 */
public interface IErrorCode {
    /**
     * 返回码
     */
    long getCode();

    /**
     * 返回信息
     */
    String getMessage();
}
