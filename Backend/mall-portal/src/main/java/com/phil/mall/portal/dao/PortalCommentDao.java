package com.phil.mall.portal.dao;

import com.phil.mall.model.OmsOrderItem;
import com.phil.mall.portal.domain.PmsCommentStat;
import com.phil.mall.portal.domain.PortalComment;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * C端商品评价自定义Dao
 * member_id / order_id / order_item_id 三列不在 MBG 产物中，故全部读写都在这里手写
 */
public interface PortalCommentDao {

    /**
     * 整单评价批量入库
     */
    int batchInsert(@Param("list") List<PortalComment> list);

    /**
     * 商品的评价列表，仅返回已展示的；onlyPic 为 true 时只返回有图评价
     */
    List<PortalComment> listByProduct(@Param("productId") Long productId, @Param("onlyPic") Boolean onlyPic);

    /**
     * 商品评价的星级统计
     */
    PmsCommentStat getCommentStat(@Param("productId") Long productId);

    /**
     * 订单内尚未评价的商品
     */
    List<OmsOrderItem> listUncommentedItems(@Param("orderId") Long orderId);

    /**
     * 当前会员发表过的评价
     */
    List<PortalComment> listMyComment(@Param("memberId") Long memberId);
}
