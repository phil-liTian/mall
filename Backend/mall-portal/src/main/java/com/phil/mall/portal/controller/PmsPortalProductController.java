package com.phil.mall.portal.controller;

import com.phil.mall.common.api.CommonPage;
import com.phil.mall.common.api.CommonResult;
import com.phil.mall.portal.domain.EsProduct;
import com.phil.mall.portal.domain.PmsPortalProductDetail;
import com.phil.mall.portal.domain.PmsProductCategoryNode;
import com.phil.mall.portal.service.EsProductService;
import com.phil.mall.portal.service.PmsPortalProductService;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 前台商品管理Controller
 * Created by phil on 2026/10/9.
 */
@Controller
@Tag(name = "PmsPortalProductController")
@Tag(name = "PmsPortalProductController", description = "前台商品管理")
@RequestMapping("/product")
public class PmsPortalProductController {

    @Autowired
    private PmsPortalProductService portalProductService;
    @Autowired
    private EsProductService esProductService;

    @Operation(summary = "综合搜索、筛选、排序")
    @RequestMapping(value = "/search", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<CommonPage<EsProduct>> search(@RequestParam(required = false) String keyword,
                                                      @RequestParam(required = false) Long brandId,
                                                      @RequestParam(required = false) Long productCategoryId,
                                                      @RequestParam(required = false, defaultValue = "0") Integer pageNum,
                                                      @RequestParam(required = false, defaultValue = "5") Integer pageSize,
                                                      @RequestParam(required = false, defaultValue = "0") Integer sort) {
        Page<EsProduct> productPage = esProductService.search(keyword, brandId, productCategoryId, pageNum, pageSize, sort);
        CommonPage<EsProduct> result = CommonPage.restPage(productPage);
        // Spring 的 Page 从 0 开始计页，原 PageHelper 版本是回传请求里的页码，这里保持一致
        result.setPageNum(pageNum);
        return CommonResult.success(result);
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
