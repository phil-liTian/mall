/*
 * @Author: phil
 * @Date: 2025-12-26 09:49:12
 */
package com.example.repository;

import com.example.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 商品Repository接口
 */
@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    
    /**
     * 根据商品名称模糊查询
     */
    List<Product> findByNameContainingIgnoreCase(String name);
    
    /**
     * 根据商品分类查询
     */
    List<Product> findByCategory(String category);
    
    /**
     * 根据商品状态查询
     */
    List<Product> findByStatus(String status);
    
    /**
     * 根据价格范围查询商品
     */
    @Query("{ 'price' : { $gte: ?0, $lte: ?1 } }")
    List<Product> findByPriceRange(double minPrice, double maxPrice);
    
    /**
     * 根据分类和价格范围查询商品
     */
    @Query("{ 'category': ?0, 'price' : { $gte: ?1, $lte: ?2 } }")
    List<Product> findByCategoryAndPriceRange(String category, double minPrice, double maxPrice);
    
    /**
     * 查询库存小于指定数量的商品
     */
    @Query("{ 'stock' : { $lt: ?0 } }")
    List<Product> findByStockLessThan(Integer stock);
    
    /**
     * 根据商品名称和分类查询
     */
    List<Product> findByNameAndCategory(String name, String category);
}