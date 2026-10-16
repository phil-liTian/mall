package com.phil.mall.portal.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 秒杀下单请求参数
 * 注意：价格一律由服务端从秒杀关系表取，本对象不接受任何价格字段
 */
@Getter
@Setter
public class FlashOrderParam {
    @Schema(title = "秒杀商品关系id")
    private Long flashPromotionRelationId;
    @Schema(title = "商品skuId")
    private Long productSkuId;
    @Schema(title = "购买数量")
    private Integer quantity;
    @Schema(title = "收货地址id")
    private Long memberReceiveAddressId;
    @Schema(title = "支付方式：0->未支付；1->支付宝；2->微信")
    private Integer payType;
}