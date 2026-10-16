package com.phil.mall.portal.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 秒杀商品关系 + 关联活动/场次 查询结果。
 * 只有在活动与场次都处于有效期内时才会被查出。
 */
@Getter
@Setter
public class FlashPromotionRelationDetail {
    @Schema(title = "秒杀商品关系id")
    private Long id;
    private Long flashPromotionId;
    private Long flashPromotionSessionId;
    private Long productId;
    @Schema(title = "秒杀价格")
    private BigDecimal flashPromotionPrice;
    @Schema(title = "剩余秒杀配额")
    private Integer flashPromotionCount;
    @Schema(title = "每人限购数量")
    private Integer flashPromotionLimit;
}