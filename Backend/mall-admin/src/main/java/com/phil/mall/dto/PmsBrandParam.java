package com.phil.mall.dto;

import com.phil.mall.validator.FlagValidator;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotEmpty;

/**
 * 品牌请求参数
 */
@Data
@EqualsAndHashCode
public class PmsBrandParam {
    @NotEmpty
    @Schema(description = "品牌名称")
    private String name;
    @Schema(description = "品牌首字母")
    private String firstLetter;
    @Min(value = 0)
    @Schema(description = "排序字段")
    private Integer sort;
    @FlagValidator(value = {"0","1"}, message = "厂家状态不正确")
    @Schema(description = "是否为厂家制造商")
    private Integer factoryStatus;
    @FlagValidator(value = {"0","1"}, message = "显示状态不正确")
    @Schema(description = "是否进行显示")
    private Integer showStatus;
    @NotEmpty
    @Schema(description = "品牌logo")
    private String logo;
    @Schema(description = "品牌大图")
    private String bigPic;
    @Schema(description = "品牌故事")
    private String brandStory;
}
