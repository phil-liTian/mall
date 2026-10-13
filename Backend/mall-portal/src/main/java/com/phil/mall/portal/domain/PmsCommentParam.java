package com.phil.mall.portal.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 整单评价入参，一次提交订单内全部待评价商品
 */
@Getter
@Setter
public class PmsCommentParam {

    @Schema(title = "订单id")
    private Long orderId;

    @Schema(title = "各商品的评价内容")
    private List<PmsCommentItemParam> items;
}
