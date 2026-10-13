package com.phil.mall.portal.controller;

import com.phil.mall.common.api.CommonPage;
import com.phil.mall.common.api.CommonResult;
import com.phil.mall.model.OmsOrderReturnReason;
import com.phil.mall.portal.domain.OmsReturnApplyParam;
import com.phil.mall.portal.domain.PortalReturnApply;
import com.phil.mall.portal.service.OmsPortalReturnApplyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * C端售后申请Controller
 */
@Controller
@Tag(name = "OmsPortalReturnApplyController", description = "售后申请")
@RequestMapping("/returnApply")
public class OmsPortalReturnApplyController {

    @Autowired
    private OmsPortalReturnApplyService returnApplyService;

    @Operation(summary = "提交售后申请")
    @RequestMapping(value = "/create", method = RequestMethod.POST)
    @ResponseBody
    public CommonResult<Object> create(@RequestBody OmsReturnApplyParam param) {
        returnApplyService.create(param);
        return CommonResult.success(null, "提交成功，请等待处理");
    }

    @Operation(summary = "分页获取用户售后申请列表")
    @RequestMapping(value = "/list", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<CommonPage<PortalReturnApply>> list(
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false, defaultValue = "1") Integer pageNum,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize) {
        List<PortalReturnApply> applyList = returnApplyService.list(status, pageNum, pageSize);
        return CommonResult.success(CommonPage.restPage(applyList));
    }

    @Operation(summary = "获取售后申请详情")
    @RequestMapping(value = "/detail/{id}", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<PortalReturnApply> detail(@PathVariable Long id) {
        return CommonResult.success(returnApplyService.detail(id));
    }

    @Operation(summary = "撤销售后申请")
    @RequestMapping(value = "/cancel/{id}", method = RequestMethod.POST)
    @ResponseBody
    public CommonResult<Object> cancel(@PathVariable Long id) {
        returnApplyService.cancel(id);
        return CommonResult.success(null, "已撤销");
    }

    @Operation(summary = "获取可选的退货原因")
    @RequestMapping(value = "/reasonList", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<List<OmsOrderReturnReason>> reasonList() {
        return CommonResult.success(returnApplyService.reasonList());
    }
}
