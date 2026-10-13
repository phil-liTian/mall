package com.phil.mall.portal.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 单个商品的评价内容
 * 商品名、属性、昵称、头像、展示状态全部由服务端回填，不接受客户端传入
 */
@Getter
@Setter
public class PmsCommentItemParam {

    @Schema(title = "订单项id")
    private Long orderItemId;

    @Schema(title = "评分，1-5")
    private Integer star;

    @Schema(title = "评价内容")
    private String content;

    @Schema(title = "晒图，最多5张")
    private List<String> pics;
}
