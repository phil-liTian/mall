package com.example.controller;

import com.example.model.Product;
import com.example.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * 商品控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    
    private final ProductService productService;
    
    /**
     * 获取所有商品
     */
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        log.info("获取所有商品");
        List<Product> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }
    
    /**
     * 根据ID获取商品
     */
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable String id) {
        log.info("根据ID获取商品: {}", id);
        Optional<Product> product = productService.getProductById(id);
        return product.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 创建商品
     */
    @PostMapping("/save")
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        log.info("创建商品: {}", product.getName());
        try {
            Product createdProduct = productService.createProduct(product);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdProduct);
        } catch (Exception e) {
            log.error("创建商品失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 更新商品
     */
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable String id, @RequestBody Product product) {
        log.info("更新商品: {}", id);
        try {
            Product updatedProduct = productService.updateProduct(id, product);
            return ResponseEntity.ok(updatedProduct);
        } catch (RuntimeException e) {
            log.error("更新商品失败: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("更新商品失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 删除商品
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        log.info("删除商品: {}", id);
        try {
            productService.deleteProduct(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("删除商品失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * 根据名称搜索商品
     */
    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProductsByName(@RequestParam String name) {
        log.info("根据名称搜索商品: {}", name);
        List<Product> products = productService.searchProductsByName(name);
        return ResponseEntity.ok(products);
    }
    
    /**
     * 根据分类获取商品
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable String category) {
        log.info("根据分类获取商品: {}", category);
        List<Product> products = productService.getProductsByCategory(category);
        return ResponseEntity.ok(products);
    }
    
    /**
     * 根据状态获取商品
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Product>> getProductsByStatus(@PathVariable String status) {
        log.info("根据状态获取商品: {}", status);
        List<Product> products = productService.getProductsByStatus(status);
        return ResponseEntity.ok(products);
    }
    
    /**
     * 根据价格范围获取商品
     */
    @GetMapping("/price-range")
    public ResponseEntity<List<Product>> getProductsByPriceRange(
            @RequestParam double minPrice, 
            @RequestParam double maxPrice) {
        log.info("根据价格范围获取商品: {} - {}", minPrice, maxPrice);
        List<Product> products = productService.getProductsByPriceRange(minPrice, maxPrice);
        return ResponseEntity.ok(products);
    }
    
    /**
     * 根据分类和价格范围获取商品
     */
    @GetMapping("/category/{category}/price-range")
    public ResponseEntity<List<Product>> getProductsByCategoryAndPriceRange(
            @PathVariable String category,
            @RequestParam double minPrice, 
            @RequestParam double maxPrice) {
        log.info("根据分类和价格范围获取商品: {}, {} - {}", category, minPrice, maxPrice);
        List<Product> products = productService.getProductsByCategoryAndPriceRange(category, minPrice, maxPrice);
        return ResponseEntity.ok(products);
    }
    
    /**
     * 获取库存不足的商品
     */
    @GetMapping("/low-stock")
    public ResponseEntity<List<Product>> getLowStockProducts(@RequestParam(defaultValue = "10") Integer threshold) {
        log.info("获取库存不足的商品，阈值: {}", threshold);
        List<Product> products = productService.getLowStockProducts(threshold);
        return ResponseEntity.ok(products);
    }
    
    /**
     * 更新商品库存
     */
    @PatchMapping("/{id}/stock")
    public ResponseEntity<Product> updateProductStock(@PathVariable String id, @RequestParam Integer stock) {
        log.info("更新商品库存: {}, 新库存: {}", id, stock);
        try {
            Product updatedProduct = productService.updateProductStock(id, stock);
            return ResponseEntity.ok(updatedProduct);
        } catch (RuntimeException e) {
            log.error("更新商品库存失败: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("更新商品库存失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}