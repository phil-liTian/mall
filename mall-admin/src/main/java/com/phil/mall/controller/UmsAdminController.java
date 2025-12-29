/*
 * @Author: phil
 * @Date: 2025-12-29 13:48:34
 */
package com.phil.mall.controller;

import com.phil.mall.service.UmsAdminService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import com.phil.mall.dto.UmsAdminLoginParams;
import com.phil.mall.common.api.CommonResult;


@Controller
@RequestMapping("/admin")
@ResponseBody
public class UmsAdminController {

  @RequestMapping(value = "/login", method = RequestMethod.POST)
  public CommonResult<String> login(@RequestBody UmsAdminLoginParams umsAdminLoginParams) {
    
    return CommonResult.success("使用 mall-common 模块的响应类 - 整合成功！");
  }
}