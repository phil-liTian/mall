package com.phil.mall.portal.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import com.github.pagehelper.PageHelper;
import com.phil.mall.common.exception.Asserts;
import com.phil.mall.mapper.OmsOrderItemMapper;
import com.phil.mall.mapper.OmsOrderMapper;
import com.phil.mall.mapper.OmsOrderReturnReasonMapper;
import com.phil.mall.model.*;
import com.phil.mall.portal.dao.PortalReturnApplyDao;
import com.phil.mall.portal.domain.OmsReturnApplyParam;
import com.phil.mall.portal.domain.PortalReturnApply;
import com.phil.mall.portal.service.OmsPortalReturnApplyService;
import com.phil.mall.portal.service.UmsMemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * C端售后申请Service实现类
 */
@Service
public class OmsPortalReturnApplyServiceImpl implements OmsPortalReturnApplyService {

    /** 可申请售后的订单状态：2->已发货（破损件需要能申请）；3->已完成 */
    private static final int ORDER_STATUS_DELIVERED = 2;
    private static final int ORDER_STATUS_COMPLETED = 3;
    /** 订单完成后的售后时效，已发货未签收的不限 */
    private static final int RETURN_DAYS_AFTER_COMPLETED = 15;
    private static final int MAX_PROOF_PICS = 5;
    private static final int MAX_DESCRIPTION_LENGTH = 500;
    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");

    @Autowired
    private UmsMemberService memberService;
    @Autowired
    private OmsOrderMapper orderMapper;
    @Autowired
    private OmsOrderItemMapper orderItemMapper;
    @Autowired
    private OmsOrderReturnReasonMapper returnReasonMapper;
    @Autowired
    private PortalReturnApplyDao returnApplyDao;

    /** 凭证图必须是本站上传的地址，防止存入外链或 javascript: 伪协议 */
    @Value("${minio.publicUrl:${minio.endpoint}}")
    private String minioPublicUrl;

    @Override
    public void create(OmsReturnApplyParam param) {
        if (param.getOrderId() == null || param.getOrderItemId() == null) {
            Asserts.fail("请选择要申请售后的商品");
        }
        UmsMember member = memberService.getCurrentMember();
        OmsOrder order = orderMapper.selectByPrimaryKey(param.getOrderId());
        if (order == null || !member.getId().equals(order.getMemberId())
                || (order.getDeleteStatus() != null && order.getDeleteStatus() == 1)) {
            Asserts.fail("订单不存在");
        }
        OmsOrderItem orderItem = orderItemMapper.selectByPrimaryKey(param.getOrderItemId());
        if (orderItem == null || !param.getOrderId().equals(orderItem.getOrderId())) {
            Asserts.fail("订单中不存在该商品");
        }
        Integer orderStatus = order.getStatus();
        if (orderStatus == null
                || (orderStatus != ORDER_STATUS_DELIVERED && orderStatus != ORDER_STATUS_COMPLETED)) {
            Asserts.fail("当前订单状态不支持申请售后");
        }
        if (orderStatus == ORDER_STATUS_COMPLETED && isOutOfReturnPeriod(order)) {
            Asserts.fail("订单已超过" + RETURN_DAYS_AFTER_COMPLETED + "天售后期限");
        }
        if (returnApplyDao.countProcessing(param.getOrderItemId()) > 0) {
            Asserts.fail("该商品已提交过售后申请，请勿重复提交");
        }

        String reason = checkReason(param.getReason());
        String proofPics = checkProofPics(param.getProofPics());
        String description = StrUtil.trimToEmpty(param.getDescription());
        if (description.length() > MAX_DESCRIPTION_LENGTH) {
            Asserts.fail("问题描述不能超过" + MAX_DESCRIPTION_LENGTH + "字");
        }
        String returnName = StrUtil.trimToEmpty(param.getReturnName());
        if (StrUtil.isEmpty(returnName)) {
            Asserts.fail("请填写退货人姓名");
        }
        String returnPhone = StrUtil.trimToEmpty(param.getReturnPhone());
        if (!PHONE_PATTERN.matcher(returnPhone).matches()) {
            Asserts.fail("请填写正确的手机号");
        }

        PortalReturnApply apply = new PortalReturnApply();
        apply.setOrderId(order.getId());
        apply.setOrderItemId(orderItem.getId());
        apply.setMemberId(member.getId());
        apply.setOrderSn(order.getOrderSn());
        apply.setMemberUsername(member.getUsername());
        apply.setCreateTime(new Date());
        //0->待处理
        apply.setStatus(0);
        apply.setReason(reason);
        apply.setDescription(description);
        apply.setProofPics(proofPics);
        apply.setReturnName(returnName);
        apply.setReturnPhone(returnPhone);
        //商品信息与退款金额一律从订单项回填，不信客户端
        apply.setProductId(orderItem.getProductId());
        apply.setProductPic(orderItem.getProductPic());
        apply.setProductName(orderItem.getProductName());
        apply.setProductBrand(orderItem.getProductBrand());
        apply.setProductAttr(orderItem.getProductAttr());
        apply.setProductCount(orderItem.getProductQuantity());
        apply.setProductPrice(orderItem.getProductPrice());
        //realAmount 是单件实付价，退款金额按实付价乘数量
        BigDecimal realPrice = orderItem.getRealAmount() == null
                ? orderItem.getProductPrice() : orderItem.getRealAmount();
        apply.setProductRealPrice(realPrice);
        apply.setReturnAmount(realPrice.multiply(new BigDecimal(orderItem.getProductQuantity())));
        returnApplyDao.insert(apply);
    }

    @Override
    public List<PortalReturnApply> list(Integer status, Integer pageNum, Integer pageSize) {
        UmsMember member = memberService.getCurrentMember();
        PageHelper.startPage(pageNum, pageSize);
        return returnApplyDao.list(member.getId(), status);
    }

    @Override
    public PortalReturnApply detail(Long id) {
        UmsMember member = memberService.getCurrentMember();
        PortalReturnApply apply = returnApplyDao.getDetail(id, member.getId());
        if (apply == null) {
            Asserts.fail("售后申请不存在");
        }
        return apply;
    }

    @Override
    public void cancel(Long id) {
        UmsMember member = memberService.getCurrentMember();
        int count = returnApplyDao.cancel(id, member.getId());
        if (count == 0) {
            Asserts.fail("该申请已被处理，无法撤销");
        }
    }

    @Override
    public List<OmsOrderReturnReason> reasonList() {
        OmsOrderReturnReasonExample example = new OmsOrderReturnReasonExample();
        example.createCriteria().andStatusEqualTo(1);
        example.setOrderByClause("sort desc, id asc");
        return returnReasonMapper.selectByExample(example);
    }

    /**
     * 完成时间优先取确认收货时间，历史数据可能为空则退回最后修改时间
     */
    private boolean isOutOfReturnPeriod(OmsOrder order) {
        Date completedTime = order.getReceiveTime() != null ? order.getReceiveTime() : order.getModifyTime();
        if (completedTime == null) {
            return false;
        }
        long deadline = completedTime.getTime() + RETURN_DAYS_AFTER_COMPLETED * 24L * 60 * 60 * 1000;
        return System.currentTimeMillis() > deadline;
    }

    private String checkReason(String reason) {
        String trimmed = StrUtil.trimToEmpty(reason);
        if (StrUtil.isEmpty(trimmed)) {
            Asserts.fail("请选择退货原因");
        }
        boolean matched = reasonList().stream()
                .anyMatch(item -> trimmed.equals(item.getName()));
        if (!matched) {
            Asserts.fail("退货原因不可用，请重新选择");
        }
        return trimmed;
    }

    private String checkProofPics(List<String> proofPics) {
        if (CollUtil.isEmpty(proofPics)) {
            return null;
        }
        if (proofPics.size() > MAX_PROOF_PICS) {
            Asserts.fail("凭证图片最多" + MAX_PROOF_PICS + "张");
        }
        List<String> valid = proofPics.stream()
                .map(StrUtil::trimToEmpty)
                .filter(StrUtil::isNotEmpty)
                .collect(Collectors.toList());
        for (String pic : valid) {
            if (!pic.startsWith(minioPublicUrl)) {
                Asserts.fail("凭证图片地址不合法，请重新上传");
            }
        }
        return CollUtil.isEmpty(valid) ? null : String.join(",", valid);
    }
}
