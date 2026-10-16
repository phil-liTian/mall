/*
 * @Author: phil
 * @Date: 2026-10-14 17:12:13
 */
package com.phil.mall.portal.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

/**
 * 秒杀订单与秒杀商品配额关联
 */
@Getter
@Setter
public class OmsOrderFlashRelation implements Serializable {
    private Long id;
    @Schema(title = "订单id")
    private Long orderId;
    @Schema(title = "秒杀商品关系id")
    private Long flashPromotionRelationId;
    private Long productSkuId;
    private Integer quantity;

    private static final long serialVersionUID = 1L;
}