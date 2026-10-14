
package com.qik.backend.service;

import com.qik.backend.dto.CategoryRequest;
import com.qik.backend.entity.Category;
import com.qik.backend.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public Category createCategory(CategoryRequest request) {

        String name = request.getName().trim();

        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException(
                    "Category already exists"
            );
        }

        Category category = Category.builder()
                .name(name)
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .active(true)
                .build();

        return categoryRepository.save(category);
    }

    public List<Category> getActiveCategories() {
        return categoryRepository.findByActiveTrueOrderByNameAsc();
    }
}
