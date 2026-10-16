package com.phil.mall.service.impl;

import com.phil.mall.mapper.SmsFlashPromotionSessionMapper;
import com.phil.mall.model.SmsFlashPromotionSession;
import com.phil.mall.model.SmsFlashPromotionSessionExample;
import com.phil.mall.service.SmsFlashPromotionSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

/**
 * 限时购场次管理Service实现类
 */
@Service
public class SmsFlashPromotionSessionServiceImpl implements SmsFlashPromotionSessionService {
    @Autowired
    private SmsFlashPromotionSessionMapper sessionMapper;

    @Override
    public int create(SmsFlashPromotionSession session) {
        session.setCreateTime(new Date());
        return sessionMapper.insertSelective(session);
    }

    @Override
    public int update(Long id, SmsFlashPromotionSession session) {
        session.setId(id);
        return sessionMapper.updateByPrimaryKeySelective(session);
    }

    @Override
    public int delete(Long id) {
        return sessionMapper.deleteByPrimaryKey(id);
    }

    @Override
    public int updateStatus(Long id, Integer status) {
        SmsFlashPromotionSession session = new SmsFlashPromotionSession();
        session.setId(id);
        session.setStatus(status);
        return sessionMapper.updateByPrimaryKeySelective(session);
    }

    @Override
    public SmsFlashPromotionSession getItem(Long id) {
        return sessionMapper.selectByPrimaryKey(id);
    }

    @Override
    public List<SmsFlashPromotionSession> list() {
        SmsFlashPromotionSessionExample example = new SmsFlashPromotionSessionExample();
        example.setOrderByClause("start_time asc");
        return sessionMapper.selectByExample(example);
    }
}