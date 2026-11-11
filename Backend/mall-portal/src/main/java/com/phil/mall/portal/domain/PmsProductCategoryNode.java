package com.phil.mall.portal.domain;

import com.phil.mall.model.PmsProductCategory;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 包含子分类的商品分类
 * Created by phil on 2026/10/9.
 */
@Getter
@Setter
public class PmsProductCategoryNode extends PmsProductCategory {
    @Schema(title = "子分类集合")
    private List<PmsProductCategoryNode> children;
}
