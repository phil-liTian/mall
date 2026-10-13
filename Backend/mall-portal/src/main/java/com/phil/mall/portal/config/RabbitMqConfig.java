/*
 * @Author: phil
 * @Date: 2026-10-12 17:58:37
 */
package com.phil.mall.portal.config;

import com.phil.mall.portal.domain.QueueEnum;
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 消息队列配置（订单超时取消，TTL + DLX 拓扑）
 * Created by macro on 2018/9/14.
 */
@Configuration
public class RabbitMqConfig {

    /**
     * 订单消息实际消费队列所绑定的交换机
     */
    @Bean
    DirectExchange orderDirect() {
        return (DirectExchange) ExchangeBuilder
                .directExchange(QueueEnum.QUEUE_ORDER_CANCEL.getExchange())
                .durable(true)
                .build();
    }

    /**
     * 订单延迟队列所绑定的交换机
     */
    @Bean
    DirectExchange orderTtlDirect() {
        return (DirectExchange) ExchangeBuilder
                .directExchange(QueueEnum.QUEUE_TTL_ORDER_CANCEL.getExchange())
                .durable(true)
                .build();
    }

    /**
     * 订单取消死信队列所绑定的交换机
     */
    @Bean
    DirectExchange orderDlxDirect() {
        return (DirectExchange) ExchangeBuilder
                .directExchange(QueueEnum.QUEUE_DLQ_ORDER_CANCEL.getExchange())
                .durable(true)
                .build();
    }

    /**
     * 订单实际消费队列；消费失败不重投，进入死信队列留痕
     */
    @Bean
    public Queue orderQueue() {
        return QueueBuilder.durable(QueueEnum.QUEUE_ORDER_CANCEL.getName())
                .withArgument("x-dead-letter-exchange", QueueEnum.QUEUE_DLQ_ORDER_CANCEL.getExchange())
                .withArgument("x-dead-letter-routing-key", QueueEnum.QUEUE_DLQ_ORDER_CANCEL.getRouteKey())
                .build();
    }

    /**
     * 订单延迟队列（无消费者，TTL 过期后经 DLX 转发到消费队列）
     */
    @Bean
    public Queue orderTtlQueue() {
        return QueueBuilder.durable(QueueEnum.QUEUE_TTL_ORDER_CANCEL.getName())
                .withArgument("x-dead-letter-exchange", QueueEnum.QUEUE_ORDER_CANCEL.getExchange())
                .withArgument("x-dead-letter-routing-key", QueueEnum.QUEUE_ORDER_CANCEL.getRouteKey())
                .build();
    }

    /**
     * 订单取消死信队列（消费失败消息的最终落点，待人工处理）
     */
    @Bean
    public Queue orderDlqQueue() {
        return QueueBuilder.durable(QueueEnum.QUEUE_DLQ_ORDER_CANCEL.getName())
                .build();
    }

    @Bean
    public Binding orderBinding() {
        return BindingBuilder.bind(orderQueue())
                .to(orderDirect())
                .with(QueueEnum.QUEUE_ORDER_CANCEL.getRouteKey());
    }

    @Bean
    public Binding orderTtlBinding() {
        return BindingBuilder.bind(orderTtlQueue())
                .to(orderTtlDirect())
                .with(QueueEnum.QUEUE_TTL_ORDER_CANCEL.getRouteKey());
    }

    @Bean
    public Binding orderDlqBinding() {
        return BindingBuilder.bind(orderDlqQueue())
                .to(orderDlxDirect())
                .with(QueueEnum.QUEUE_DLQ_ORDER_CANCEL.getRouteKey());
    }
}