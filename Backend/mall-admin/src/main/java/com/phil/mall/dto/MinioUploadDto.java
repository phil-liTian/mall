package com.phil.mall.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 文件上传返回结果
 */
@Data
@EqualsAndHashCode
public class MinioUploadDto {
    @Schema(description = "文件访问URL")
    private String url;
    @Schema(description = "文件名称")
    private String name;
}
