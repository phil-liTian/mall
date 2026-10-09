package com.phil.mall.portal.domain;

import com.phil.mall.model.OmsOrder;
import com.phil.mall.model.OmsOrderItem;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 包含商品信息的订单详情
 * Created by macro on 2018/9/4.
 */
@Getter
@Setter
public class OmsOrderDetail extends OmsOrder {
    @Schema(title = "订单商品列表")
    private List<OmsOrderItem> orderItemList;
}
