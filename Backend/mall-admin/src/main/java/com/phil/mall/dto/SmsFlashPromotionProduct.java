package com.phil.mall.dto;

import com.phil.mall.model.SmsFlashPromotionProductRelation;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 秒杀活动关联商品（带商品信息）。在 SmsFlashPromotionProductRelation 基础上
 * 扩展商品名称、货号、原价、库存、PIC 等字段。
 */
@Getter
@Setter
public class SmsFlashPromotionProduct extends SmsFlashPromotionProductRelation {
    @Schema(description = "商品名称")
    private String productName;
    @Schema(description = "货号")
    private String productSn;
    @Schema(description = "商品原价")
    private BigDecimal productPrice;
    @Schema(description = "商品主图")
    private String productPic;
    @Schema(description = "商品库存")
    private Integer productStock;
}