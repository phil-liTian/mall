package com.phil.mall.portal.component;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.AmqpConnectException;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.core.MessagePostProcessor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

/**
 * 延迟取消消息发送参数的单测
 * 路由键/交换机写错时消息会被静默丢弃，这里做断言兜底
 */
@ExtendWith(MockitoExtension.class)
class CancelOrderSenderTest {

    @Mock
    private AmqpTemplate amqpTemplate;

    @InjectMocks
    private CancelOrderSender cancelOrderSender;

    @Test
    void sendMessageShouldUseTtlExchangeAndSetExpiration() {
        cancelOrderSender.sendMessage(1L, 60000L);

        ArgumentCaptor<MessagePostProcessor> postProcessorCaptor =
                ArgumentCaptor.forClass(MessagePostProcessor.class);
        verify(amqpTemplate).convertAndSend(
                eq("mall.order.direct.ttl"),
                eq("mall.order.cancel.ttl"),
                eq(1L),
                postProcessorCaptor.capture());

        Message message = MessageBuilder.withBody(new byte[0]).build();
        Message processed = postProcessorCaptor.getValue().postProcessMessage(message);
        assertThat(processed.getMessageProperties().getExpiration()).isEqualTo("60000");
    }

    @Test
    void sendMessageShouldSwallowExceptionWhenBrokerDown() {
        doThrow(new AmqpConnectException(new RuntimeException("connect refused")))
                .when(amqpTemplate).convertAndSend(
                        eq("mall.order.direct.ttl"),
                        eq("mall.order.cancel.ttl"),
                        eq(1L),
                        org.mockito.ArgumentMatchers.any(MessagePostProcessor.class));

        //broker 故障不得影响下单主流程
        assertThatCode(() -> cancelOrderSender.sendMessage(1L, 60000L))
                .doesNotThrowAnyException();
    }
}