package com.qik.backend.repository;
import com.qik.backend.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface OrderRepository extends JpaRepository<ShopOrder,Long> {
 List<ShopOrder> findByCustomerIdOrderByCreatedAtDesc(Long id);
 List<ShopOrder> findAllByOrderByCreatedAtDesc();
 List<ShopOrder> findByRiderIdOrderByCreatedAtDesc(Long id);
 Optional<ShopOrder> findByCustomerIdAndRequestKey(Long id,String key);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select o from ShopOrder o where o.id=:id")
 Optional<ShopOrder> lockById(@Param("id") Long id);
}
