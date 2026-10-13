package com.phil.mall.portal.service;

import com.phil.mall.model.OmsOrderReturnReason;
import com.phil.mall.portal.domain.OmsReturnApplyParam;
import com.phil.mall.portal.domain.PortalReturnApply;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * C端售后申请Service
 */
public interface OmsPortalReturnApplyService {

    /**
     * 提交售后申请
     */
    @Transactional
    void create(OmsReturnApplyParam param);

    /**
     * 当前会员的售后申请列表
     */
    List<PortalReturnApply> list(Integer status, Integer pageNum, Integer pageSize);

    /**
     * 售后申请详情，只能看自己的
     */
    PortalReturnApply detail(Long id);

    /**
     * 撤销售后申请，仅待处理状态可撤销
     */
    void cancel(Long id);

    /**
     * 可选的退货原因
     */
    List<OmsOrderReturnReason> reasonList();
}
