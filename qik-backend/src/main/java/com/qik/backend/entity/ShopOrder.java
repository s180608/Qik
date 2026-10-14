package com.qik.backend.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
@Entity @Table(name="shop_orders",uniqueConstraints=@UniqueConstraint(columnNames={"customer_id","request_key"}))
@Getter @Setter @NoArgsConstructor
public class ShopOrder {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne private User customer;
 @ManyToOne private User rider;
 @Column(name="request_key",nullable=false) @com.fasterxml.jackson.annotation.JsonIgnore private String requestKey;
 @Column(nullable=false) private String address;
 @Column(nullable=false) private String postcode;
 @Enumerated(EnumType.STRING) private OrderStatus status=OrderStatus.PLACED;
 @ElementCollection(fetch=FetchType.EAGER) @CollectionTable(name="order_items",joinColumns=@JoinColumn(name="order_id"))
 private List<OrderItem> items=new ArrayList<>();
 @Column(precision=10,scale=2) private BigDecimal subtotal;
 @Column(precision=10,scale=2) private BigDecimal deliveryFee;
 @Column(precision=10,scale=2) private BigDecimal total;
 private Instant createdAt=Instant.now();
 private Instant updatedAt=Instant.now();
 private boolean simulated=true;
 @Version @com.fasterxml.jackson.annotation.JsonIgnore private Long version;
}
