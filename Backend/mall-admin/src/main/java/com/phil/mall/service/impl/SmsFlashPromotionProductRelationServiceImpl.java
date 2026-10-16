package com.phil.mall.service.impl;

import com.phil.mall.dao.SmsFlashPromotionProductRelationDao;
import com.phil.mall.dto.SmsFlashPromotionProduct;
import com.phil.mall.mapper.SmsFlashPromotionProductRelationMapper;
import com.phil.mall.model.SmsFlashPromotionProductRelation;
import com.phil.mall.service.SmsFlashPromotionProductRelationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 限时购与商品关系管理Service实现类
 */
@Service
public class SmsFlashPromotionProductRelationServiceImpl implements SmsFlashPromotionProductRelationService {
    @Autowired
    private SmsFlashPromotionProductRelationMapper relationMapper;
    @Autowired
    private SmsFlashPromotionProductRelationDao relationDao;

    @Override
    public int create(List<SmsFlashPromotionProductRelation> relations) {
        int count = 0;
        for (SmsFlashPromotionProductRelation r : relations) {
            count += relationMapper.insertSelective(r);
        }
        return count;
    }

    @Override
    public int update(Long id, SmsFlashPromotionProductRelation relation) {
        relation.setId(id);
        return relationMapper.updateByPrimaryKeySelective(relation);
    }

    @Override
    public int delete(Long id) {
        return relationMapper.deleteByPrimaryKey(id);
    }

    @Override
    public SmsFlashPromotionProductRelation getItem(Long id) {
        return relationMapper.selectByPrimaryKey(id);
    }

    @Override
    public List<SmsFlashPromotionProduct> list(Long flashPromotionId, Long flashPromotionSessionId) {
        return relationDao.getList(flashPromotionId, flashPromotionSessionId);
    }
}