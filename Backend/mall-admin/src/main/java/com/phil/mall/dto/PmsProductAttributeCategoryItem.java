package com.phil.mall.dto;

import com.phil.mall.model.PmsProductAttribute;
import com.phil.mall.model.PmsProductAttributeCategory;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 带有属性的商品属性分类
 */
public class PmsProductAttributeCategoryItem extends PmsProductAttributeCategory {
    @Getter
    @Setter
    @Schema(description = "商品属性列表")
    private List<PmsProductAttribute> productAttributeList;
}
