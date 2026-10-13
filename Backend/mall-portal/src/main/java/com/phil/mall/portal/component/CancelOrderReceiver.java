package com.phil.mall.portal.component;

import com.phil.mall.portal.service.OmsPortalOrderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitHandler;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 取消订单消息的接收者
 * Created by macro on 2018/9/14.
 */
@Slf4j
@Component
@RabbitListener(queues = "mall.order.cancel")
public class CancelOrderReceiver {
    @Autowired
    private OmsPortalOrderService portalOrderService;

    @RabbitHandler
    public void handle(Long orderId) {
        log.info("process orderId:{}", orderId);
        portalOrderService.cancelOrder(orderId);
    }
}