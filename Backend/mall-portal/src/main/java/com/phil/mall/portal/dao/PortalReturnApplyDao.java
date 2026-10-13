package com.phil.mall.portal.dao;

import com.phil.mall.portal.domain.PortalReturnApply;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * C端售后申请自定义Dao
 * order_item_id / member_id 两列不在 MBG 产物中，故全部读写都在这里手写
 */
public interface PortalReturnApplyDao {

    /**
     * 新建售后申请
     */
    int insert(PortalReturnApply apply);

    /**
     * 当前会员的售后申请列表，status 为 null 时返回全部
     */
    List<PortalReturnApply> list(@Param("memberId") Long memberId, @Param("status") Integer status);

    /**
     * 按 id 取详情，带 memberId 条件以防越权读他人收货信息
     */
    PortalReturnApply getDetail(@Param("id") Long id, @Param("memberId") Long memberId);

    /**
     * 该订单项是否已有进行中（待处理/退货中/已完成）的申请，已拒绝的不算
     */
    int countProcessing(@Param("orderItemId") Long orderItemId);

    /**
     * 取消申请：物理删除，仅待处理状态可取消
     */
    int cancel(@Param("id") Long id, @Param("memberId") Long memberId);
}
