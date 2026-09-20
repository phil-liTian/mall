package com.phil.mall.dto;

import com.phil.mall.validator.FlagValidator;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotEmpty;
import java.util.List;

/**
 * 添加更新商品分类的参数
 * Created by macro on 2018/4/26.
 */
@Data
@EqualsAndHashCode
public class PmsProductCategoryParam {
    @Schema(description = "父分类的编号")
    private Long parentId;
    @NotEmpty
    @Schema(description = "商品分类名称")
    private String name;
    @Schema(description = "分类单位")
    private String productUnit;
    @FlagValidator(value = {"0","1"},message = "状态只能为0或1")
    @Schema(description = "是否在导航栏显示")
    private Integer navStatus;
    @FlagValidator(value = {"0","1"},message = "状态只能为0或1")
    @Schema(description = "是否进行显示")
    private Integer showStatus;
    @Min(value = 0)
    @Schema(description = "排序")
    private Integer sort;
    @Schema(description = "图标")
    private String icon;
    @Schema(description = "关键字")
    private String keywords;
    @Schema(description = "描述")
    private String description;
    @Schema(description = "商品相关筛选属性集合")
    private List<Long> productAttributeIdList;
}
