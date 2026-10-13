package com.phil.mall.dto;

import com.phil.mall.model.OmsCompanyAddress;
import com.phil.mall.model.OmsOrderReturnApply;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 订单退货申请结果封装
 */
public class OmsOrderReturnApplyResult extends OmsOrderReturnApply {
    @Getter
    @Setter
    @Schema(description = "公司收货地址")
    private OmsCompanyAddress companyAddress;
}
