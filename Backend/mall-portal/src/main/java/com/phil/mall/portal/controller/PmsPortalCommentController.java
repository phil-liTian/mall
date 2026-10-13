package com.phil.mall.portal.controller;

import cn.hutool.core.util.StrUtil;
import com.phil.mall.common.api.CommonPage;
import com.phil.mall.common.api.CommonResult;
import com.phil.mall.model.OmsOrderItem;
import com.phil.mall.portal.domain.PmsCommentParam;
import com.phil.mall.portal.domain.PmsCommentStat;
import com.phil.mall.portal.domain.PortalComment;
import com.phil.mall.portal.service.PmsPortalCommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * C端商品评价Controller
 * /comment/list 与 /comment/stat/** 在白名单里，游客可读；其余接口需要登录
 */
@Controller
@Tag(name = "PmsPortalCommentController", description = "商品评价")
@RequestMapping("/comment")
public class PmsPortalCommentController {

    /** member_ip 列是 varchar(64) */
    private static final int MAX_IP_LENGTH = 64;

    @Autowired
    private PmsPortalCommentService commentService;

    @Operation(summary = "提交整单评价")
    @RequestMapping(value = "/create", method = RequestMethod.POST)
    @ResponseBody
    public CommonResult<Object> create(@RequestBody PmsCommentParam param, HttpServletRequest request) {
        commentService.create(param, getClientIp(request));
        return CommonResult.success(null, "评价成功");
    }

    @Operation(summary = "分页获取商品评价")
    @RequestMapping(value = "/list", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<CommonPage<PortalComment>> list(
            @RequestParam Long productId,
            @RequestParam(required = false) Boolean onlyPic,
            @RequestParam(required = false, defaultValue = "1") Integer pageNum,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize) {
        List<PortalComment> commentList = commentService.list(productId, onlyPic, pageNum, pageSize);
        return CommonResult.success(CommonPage.restPage(commentList));
    }

    @Operation(summary = "获取商品评价统计")
    @RequestMapping(value = "/stat/{productId}", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<PmsCommentStat> stat(@PathVariable Long productId) {
        return CommonResult.success(commentService.stat(productId));
    }

    @Operation(summary = "分页获取我的评价")
    @RequestMapping(value = "/myList", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<CommonPage<PortalComment>> myList(
            @RequestParam(required = false, defaultValue = "1") Integer pageNum,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize) {
        List<PortalComment> commentList = commentService.myList(pageNum, pageSize);
        return CommonResult.success(CommonPage.restPage(commentList));
    }

    @Operation(summary = "获取订单内待评价的商品")
    @RequestMapping(value = "/uncommented/{orderId}", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<List<OmsOrderItem>> uncommented(@PathVariable Long orderId) {
        return CommonResult.success(commentService.listUncommented(orderId));
    }

    /**
     * 经 nginx 反代后 remoteAddr 全是网关地址，必须优先读转发头
     */
    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StrUtil.isNotBlank(forwarded)) {
            return StrUtil.subPre(forwarded.split(",")[0].trim(), MAX_IP_LENGTH);
        }
        String realIp = request.getHeader("X-Real-IP");
        if (StrUtil.isNotBlank(realIp)) {
            return StrUtil.subPre(realIp.trim(), MAX_IP_LENGTH);
        }
        return StrUtil.subPre(request.getRemoteAddr(), MAX_IP_LENGTH);
    }
}
