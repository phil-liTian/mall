/*
 * @Author: phil
 * @Date: 2025-12-26 09:48:57
 */
package com.example.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 商品实体类
 */
@Data
@Document(collection = "products")
public class Product {
    
    @Id
    private String id;
    
    /**
     * 商品名称
     */
    private String name;
    
    /**
     * 商品描述
     */
    private String description;
    
    /**
     * 商品价格
     */
    private BigDecimal price;
    
    /**
     * 商品库存
     */
    private Integer stock;
    
    /**
     * 商品分类
     */
    private String category;
    
    /**
     * 商品图片URL
     */
    private String imageUrl;
    
    /**
     * 商品状态（上架、下架）
     */
    private String status;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
    
    /**
     * 构造函数
     */
    public Product() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = "ACTIVE";
    }
    
    /**
     * 带参数的构造函数
     */
    public Product(String name, String description, BigDecimal price, Integer stock, String category) {
        this();
        this.name = name;
        this.description = description;
        this.price = price;
        this.stock = stock;
        this.category = category;
    }
}