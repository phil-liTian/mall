package com.phil.mall.portal.controller;

import com.phil.mall.common.api.CommonResult;
import com.phil.mall.portal.service.EsProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * 搜索商品索引管理Controller
 * Created by phil on 2026/10/20.
 */
@Controller
@Tag(name = "EsProductController", description = "搜索商品索引管理")
@RequestMapping("/esProduct")
public class EsProductController {

    @Autowired
    private EsProductService esProductService;

    @Operation(summary = "导入所有数据库中商品到ES")
    @RequestMapping(value = "/importAll", method = RequestMethod.POST)
    @ResponseBody
    public CommonResult<Integer> importAll() {
        int count = esProductService.importAll();
        return CommonResult.success(count);
    }
}
