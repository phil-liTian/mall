package com.phil.mall.portal.dao;

import com.phil.mall.portal.domain.FlashPromotionRelationDetail;
import com.phil.mall.portal.domain.OmsOrderFlashRelation;
import org.apache.ibatis.annotations.Param;

/**
 * 秒杀相关自定义Dao（不重跑MBG，补两张秒杀表的定制SQL）
 */
public interface PortalFlashPromotionDao {
    /**
     * 查询当前可下单的秒杀商品关系（活动与场次均在有效期内）
     */
    FlashPromotionRelationDetail getAvailableRelation(@Param("id") Long id);

    /**
     * 按商品id查询当前可下单的秒杀商品关系（活动与场次均在有效期内）
     * 同时参与多个活动时返回配额充足的一条（id 最小的生效关系）
     */
    FlashPromotionRelationDetail getAvailableRelationByProductId(@Param("productId") Long productId);

    /**
     * 原子扣减秒杀配额，影响行数为0表示已抢完
     */
    int deductFlashQuota(@Param("id") Long id, @Param("quantity") Integer quantity);

    /**
     * 归还秒杀配额（取消订单时）
     */
    int returnFlashQuota(@Param("id") Long id, @Param("quantity") Integer quantity);

    /**
     * 会员在某秒杀关系下的累计购买量（未关闭订单）
     */
    Integer countFlashBoughtByMember(@Param("memberId") Long memberId, @Param("relationId") Long relationId);

    /**
     * 根据订单id查询秒杀关联记录
     */
    OmsOrderFlashRelation getOrderFlashRelationByOrderId(@Param("orderId") Long orderId);

    /**
     * 插入订单与秒杀配额的关联
     */
    int insertOrderFlashRelation(OmsOrderFlashRelation relation);
}