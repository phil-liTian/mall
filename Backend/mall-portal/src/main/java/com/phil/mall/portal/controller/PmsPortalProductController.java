package com.phil.mall.portal.controller;

import com.phil.mall.common.api.CommonPage;
import com.phil.mall.common.api.CommonResult;
import com.phil.mall.model.PmsProduct;
import com.phil.mall.portal.domain.PmsPortalProductDetail;
import com.phil.mall.portal.domain.PmsProductCategoryNode;
import com.phil.mall.portal.service.PmsPortalProductService;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 前台商品管理Controller
 * Created by macro on 2020/4/6.
 */
@Controller
@Tag(name = "PmsPortalProductController")
@Tag(name = "PmsPortalProductController", description = "前台商品管理")
@RequestMapping("/product")
public class PmsPortalProductController {

    @Autowired
    private PmsPortalProductService portalProductService;

    @Operation(summary = "综合搜索、筛选、排序")
    @RequestMapping(value = "/search", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<CommonPage<PmsProduct>> search(@RequestParam(required = false) String keyword,
                                                       @RequestParam(required = false) Long brandId,
                                                       @RequestParam(required = false) Long productCategoryId,
                                                       @RequestParam(required = false, defaultValue = "0") Integer pageNum,
                                                       @RequestParam(required = false, defaultValue = "5") Integer pageSize,
                                                       @RequestParam(required = false, defaultValue = "0") Integer sort) {
        List<PmsProduct> productList = portalProductService.search(keyword, brandId, productCategoryId, pageNum, pageSize, sort);
        return CommonResult.success(CommonPage.restPage(productList));
    }

    @Operation(summary = "以树形结构获取所有商品分类")
    @RequestMapping(value = "/categoryTreeList", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<List<PmsProductCategoryNode>> categoryTreeList() {
        List<PmsProductCategoryNode> list = portalProductService.categoryTreeList();
        return CommonResult.success(list);
    }

    @Operation(summary = "获取前台商品详情")
    @RequestMapping(value = "/detail/{id}", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<PmsPortalProductDetail> detail(@PathVariable Long id) {
        PmsPortalProductDetail productDetail = portalProductService.detail(id);
        return CommonResult.success(productDetail);
    }
}
