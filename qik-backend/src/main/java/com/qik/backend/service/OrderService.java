package com.qik.backend.service;
import com.qik.backend.entity.*;
import com.qik.backend.dto.CheckoutRequest;
import com.qik.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
@Service
public class OrderService {
 private final OrderRepository orders; private final ProductRepository products; private final UserRepository users; private final EntityManager em;
 public OrderService(OrderRepository o,ProductRepository p,UserRepository u,EntityManager em){orders=o;products=p;users=u;this.em=em;}
 public User user(String email){return users.findByEmail(email).filter(u->Boolean.TRUE.equals(u.getActive())).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Account unavailable"));}
 @Transactional
 public ShopOrder checkout(String email,CheckoutRequest r){
  User customer=user(email);
  if(customer.getRole()!=Role.CUSTOMER) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Customer account required");
  em.lock(customer,LockModeType.PESSIMISTIC_WRITE);
  var existing=orders.findByCustomerIdAndRequestKey(customer.getId(),r.requestKey());
  if(existing.isPresent()) return existing.get();
  ShopOrder order=new ShopOrder(); order.setCustomer(customer); order.setRequestKey(r.requestKey());order.setAddress(r.address().trim());order.setPostcode(r.postcode().trim().toUpperCase(Locale.ROOT));
  BigDecimal subtotal=BigDecimal.ZERO;Set<Long> seen=new HashSet<>();
  var lines=new ArrayList<>(r.items());lines.sort(Comparator.comparing(CheckoutRequest.Line::productId));
  for(var line:lines){
   if(!seen.add(line.productId()))throw new IllegalArgumentException("Duplicate product in basket");
   Product p=products.lockById(line.productId()).orElseThrow(()->new IllegalArgumentException("Product unavailable"));
   if(!Boolean.TRUE.equals(p.getActive())||!Boolean.TRUE.equals(p.getCategory().getActive())||p.getStockQuantity()<line.quantity())throw new ResponseStatusException(HttpStatus.CONFLICT,p.getName()+" has insufficient stock");
   p.setStockQuantity(p.getStockQuantity()-line.quantity());
   order.getItems().add(new OrderItem(p.getId(),p.getName(),line.quantity(),p.getPrice()));
   subtotal=subtotal.add(p.getPrice().multiply(BigDecimal.valueOf(line.quantity())));
  }
  order.setSubtotal(subtotal);order.setDeliveryFee(subtotal.compareTo(new BigDecimal("25.00"))>=0?BigDecimal.ZERO:new BigDecimal("1.99"));order.setTotal(subtotal.add(order.getDeliveryFee()));return orders.save(order);
 }
 @Transactional(readOnly=true) public List<ShopOrder> mine(String email){return orders.findByCustomerIdOrderByCreatedAtDesc(user(email).getId());}
 @Transactional(readOnly=true) public List<ShopOrder> all(String email){user(email);return orders.findAllByOrderByCreatedAtDesc();}
 @Transactional(readOnly=true) public List<ShopOrder> assigned(String email){return orders.findByRiderIdOrderByCreatedAtDesc(user(email).getId());}
 @Transactional public ShopOrder assign(String email,Long id,Long riderId){
  user(email);ShopOrder o=locked(id);if(o.getStatus()!=OrderStatus.PLACED&&o.getStatus()!=OrderStatus.PICKING&&o.getStatus()!=OrderStatus.READY)throw new IllegalArgumentException("Order cannot be reassigned now");
  User rider=users.findById(riderId).filter(u->u.getRole()==Role.RIDER&&Boolean.TRUE.equals(u.getActive())).orElseThrow(()->new IllegalArgumentException("Active rider required"));o.setRider(rider);o.setUpdatedAt(Instant.now());return o;
 }
 private ShopOrder locked(Long id){return orders.lockById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Order not found"));}
 @Transactional public ShopOrder transition(String email,Long id,OrderStatus next){
  User actor=user(email);ShopOrder o=locked(id);OrderStatus current=o.getStatus();boolean allowed=false;
  if(actor.getRole()==Role.CUSTOMER){if(!o.getCustomer().getId().equals(actor.getId()))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Order belongs to another customer");allowed=current==OrderStatus.PLACED&&next==OrderStatus.CANCELLED;}
  if(actor.getRole()==Role.ADMIN)allowed=(current==OrderStatus.PLACED&&next==OrderStatus.PICKING)||(current==OrderStatus.PICKING&&next==OrderStatus.READY)||((current==OrderStatus.PLACED||current==OrderStatus.PICKING||current==OrderStatus.READY)&&next==OrderStatus.CANCELLED);
  if(actor.getRole()==Role.RIDER){if(o.getRider()==null||!o.getRider().getId().equals(actor.getId()))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Order is not assigned to you");allowed=(current==OrderStatus.READY&&next==OrderStatus.ACCEPTED)||(current==OrderStatus.ACCEPTED&&next==OrderStatus.OUT_FOR_DELIVERY)||(current==OrderStatus.OUT_FOR_DELIVERY&&next==OrderStatus.DELIVERED);}
  if(!allowed)throw new ResponseStatusException(HttpStatus.CONFLICT,"Invalid order transition");
  if(next==OrderStatus.CANCELLED)for(var line:o.getItems().stream().sorted(Comparator.comparing(OrderItem::getProductId)).toList()){Product p=products.lockById(line.getProductId()).orElseThrow();p.setStockQuantity(p.getStockQuantity()+line.getQuantity());}
  o.setStatus(next);o.setUpdatedAt(Instant.now());return o;
 }
}
