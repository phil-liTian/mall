package com.phil.mall.portal.service;

import com.phil.mall.portal.domain.EsProduct;
import org.springframework.data.domain.Page;

/**
 * 商品搜索Service
 * Created by phil on 2026/10/20.
 */
public interface EsProductService {
    /**
     * 从数据库中导入所有上架商品到ES
     */
    int importAll();

    /**
     * 综合搜索、筛选、排序
     *
     * @param keyword           搜索关键字
     * @param brandId           品牌id
     * @param productCategoryId 商品分类id
     * @param pageNum           页码，从1开始
     * @param pageSize          每页数量
     * @param sort              排序字段:0->按相关度；1->按新品；2->按销量；3->价格从低到高；4->价格从高到低
     */
    Page<EsProduct> search(String keyword, Long brandId, Long productCategoryId, Integer pageNum, Integer pageSize, Integer sort);
}
