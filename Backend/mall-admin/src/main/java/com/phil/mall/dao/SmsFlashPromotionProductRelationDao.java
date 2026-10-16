package com.phil.mall.dao;

import com.phil.mall.dto.SmsFlashPromotionProduct;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 限时购与商品关系管理自定义Dao
 */
public interface SmsFlashPromotionProductRelationDao {
    /**
     * 获取某活动/场次下的秒杀商品列表（含商品信息）
     */
    List<SmsFlashPromotionProduct> getList(@Param("flashPromotionId") Long flashPromotionId,
                                            @Param("flashPromotionSessionId") Long flashPromotionSessionId);
}