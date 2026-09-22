package com.phil.mall.controller;

import com.phil.mall.common.api.CommonPage;
import com.phil.mall.common.api.CommonResult;
import com.phil.mall.model.SmsCouponHistory;
import com.phil.mall.service.SmsCouponHistoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

/**
 * 优惠券领取记录管理Controller
 */
@Controller
@Tag(name = "SmsCouponHistoryController", description = "优惠券领取记录管理")
@RequestMapping("/couponHistory")
public class SmsCouponHistoryController {
    @Autowired
    private SmsCouponHistoryService historyService;

    @RequestMapping(value = "/list", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<CommonPage<SmsCouponHistory>> list(@RequestParam(value = "couponId", required = false) Long couponId,
                                                           @RequestParam(value = "useStatus", required = false) Integer useStatus,
                                                           @RequestParam(value = "orderSn", required = false) String orderSn,
                                                           @RequestParam(value = "pageSize", defaultValue = "5") Integer pageSize,
                                                           @RequestParam(value = "pageNum", defaultValue = "1") Integer pageNum) {
        List<SmsCouponHistory> historyList = historyService.list(couponId, useStatus, orderSn, pageSize, pageNum);
        return CommonResult.success(CommonPage.restPage(historyList));
    }
}
