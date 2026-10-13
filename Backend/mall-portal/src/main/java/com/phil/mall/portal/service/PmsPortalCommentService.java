package com.phil.mall.portal.service;

import com.phil.mall.model.OmsOrderItem;
import com.phil.mall.portal.domain.PmsCommentParam;
import com.phil.mall.portal.domain.PmsCommentStat;
import com.phil.mall.portal.domain.PortalComment;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * C端商品评价Service
 */
public interface PmsPortalCommentService {

    /**
     * 整单评价，一个事务内全部落库
     */
    @Transactional
    void create(PmsCommentParam param, String memberIp);

    /**
     * 商品的评价列表
     */
    List<PortalComment> list(Long productId, Boolean onlyPic, Integer pageNum, Integer pageSize);

    /**
     * 商品的星级统计
     */
    PmsCommentStat stat(Long productId);

    /**
     * 当前会员发表过的评价
     */
    List<PortalComment> myList(Integer pageNum, Integer pageSize);

    /**
     * 订单内尚未评价的商品
     */
    List<OmsOrderItem> listUncommented(Long orderId);
}
