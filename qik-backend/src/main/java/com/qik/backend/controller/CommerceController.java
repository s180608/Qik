package com.qik.backend.controller;
import com.qik.backend.entity.*;
import com.qik.backend.dto.CheckoutRequest;
import com.qik.backend.repository.*;
import com.qik.backend.service.OrderService;
import jakarta.validation.*;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController
public class CommerceController {
 private final OrderService service;private final UserRepository users;private final ProductRepository products;private final CategoryRepository categories;private final PasswordEncoder encoder;
 @Value("${qik.demo:false}") private boolean demo;
 public CommerceController(OrderService s,UserRepository u,ProductRepository p,CategoryRepository c,PasswordEncoder e){service=s;users=u;products=p;categories=c;encoder=e;}
 @GetMapping("/api/health") public Map<String,String> health(){return Map.of("status","UP");}
 @GetMapping("/api/config") public Map<String,Object> config(){return Map.of("demo",demo,"simulatedOrders",true,"currency","GBP");}
 @GetMapping("/api/me") public User me(Authentication a){return service.user(a.getName());}
 @PostMapping("/api/orders") @ResponseStatus(HttpStatus.CREATED) public ShopOrder checkout(Authentication a,@Valid @RequestBody CheckoutRequest r){return service.checkout(a.getName(),r);}
 @GetMapping("/api/orders") public List<ShopOrder> mine(Authentication a){return service.mine(a.getName());}
 public record StatusRequest(@NotNull OrderStatus status){}
 @PatchMapping("/api/orders/{id}/status") public ShopOrder status(Authentication a,@PathVariable Long id,@Valid @RequestBody StatusRequest r){return service.transition(a.getName(),id,r.status());}
 @GetMapping("/api/admin/orders") public List<ShopOrder> all(Authentication a){return service.all(a.getName());}
 @GetMapping("/api/rider/orders") public List<ShopOrder> assigned(Authentication a){return service.assigned(a.getName());}
 public record Assignment(@NotNull Long riderId){}
 @PatchMapping("/api/admin/orders/{id}/rider") public ShopOrder assign(Authentication a,@PathVariable Long id,@Valid @RequestBody Assignment r){return service.assign(a.getName(),id,r.riderId());}
 @GetMapping("/api/admin/users") public List<User> users(Authentication a){service.user(a.getName());return users.findAll();}
 public record AccountUpdate(@NotNull Role role,@NotNull Boolean active){}
 @PatchMapping("/api/admin/users/{id}") @Transactional public User updateAccount(Authentication a,@PathVariable Long id,@Valid @RequestBody AccountUpdate r){User actor=service.user(a.getName());if(actor.getId().equals(id))throw new IllegalArgumentException("Use another admin to change your own access");User user=users.findById(id).orElseThrow(()->new IllegalArgumentException("Account not found"));user.setRole(r.role());user.setActive(r.active());return user;}
 @GetMapping("/api/admin/products") public List<Product> products(){return products.findAll();}
 public record Staff(@NotBlank String firstName,@NotBlank String lastName,@Email @NotBlank String email,@Size(min=12) @NotBlank String password,@NotNull Role role){}
 @PostMapping("/api/admin/users") public User staff(Authentication a,@Valid @RequestBody Staff r){service.user(a.getName());if(users.existsByEmail(r.email().trim().toLowerCase(Locale.ROOT)))throw new IllegalArgumentException("Email already registered");return users.save(User.builder().firstName(r.firstName()).lastName(r.lastName()).email(r.email().trim().toLowerCase(Locale.ROOT)).password(encoder.encode(r.password())).role(r.role()).active(true).build());}
 @DeleteMapping("/api/admin/products/{id}") @Transactional public void archive(@PathVariable Long id){Product p=products.lockById(id).orElseThrow(()->new IllegalArgumentException("Product not found"));p.setActive(false);}
 public record CategoryEdit(@NotBlank @Size(max=100) String name,@Size(max=500) String description,boolean active){}
 @PutMapping("/api/admin/categories/{id}") @Transactional public Category category(@PathVariable Long id,@Valid @RequestBody CategoryEdit r){Category c=categories.findById(id).orElseThrow(()->new IllegalArgumentException("Category not found"));c.setName(r.name().trim());c.setDescription(r.description());c.setActive(r.active());return c;}
 @GetMapping("/api/admin/categories") public List<Category> categories(){return categories.findAll();}
}
