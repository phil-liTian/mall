package com.phil.mall.portal.domain;

import com.phil.mall.model.OmsOrderReturnApply;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 售后申请，补上 MBG 实体里没有的两个新列
 * 这两列不在 MBG 产物中，读写只能走 PortalReturnApplyDao 的手写 SQL
 */
@Getter
@Setter
public class PortalReturnApply extends OmsOrderReturnApply {

    @Schema(title = "申请退货的订单项id")
    private Long orderItemId;

    @Schema(title = "会员id")
    private Long memberId;
}
