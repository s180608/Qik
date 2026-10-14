
package com.qik.backend.repository;

import com.qik.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository
        extends JpaRepository<Product, Long> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from Product p where p.id = :id")
    Optional<Product> lockById(@org.springframework.data.repository.query.Param("id") Long id);

    List<Product> findByActiveTrueOrderByNameAsc();

    List<Product> findByCategoryIdAndActiveTrueOrderByNameAsc(
            Long categoryId
    );

    List<Product> findByNameContainingIgnoreCaseAndActiveTrueOrderByNameAsc(
            String keyword
    );

    Optional<Product> findByIdAndActiveTrue(Long id);
}
