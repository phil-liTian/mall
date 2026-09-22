package com.phil.mall.dto;

import com.phil.mall.model.SmsCoupon;
import com.phil.mall.model.SmsCouponProductCategoryRelation;
import com.phil.mall.model.SmsCouponProductRelation;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 优惠券信息封装，包括绑定商品和分类
 */
public class SmsCouponParam extends SmsCoupon {
    @Getter
    @Setter
    private List<SmsCouponProductRelation> productRelationList;
    @Getter
    @Setter
    private List<SmsCouponProductCategoryRelation> productCategoryRelationList;
}
