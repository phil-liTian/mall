package com.phil.mall.controller;

import com.phil.mall.common.api.CommonResult;
import com.phil.mall.dto.SmsFlashPromotionProduct;
import com.phil.mall.model.SmsFlashPromotionProductRelation;
import com.phil.mall.service.SmsFlashPromotionProductRelationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 限时购与商品关系管理Controller
 */
@Controller
@Tag(name = "SmsFlashPromotionProductRelationController", description = "限时购与商品关系管理")
@RequestMapping("/flashProductRelation")
public class SmsFlashPromotionProductRelationController {
    @Autowired
    private SmsFlashPromotionProductRelationService relationService;

    @RequestMapping(value = "/create", method = RequestMethod.POST)
    @ResponseBody
    public CommonResult create(@RequestBody List<SmsFlashPromotionProductRelation> relations) {
        int count = relationService.create(relations);
        if (count > 0) {
            return CommonResult.success(count);
        }
        return CommonResult.failed();
    }

    @RequestMapping(value = "/update/{id}", method = RequestMethod.POST)
    @ResponseBody
    public CommonResult update(@PathVariable Long id, @RequestBody SmsFlashPromotionProductRelation relation) {
        int count = relationService.update(id, relation);
        if (count > 0) {
            return CommonResult.success(count);
        }
        return CommonResult.failed();
    }

    @RequestMapping(value = "/delete/{id}", method = RequestMethod.POST)
    @ResponseBody
    public CommonResult delete(@PathVariable Long id) {
        int count = relationService.delete(id);
        if (count > 0) {
            return CommonResult.success(count);
        }
        return CommonResult.failed();
    }

    @RequestMapping(value = "/{id}", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<SmsFlashPromotionProductRelation> getItem(@PathVariable Long id) {
        return CommonResult.success(relationService.getItem(id));
    }

    @RequestMapping(value = "/list", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<List<SmsFlashPromotionProduct>> list(
            @RequestParam(value = "flashPromotionId", required = false) Long flashPromotionId,
            @RequestParam(value = "flashPromotionSessionId", required = false) Long flashPromotionSessionId) {
        return CommonResult.success(relationService.list(flashPromotionId, flashPromotionSessionId));
    }
}