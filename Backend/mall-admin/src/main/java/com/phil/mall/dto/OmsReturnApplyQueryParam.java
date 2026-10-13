package com.phil.mall.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 订单退货申请查询参数
 */
@Getter
@Setter
public class OmsReturnApplyQueryParam {
    @Schema(description = "服务单号")
    private Long id;
    @Schema(description = "收货人姓名/号码")
    private String receiverKeyword;
    @Schema(description = "申请状态：0->待处理；1->退货中；2->已完成；3->已拒绝")
    private Integer status;
    @Schema(description = "申请时间")
    private String createTime;
    @Schema(description = "处理人员")
    private String handleMan;
    @Schema(description = "处理时间")
    private String handleTime;
}
