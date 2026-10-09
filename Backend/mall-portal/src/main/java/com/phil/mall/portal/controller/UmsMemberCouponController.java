package com.phil.mall.portal.controller;

import com.phil.mall.common.api.CommonResult;
import com.phil.mall.model.SmsCoupon;
import com.phil.mall.model.SmsCouponHistory;
import com.phil.mall.portal.domain.CartPromotionItem;
import com.phil.mall.portal.domain.SmsCouponHistoryDetail;
import com.phil.mall.portal.service.OmsCartItemService;
import com.phil.mall.portal.service.UmsMemberCouponService;
import com.phil.mall.portal.service.UmsMemberService;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 会员优惠券管理Controller
 * Created by macro on 2018/8/29.
 */
@Controller
@Tag(name = "UmsMemberCouponController")
@Tag(name = "UmsMemberCouponController", description = "用户优惠券管理")
@RequestMapping("/member/coupon")
public class UmsMemberCouponController {
    @Autowired
    private UmsMemberCouponService memberCouponService;
    @Autowired
    private OmsCartItemService cartItemService;
    @Autowired
    private UmsMemberService memberService;

    @Operation(summary = "领取指定优惠券")
    @RequestMapping(value = "/add/{couponId}", method = RequestMethod.POST)
    @ResponseBody
    public CommonResult add(@PathVariable Long couponId) {
        memberCouponService.add(couponId);
        return CommonResult.success(null,"领取成功");
    }

    @Operation(summary = "获取会员优惠券历史列表")
    @RequestMapping(value = "/listHistory", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<List<SmsCouponHistory>> listHistory(@RequestParam(value = "useStatus", required = false) Integer useStatus) {
        List<SmsCouponHistory> couponHistoryList = memberCouponService.listHistory(useStatus);
        return CommonResult.success(couponHistoryList);
    }

    @Operation(summary = "获取会员优惠券列表")
    @RequestMapping(value = "/list", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<List<SmsCoupon>> list(@RequestParam(value = "useStatus", required = false) Integer useStatus) {
        List<SmsCoupon> couponList = memberCouponService.list(useStatus);
        return CommonResult.success(couponList);
    }

    @Operation(summary = "获取登录会员购物车的相关优惠券")
    @RequestMapping(value = "/list/cart/{type}", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<List<SmsCouponHistoryDetail>> listCart(@PathVariable Integer type) {
        List<CartPromotionItem> cartPromotionItemList = cartItemService.listPromotion(memberService.getCurrentMember().getId(), null);
        List<SmsCouponHistoryDetail> couponHistoryList = memberCouponService.listCart(cartPromotionItemList, type);
        return CommonResult.success(couponHistoryList);
    }

    @Operation(summary = "获取当前商品相关优惠券")
    @RequestMapping(value = "/listByProduct/{productId}", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<List<SmsCoupon>> listByProduct(@PathVariable Long productId) {
        List<SmsCoupon> couponHistoryList = memberCouponService.listByProduct(productId);
        return CommonResult.success(couponHistoryList);
    }
}
