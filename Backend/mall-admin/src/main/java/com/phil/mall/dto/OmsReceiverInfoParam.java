package com.phil.mall.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 订单修改收货人信息参数
 */
@Getter
@Setter
public class OmsReceiverInfoParam {
    @Schema(description = "订单ID")
    private Long orderId;
    @Schema(description = "收货人姓名")
    private String receiverName;
    @Schema(description = "收货人电话")
    private String receiverPhone;
    @Schema(description = "收货人邮编")
    private String receiverPostCode;
    @Schema(description = "详细地址")
    private String receiverDetailAddress;
    @Schema(description = "省份/直辖市")
    private String receiverProvince;
    @Schema(description = "城市")
    private String receiverCity;
    @Schema(description = "区")
    private String receiverRegion;
    @Schema(description = "订单状态：0->待付款；1->待发货；2->已发货；3->已完成；4->已关闭；5->无效订单")
    private Integer status;
}
