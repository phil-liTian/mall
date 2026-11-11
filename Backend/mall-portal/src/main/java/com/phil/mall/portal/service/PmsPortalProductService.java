package com.phil.mall.portal.service;

import com.phil.mall.portal.domain.PmsPortalProductDetail;
import com.phil.mall.portal.domain.PmsProductCategoryNode;

import java.util.List;

/**
 * 前台商品管理Service
 * Created by phil on 2026/10/9.
 */
public interface PmsPortalProductService {
    /**
     * 以树形结构获取所有商品分类
     */
    List<PmsProductCategoryNode> categoryTreeList();

    /**
     * 获取前台商品详情
     */
    PmsPortalProductDetail detail(Long id);
}
