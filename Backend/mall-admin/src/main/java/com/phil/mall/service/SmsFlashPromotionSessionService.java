package com.phil.mall.service;

import com.phil.mall.model.SmsFlashPromotionSession;
import java.util.List;

/**
 * 限时购场次管理Service
 */
public interface SmsFlashPromotionSessionService {
    int create(SmsFlashPromotionSession session);

    int update(Long id, SmsFlashPromotionSession session);

    int delete(Long id);

    int updateStatus(Long id, Integer status);

    SmsFlashPromotionSession getItem(Long id);

    List<SmsFlashPromotionSession> list();
}