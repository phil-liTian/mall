package com.phil.mall.dto;

import com.phil.mall.model.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 创建和修改商品的请求参数
 * ponytail: CMS（专题/优选专区）不在本阶段范围，已移除 subjectProductRelationList / prefrenceAreaProductRelationList
 */
@Data
@EqualsAndHashCode
public class PmsProductParam extends PmsProduct{
    @Schema(description = "商品阶梯价格设置")
    private List<PmsProductLadder> productLadderList;
    @Schema(description = "商品满减价格设置")
    private List<PmsProductFullReduction> productFullReductionList;
    @Schema(description = "商品会员价格设置")
    private List<PmsMemberPrice> memberPriceList;
    @Schema(description = "商品的sku库存信息")
    private List<PmsSkuStock> skuStockList;
    @Schema(description = "商品参数及自定义规格属性")
    private List<PmsProductAttributeValue> productAttributeValueList;
}
