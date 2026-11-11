package com.phil.mall.portal.service.impl;

import cn.hutool.core.util.StrUtil;
import com.phil.mall.mapper.PmsProductMapper;
import com.phil.mall.model.PmsProduct;
import com.phil.mall.model.PmsProductExample;
import com.phil.mall.portal.domain.EsProduct;
import com.phil.mall.portal.repository.EsProductRepository;
import com.phil.mall.portal.service.EsProductService;
import lombok.extern.slf4j.Slf4j;
import org.elasticsearch.common.Strings;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.sort.SortBuilders;
import org.elasticsearch.search.sort.SortOrder;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.core.ElasticsearchRestTemplate;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.NativeSearchQuery;
import org.springframework.data.elasticsearch.core.query.NativeSearchQueryBuilder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 商品搜索Service实现类
 * Created by phil on 2026/10/20.
 */
@Slf4j
@Service
public class EsProductServiceImpl implements EsProductService {
    @Autowired
    private PmsProductMapper productMapper;
    @Autowired
    private EsProductRepository productRepository;
    @Autowired
    private ElasticsearchRestTemplate elasticsearchRestTemplate;

    @Override
    public int importAll() {
        List<EsProduct> esProductList = getEsProductList();
        productRepository.saveAll(esProductList);
        return esProductList.size();
    }

    @Override
    public Page<EsProduct> search(String keyword, Long brandId, Long productCategoryId, Integer pageNum, Integer pageSize, Integer sort) {
        // 入参沿用 PageHelper 的 1 开始语义，ES 的 PageRequest 是 0 开始
        int page = pageNum == null || pageNum < 1 ? 1 : pageNum;
        NativeSearchQueryBuilder builder = new NativeSearchQueryBuilder();
        builder.withPageable(PageRequest.of(page - 1, pageSize));
        if (brandId != null || productCategoryId != null) {
            BoolQueryBuilder filter = QueryBuilders.boolQuery();
            if (brandId != null) {
                filter.must(QueryBuilders.termQuery("brandId", brandId));
            }
            if (productCategoryId != null) {
                filter.must(QueryBuilders.termQuery("productCategoryId", productCategoryId));
            }
            builder.withFilter(filter);
        }
        if (StrUtil.isEmpty(keyword)) {
            builder.withQuery(QueryBuilders.matchAllQuery());
        } else {
            builder.withQuery(QueryBuilders.multiMatchQuery(keyword)
                    .field("name", 10f)
                    .field("subTitle", 5f)
                    .field("keywords", 3f)
                    .field("description", 2f));
        }
        if (sort == 1) {
            builder.withSorts(SortBuilders.fieldSort("id").order(SortOrder.DESC));
        } else if (sort == 2) {
            builder.withSorts(SortBuilders.fieldSort("sale").order(SortOrder.DESC));
        } else if (sort == 3) {
            builder.withSorts(SortBuilders.fieldSort("price").order(SortOrder.ASC));
        } else if (sort == 4) {
            builder.withSorts(SortBuilders.fieldSort("price").order(SortOrder.DESC));
        } else {
            builder.withSorts(SortBuilders.scoreSort().order(SortOrder.DESC));
        }
        NativeSearchQuery searchQuery = builder.build();
        SearchHits<EsProduct> searchHits = elasticsearchRestTemplate.search(searchQuery, EsProduct.class);
        log.debug("ES DSL:{}, hits:{}", Strings.toString(searchQuery.getQuery()), searchHits.getTotalHits());
        Pageable pageable = PageRequest.of(page - 1, pageSize);
        if (searchHits.getTotalHits() <= 0) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }
        List<EsProduct> productList = searchHits.stream().map(SearchHit::getContent).collect(Collectors.toList());
        return new PageImpl<>(productList, pageable, searchHits.getTotalHits());
    }

    private List<EsProduct> getEsProductList() {
        PmsProductExample example = new PmsProductExample();
        PmsProductExample.Criteria criteria = example.createCriteria();
        criteria.andDeleteStatusEqualTo(0);
        criteria.andPublishStatusEqualTo(1);
        List<PmsProduct> productList = productMapper.selectByExampleWithBLOBs(example);
        List<EsProduct> result = new ArrayList<>(productList.size());
        for (PmsProduct product : productList) {
            EsProduct esProduct = new EsProduct();
            BeanUtils.copyProperties(product, esProduct);
            result.add(esProduct);
        }
        return result;
    }
}
