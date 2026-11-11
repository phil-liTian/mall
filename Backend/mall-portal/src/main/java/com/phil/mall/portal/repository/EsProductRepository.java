package com.phil.mall.portal.repository;

import com.phil.mall.portal.domain.EsProduct;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

/**
 * 商品ES操作类
 * Created by phil on 2026/10/20.
 */
public interface EsProductRepository extends ElasticsearchRepository<EsProduct, Long> {
}
