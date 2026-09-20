package com.phil.mall.common.domain;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Controller层的日志封装类
 */
@Data
@EqualsAndHashCode
public class WebLog {
    private String description;
    private String username;
    private Long startTime;
    private Integer spendTime;
    private String basePath;
    private String uri;
    private String url;
    private String method;
    private String ip;
    private Object parameter;
    private Object result;
}
