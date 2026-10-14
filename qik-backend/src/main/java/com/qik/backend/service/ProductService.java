
package com.qik.backend.service;

import com.qik.backend.dto.ProductRequest;
import com.qik.backend.dto.StockUpdateRequest;
import com.qik.backend.entity.Category;
import com.qik.backend.entity.Product;
import com.qik.backend.repository.CategoryRepository;
import com.qik.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository) {

        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    private List<Product> visible(List<Product> products) {
        return products.stream().filter(p -> Boolean.TRUE.equals(p.getCategory().getActive())).toList();
    }

    private Category getActiveCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Category not found"
                ));

        if (!Boolean.TRUE.equals(category.getActive())) {
            throw new IllegalArgumentException(
                    "Cannot use an inactive category"
            );
        }

        return category;
    }

    private Product getExistingProduct(Long id) {
        return productRepository.lockById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found"
                ));
    }

    @Transactional
    public Product createProduct(ProductRequest request) {

        Category category = getActiveCategory(request.getCategoryId());

        Product product = Product.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .stockQuantity(request.getStockQuantity())
                .category(category)
                .active(true)
                .build();

        return productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return visible(productRepository.findByActiveTrueOrderByNameAsc());
    }

    @Transactional(readOnly = true)
    public List<Product> getProductsByCategory(Long categoryId) {
        return visible(productRepository
                .findByCategoryIdAndActiveTrueOrderByNameAsc(categoryId));
    }

    @Transactional(readOnly = true)
    public Product getProductById(Long id) {
        return productRepository.findByIdAndActiveTrue(id)
                .filter(p -> Boolean.TRUE.equals(p.getCategory().getActive()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found"
                ));
    }

    @Transactional(readOnly = true)
    public List<Product> searchProducts(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return getAllProducts();
        }

        return visible(productRepository
                .findByNameContainingIgnoreCaseAndActiveTrueOrderByNameAsc(
                        keyword.trim()
                ));
    }

    @Transactional
    public Product updateProduct(Long id, ProductRequest request) {

        Product product = getExistingProduct(id);
        Category category = getActiveCategory(request.getCategoryId());

        product.setName(request.getName().trim());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl());
        product.setStockQuantity(request.getStockQuantity());
        product.setCategory(category);

        return productRepository.save(product);
    }

    @Transactional
    public Product updateStock(Long id, StockUpdateRequest request) {

        Product product = getExistingProduct(id);
        product.setStockQuantity(request.getStockQuantity());

        return productRepository.save(product);
    }
}
