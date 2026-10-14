package com.qik.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
@Embeddable @Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OrderItem {
 private Long productId;
 private String name;
 private int quantity;
 @Column(precision=10,scale=2) private BigDecimal unitPrice;
}
