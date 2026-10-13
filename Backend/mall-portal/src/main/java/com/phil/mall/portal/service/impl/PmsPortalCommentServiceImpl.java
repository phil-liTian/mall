package com.phil.mall.portal.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import com.github.pagehelper.PageHelper;
import com.phil.mall.common.exception.Asserts;
import com.phil.mall.mapper.OmsOrderMapper;
import com.phil.mall.model.OmsOrder;
import com.phil.mall.model.OmsOrderItem;
import com.phil.mall.model.UmsMember;
import com.phil.mall.portal.dao.PortalCommentDao;
import com.phil.mall.portal.domain.PmsCommentItemParam;
import com.phil.mall.portal.domain.PmsCommentParam;
import com.phil.mall.portal.domain.PmsCommentStat;
import com.phil.mall.portal.domain.PortalComment;
import com.phil.mall.portal.service.PmsPortalCommentService;
import com.phil.mall.portal.service.UmsMemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * C端商品评价Service实现类
 */
@Service
public class PmsPortalCommentServiceImpl implements PmsPortalCommentService {

    /** 只有已完成的订单可以评价 */
    private static final int ORDER_STATUS_COMPLETED = 3;
    private static final int MAX_PICS = 5;
    private static final int MAX_CONTENT_LENGTH = 500;
    private static final int MIN_STAR = 1;
    private static final int MAX_STAR = 5;

    @Autowired
    private UmsMemberService memberService;
    @Autowired
    private OmsOrderMapper orderMapper;
    @Autowired
    private PortalCommentDao commentDao;

    /** 晒图必须是本站上传的地址，防止存入外链或伪协议 */
    @Value("${minio.publicUrl:${minio.endpoint}}")
    private String minioPublicUrl;

    @Override
    public void create(PmsCommentParam param, String memberIp) {
        if (param.getOrderId() == null || CollUtil.isEmpty(param.getItems())) {
            Asserts.fail("请填写评价内容");
        }
        UmsMember member = memberService.getCurrentMember();
        OmsOrder order = orderMapper.selectByPrimaryKey(param.getOrderId());
        if (order == null || !member.getId().equals(order.getMemberId())
                || (order.getDeleteStatus() != null && order.getDeleteStatus() == 1)) {
            Asserts.fail("订单不存在");
        }
        if (order.getStatus() == null || order.getStatus() != ORDER_STATUS_COMPLETED) {
            Asserts.fail("订单完成后才能评价");
        }

        List<Long> orderItemIds = param.getItems().stream()
                .map(PmsCommentItemParam::getOrderItemId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        if (orderItemIds.size() != param.getItems().size()) {
            Asserts.fail("评价内容有误，请重新提交");
        }
        if (new HashSet<>(orderItemIds).size() != orderItemIds.size()) {
            Asserts.fail("同一商品不能重复评价");
        }

        //一次查询同时解决「订单项是否属于该订单」和「是否已评价」
        Map<Long, OmsOrderItem> uncommentedMap = commentDao.listUncommentedItems(param.getOrderId())
                .stream().collect(Collectors.toMap(OmsOrderItem::getId, Function.identity()));

        Date now = new Date();
        String nickName = StrUtil.isNotBlank(member.getNickname()) ? member.getNickname() : member.getUsername();
        List<PortalComment> commentList = new ArrayList<>();
        for (PmsCommentItemParam itemParam : param.getItems()) {
            OmsOrderItem orderItem = uncommentedMap.get(itemParam.getOrderItemId());
            if (orderItem == null) {
                Asserts.fail("该商品不存在或已评价过");
            }
            PortalComment comment = new PortalComment();
            comment.setMemberId(member.getId());
            comment.setOrderId(order.getId());
            comment.setOrderItemId(orderItem.getId());
            comment.setProductId(orderItem.getProductId());
            comment.setMemberNickName(nickName);
            comment.setMemberIcon(member.getIcon());
            comment.setMemberIp(memberIp);
            comment.setProductName(orderItem.getProductName());
            comment.setProductAttribute(orderItem.getProductAttr());
            comment.setStar(clampStar(itemParam.getStar()));
            comment.setContent(checkContent(itemParam.getContent()));
            comment.setPics(checkPics(itemParam.getPics()));
            comment.setCreateTime(now);
            //无需审核，提交即展示
            comment.setShowStatus(1);
            //显式置 0，避免前端对 null 做自增
            comment.setCollectCouont(0);
            comment.setReadCount(0);
            comment.setReplayCount(0);
            commentList.add(comment);
        }
        try {
            commentDao.batchInsert(commentList);
        } catch (DuplicateKeyException e) {
            //并发双击时由 uk_order_item 兜底
            Asserts.fail("该商品已评价过了");
        }
    }

    @Override
    public List<PortalComment> list(Long productId, Boolean onlyPic, Integer pageNum, Integer pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        return commentDao.listByProduct(productId, onlyPic);
    }

    @Override
    public PmsCommentStat stat(Long productId) {
        PmsCommentStat stat = commentDao.getCommentStat(productId);
        if (stat == null) {
            stat = new PmsCommentStat();
            stat.setTotal(0L);
            stat.setAvgStar(BigDecimal.ZERO);
            stat.setGoodCount(0L);
            stat.setPicCount(0L);
        }
        return stat;
    }

    @Override
    public List<PortalComment> myList(Integer pageNum, Integer pageSize) {
        UmsMember member = memberService.getCurrentMember();
        PageHelper.startPage(pageNum, pageSize);
        return commentDao.listMyComment(member.getId());
    }

    @Override
    public List<OmsOrderItem> listUncommented(Long orderId) {
        UmsMember member = memberService.getCurrentMember();
        OmsOrder order = orderMapper.selectByPrimaryKey(orderId);
        if (order == null || !member.getId().equals(order.getMemberId())) {
            Asserts.fail("订单不存在");
        }
        return commentDao.listUncommentedItems(orderId);
    }

    private Integer clampStar(Integer star) {
        if (star == null || star < MIN_STAR) {
            return MIN_STAR;
        }
        return star > MAX_STAR ? MAX_STAR : star;
    }

    private String checkContent(String content) {
        String trimmed = StrUtil.trimToEmpty(content);
        if (trimmed.length() > MAX_CONTENT_LENGTH) {
            Asserts.fail("评价内容不能超过" + MAX_CONTENT_LENGTH + "字");
        }
        return trimmed;
    }

    private String checkPics(List<String> pics) {
        if (CollUtil.isEmpty(pics)) {
            return null;
        }
        if (pics.size() > MAX_PICS) {
            Asserts.fail("晒图最多" + MAX_PICS + "张");
        }
        List<String> valid = pics.stream()
                .map(StrUtil::trimToEmpty)
                .filter(StrUtil::isNotEmpty)
                .collect(Collectors.toList());
        for (String pic : valid) {
            if (!pic.startsWith(minioPublicUrl)) {
                Asserts.fail("图片地址不合法，请重新上传");
            }
        }
        return CollUtil.isEmpty(valid) ? null : String.join(",", valid);
    }
}
