package com.phil.mall.portal.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * 商品评价的星级统计，实时聚合，不在商品表冗余字段
 */
@Getter
@Setter
public class PmsCommentStat {

    @Schema(title = "评价总数")
    private Long total;

    @Schema(title = "平均星级")
    private BigDecimal avgStar;

    @Schema(title = "好评数（4星及以上）")
    private Long goodCount;

    @Schema(title = "有图评价数")
    private Long picCount;
}
