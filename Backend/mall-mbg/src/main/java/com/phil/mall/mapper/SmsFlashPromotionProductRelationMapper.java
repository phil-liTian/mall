package com.phil.mall.mapper;

import com.phil.mall.model.SmsFlashPromotionProductRelation;
import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface SmsFlashPromotionProductRelationMapper {
    int deleteByPrimaryKey(Long id);

    int insertSelective(SmsFlashPromotionProductRelation record);

    SmsFlashPromotionProductRelation selectByPrimaryKey(Long id);

    int updateByPrimaryKeySelective(SmsFlashPromotionProductRelation record);

    List<SmsFlashPromotionProductRelation> list(@Param("flashPromotionId") Long flashPromotionId,
                                                @Param("flashPromotionSessionId") Long flashPromotionSessionId,
                                                @Param("productId") Long productId);
}