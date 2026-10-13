package com.phil.mall.portal.component;

import com.phil.mall.portal.service.OmsPortalOrderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 超时订单关闭的定时兜底任务
 * 与 MQ 延迟消息配套：MQ 管及时性，定时任务管最终一致性
 * Created by macro on 2018/8/24.
 */
@Slf4j
@Component
public class OrderTimeOutCancelTask {
    @Autowired
    private OmsPortalOrderService portalOrderService;

    /**
     * 扫描超时未支付订单并关闭，上次执行完成后 30 分钟再跑
     */
    @Scheduled(fixedDelay = 30 * 60 * 1000)
    public void cancelTimeOutOrder() {
        Integer count = portalOrderService.cancelTimeOutOrder();
        if (count > 0) {
            log.info("scheduled fallback cancelled {} orders", count);
        }
    }
}