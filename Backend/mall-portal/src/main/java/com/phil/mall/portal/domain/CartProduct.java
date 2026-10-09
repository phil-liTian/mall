package com.phil.mall.portal.domain;

import com.phil.mall.model.PmsProduct;
import com.phil.mall.model.PmsProductAttribute;
import com.phil.mall.model.PmsSkuStock;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 购物车中带商品属性和SKU库存的商品对象
 * Created by macro on 2018/8/2.
 */
@Getter
@Setter
public class CartProduct extends PmsProduct {
    @Schema(title = "商品属性列表")
    private List<PmsProductAttribute> productAttributeList;
    @Schema(title = "商品SKU库存列表")
    private List<PmsSkuStock> skuStockList;
}
