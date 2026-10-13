package com.phil.mall.portal.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 申请售后的入参
 * 退款金额、商品信息一律由服务端从订单项回填，不接受客户端传入
 */
@Getter
@Setter
public class OmsReturnApplyParam {

    @Schema(title = "订单id")
    private Long orderId;

    @Schema(title = "申请退货的订单项id")
    private Long orderItemId;

    @Schema(title = "退货原因，需匹配已启用的退货原因字典")
    private String reason;

    @Schema(title = "问题描述")
    private String description;

    @Schema(title = "凭证图片，最多5张")
    private List<String> proofPics;

    @Schema(title = "退货人姓名")
    private String returnName;

    @Schema(title = "退货人电话")
    private String returnPhone;
}
