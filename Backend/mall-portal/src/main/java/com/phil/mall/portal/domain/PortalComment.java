package com.phil.mall.portal.domain;

import com.phil.mall.model.PmsComment;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 商品评价，补上 MBG 实体里没有的三个新列
 * 这三列不在 MBG 产物中，读写只能走 PortalCommentDao 的手写 SQL
 */
@Getter
@Setter
public class PortalComment extends PmsComment {

    @Schema(title = "评价会员id")
    private Long memberId;

    @Schema(title = "来源订单id")
    private Long orderId;

    @Schema(title = "来源订单项id")
    private Long orderItemId;
}
