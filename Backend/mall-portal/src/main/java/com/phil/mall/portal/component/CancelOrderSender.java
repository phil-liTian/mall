package com.phil.mall.portal.component;

import com.phil.mall.portal.domain.QueueEnum;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 取消订单消息的发送者
 * Created by macro on 2018/9/14.
 */
@Slf4j
@Component
public class CancelOrderSender {
    @Autowired
    private AmqpTemplate amqpTemplate;

    public void sendMessage(Long orderId, final long delayTimes) {
        try {
            //给延迟队列发送消息
            amqpTemplate.convertAndSend(QueueEnum.QUEUE_TTL_ORDER_CANCEL.getExchange(),
                    QueueEnum.QUEUE_TTL_ORDER_CANCEL.getRouteKey(), orderId, message -> {
                        //给消息设置延迟毫秒值
                        message.getMessageProperties().setExpiration(String.valueOf(delayTimes));
                        return message;
                    });
            log.info("send delay message orderId:{}", orderId);
        } catch (Exception e) {
            //broker 故障不得影响下单主流程，吞掉异常由定时任务兜底
            log.error("send delay message failed, orderId:{}", orderId, e);
        }
    }
}