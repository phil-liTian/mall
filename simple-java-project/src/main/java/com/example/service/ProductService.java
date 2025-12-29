package com.example.service;

import com.example.model.Product;
import com.example.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 商品服务类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {
    
    private final ProductRepository productRepository;
    
    /**
     * 获取所有商品
     */
    public List<Product> getAllProducts() {
        log.info("获取所有商品");
        return productRepository.findAll();
    }
    
    /**
     * 根据ID获取商品
     */
    public Optional<Product> getProductById(String id) {
        log.info("根据ID获取商品: {}", id);
        return productRepository.findById(id);
    }
    
    /**
     * 创建商品
     */
    public Product createProduct(Product product) {
        log.info("创建商品: {}", product.getName());
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());
        product.setStatus("ACTIVE");
        return productRepository.save(product);
    }
    
    /**
     * 更新商品
     */
    public Product updateProduct(String id, Product product) {
        log.info("更新商品: {}", id);
        return productRepository.findById(id)
                .map(existingProduct -> {
                    existingProduct.setName(product.getName());
                    existingProduct.setDescription(product.getDescription());
                    existingProduct.setPrice(product.getPrice());
                    existingProduct.setStock(product.getStock());
                    existingProduct.setCategory(product.getCategory());
                    existingProduct.setImageUrl(product.getImageUrl());
                    existingProduct.setStatus(product.getStatus());
                    existingProduct.setUpdatedAt(LocalDateTime.now());
                    return productRepository.save(existingProduct);
                })
                .orElseThrow(() -> new RuntimeException("商品不存在: " + id));
    }
    
    /**
     * 删除商品
     */
    public void deleteProduct(String id) {
        log.info("删除商品: {}", id);
        productRepository.deleteById(id);
    }
    
    /**
     * 根据名称搜索商品
     */
    public List<Product> searchProductsByName(String name) {
        log.info("根据名称搜索商品: {}", name);
        return productRepository.findByNameContainingIgnoreCase(name);
    }
    
    /**
     * 根据分类获取商品
     */
    public List<Product> getProductsByCategory(String category) {
        log.info("根据分类获取商品: {}", category);
        return productRepository.findByCategory(category);
    }
    
    /**
     * 根据状态获取商品
     */
    public List<Product> getProductsByStatus(String status) {
        log.info("根据状态获取商品: {}", status);
        return productRepository.findByStatus(status);
    }
    
    /**
     * 根据价格范围获取商品
     */
    public List<Product> getProductsByPriceRange(double minPrice, double maxPrice) {
        log.info("根据价格范围获取商品: {} - {}", minPrice, maxPrice);
        return productRepository.findByPriceRange(minPrice, maxPrice);
    }
    
    /**
     * 根据分类和价格范围获取商品
     */
    public List<Product> getProductsByCategoryAndPriceRange(String category, double minPrice, double maxPrice) {
        log.info("根据分类和价格范围获取商品: {}, {} - {}", category, minPrice, maxPrice);
        return productRepository.findByCategoryAndPriceRange(category, minPrice, maxPrice);
    }
    
    /**
     * 获取库存不足的商品
     */
    public List<Product> getLowStockProducts(Integer threshold) {
        log.info("获取库存不足的商品，阈值: {}", threshold);
        return productRepository.findByStockLessThan(threshold);
    }
    
    /**
     * 更新商品库存
     */
    public Product updateProductStock(String id, Integer stock) {
        log.info("更新商品库存: {}, 新库存: {}", id, stock);
        return productRepository.findById(id)
                .map(product -> {
                    product.setStock(stock);
                    product.setUpdatedAt(LocalDateTime.now());
                    return productRepository.save(product);
                })
                .orElseThrow(() -> new RuntimeException("商品不存在: " + id));
    }
}