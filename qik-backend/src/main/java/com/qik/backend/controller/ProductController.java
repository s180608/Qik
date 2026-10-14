
package com.qik.backend.controller;

import com.qik.backend.dto.ProductRequest;
import com.qik.backend.dto.StockUpdateRequest;
import com.qik.backend.entity.Product;
import com.qik.backend.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping("/api/admin/products")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> createProduct(
            @Valid @RequestBody ProductRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.createProduct(request));
    }

    @GetMapping("/api/products")
    public List<Product> getProducts(
            @RequestParam(required = false) Long categoryId) {

        if (categoryId != null) {
            return productService.getProductsByCategory(categoryId);
        }

        return productService.getAllProducts();
    }

    @GetMapping("/api/products/search")
    public List<Product> searchProducts(
            @RequestParam String keyword) {

        return productService.searchProducts(keyword);
    }

    @GetMapping("/api/products/{id}")
    public Product getProductById(@PathVariable Long id) {
        return productService.getProductById(id);
    }

    @PutMapping("/api/admin/products/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Product updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {

        return productService.updateProduct(id, request);
    }

    @PatchMapping("/api/admin/products/{id}/stock")
    @PreAuthorize("hasRole('ADMIN')")
    public Product updateStock(
            @PathVariable Long id,
            @Valid @RequestBody StockUpdateRequest request) {

        return productService.updateStock(id, request);
    }
}
