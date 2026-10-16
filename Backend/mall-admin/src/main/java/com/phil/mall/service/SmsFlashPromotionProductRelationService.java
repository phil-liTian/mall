package com.phil.mall.service;

import com.phil.mall.dto.SmsFlashPromotionProduct;
import com.phil.mall.model.SmsFlashPromotionProductRelation;

import java.util.List;

/**
 * 限时购与商品关系管理Service
 */
public interface SmsFlashPromotionProductRelationService {
    int create(List<SmsFlashPromotionProductRelation> relations);

    int update(Long id, SmsFlashPromotionProductRelation relation);

    int delete(Long id);

    SmsFlashPromotionProductRelation getItem(Long id);

    /**
     * 批量根据活动/场次查询（含商品信息）
     */
    List<SmsFlashPromotionProduct> list(Long flashPromotionId, Long flashPromotionSessionId);
}