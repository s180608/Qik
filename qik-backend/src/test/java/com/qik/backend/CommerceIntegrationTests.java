package com.qik.backend;

import com.qik.backend.entity.*;
import com.qik.backend.repository.*;
import com.qik.backend.security.JwtService;
import com.qik.backend.dto.CheckoutRequest;
import com.qik.backend.service.OrderService;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc
class CommerceIntegrationTests {
 @Autowired MockMvc mvc;
 @Autowired UserRepository users;
 @Autowired ProductRepository products;
 @Autowired CategoryRepository categories;
 @Autowired OrderRepository orders;
 @Autowired JwtService jwt;
 @Autowired PasswordEncoder encoder;
 @Autowired OrderService service;
 User customer,other,admin,rider,otherRider; Product product;Category category;
 String customerToken,adminToken,riderToken;
 User account(Role role){return users.save(User.builder().firstName("Test").lastName(role.name()).email(UUID.randomUUID()+"@test.example").password(encoder.encode("TestingOnly123!")).active(true).role(role).build());}
 @BeforeEach void setup(){
  customer=account(Role.CUSTOMER);other=account(Role.CUSTOMER);admin=account(Role.ADMIN);rider=account(Role.RIDER);otherRider=account(Role.RIDER);
  customerToken=jwt.generateToken(customer);adminToken=jwt.generateToken(admin);riderToken=jwt.generateToken(rider);
  category=categories.save(Category.builder().name("Test "+UUID.randomUUID()).build());
  product=products.save(Product.builder().name("Test milk").description("1L").price(new BigDecimal("1.85")).stockQuantity(10).category(category).build());
 }
 String checkout(String key,int quantity){return "{\"address\":\"12 Test Street\",\"postcode\":\"SW1A 1AA\",\"requestKey\":\""+key+"\",\"items\":[{\"productId\":"+product.getId()+",\"quantity\":"+quantity+"}]}";}
 Long place(String key,int qty)throws Exception{String s=mvc.perform(post("/api/orders").header("Authorization","Bearer "+customerToken).contentType("application/json").content(checkout(key,qty))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();return ((Number)JsonPath.read(s,"$.id")).longValue();}
 void transition(Long id,String token,String next,int expected)throws Exception{mvc.perform(patch("/api/orders/"+id+"/status").header("Authorization","Bearer "+token).contentType("application/json").content("{\"status\":\""+next+"\"}")).andExpect(status().is(expected));}
 @Test void completeDeliveryFlowAndPermissions()throws Exception{
  Long id=place("flow",2);assertEquals(8,products.findById(product.getId()).orElseThrow().getStockQuantity());
  mvc.perform(get("/api/orders").header("Authorization","Bearer "+customerToken)).andExpect(status().isOk()).andExpect(jsonPath("$[0].total").value(5.69)).andExpect(jsonPath("$[0].customer.password").doesNotExist());
  transition(id,jwt.generateToken(other),"CANCELLED",403);
  transition(id,customerToken,"DELIVERED",409);
  transition(id,adminToken,"READY",409);
  transition(id,adminToken,"PICKING",200);transition(id,adminToken,"READY",200);
  transition(id,jwt.generateToken(otherRider),"ACCEPTED",403);
  mvc.perform(patch("/api/admin/orders/"+id+"/rider").header("Authorization","Bearer "+adminToken).contentType("application/json").content("{\"riderId\":"+rider.getId()+"}")).andExpect(status().isOk());
  mvc.perform(get("/api/rider/orders").header("Authorization","Bearer "+riderToken)).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(id));
  transition(id,riderToken,"ACCEPTED",200);transition(id,riderToken,"OUT_FOR_DELIVERY",200);transition(id,riderToken,"DELIVERED",200);
  transition(id,adminToken,"CANCELLED",409);transition(id,riderToken,"DELIVERED",409);
 }
 @Test void retriesDoNotChargeOrReserveStockTwiceAndCancellationRestoresOnce()throws Exception{
  Long id=place("retry",3);assertEquals(id,place("retry",3));assertEquals(7,products.findById(product.getId()).orElseThrow().getStockQuantity());
  transition(id,customerToken,"CANCELLED",200);transition(id,customerToken,"CANCELLED",409);assertEquals(10,products.findById(product.getId()).orElseThrow().getStockQuantity());
 }
 @Test void invalidAndInsufficientStockCheckoutIsAtomic()throws Exception{
  mvc.perform(post("/api/orders").header("Authorization","Bearer "+customerToken).contentType("application/json").content(checkout("stock",11))).andExpect(status().isConflict());
  mvc.perform(post("/api/orders").header("Authorization","Bearer "+customerToken).contentType("application/json").content(checkout("invalid",0))).andExpect(status().isBadRequest());
  String duplicate=checkout("duplicate",2).replace("}]}","},{\"productId\":"+product.getId()+",\"quantity\":2}]}");
  mvc.perform(post("/api/orders").header("Authorization","Bearer "+customerToken).contentType("application/json").content(duplicate)).andExpect(status().isBadRequest());
  assertEquals(10,products.findById(product.getId()).orElseThrow().getStockQuantity());assertTrue(orders.findByCustomerIdOrderByCreatedAtDesc(customer.getId()).isEmpty());
 }
 @Test void freeDeliveryAndHistoricalPrices()throws Exception{
  product.setPrice(new BigDecimal("13.00"));products.save(product);Long id=place("free",2);product.setPrice(new BigDecimal("15.00"));products.save(product);
  ShopOrder o=orders.findById(id).orElseThrow();assertEquals(0,o.getDeliveryFee().compareTo(BigDecimal.ZERO));assertEquals(0,o.getTotal().compareTo(new BigDecimal("26.00")));assertEquals(0,o.getItems().get(0).getUnitPrice().compareTo(new BigDecimal("13.00")));
 }
 @Test void concurrentRetriesReserveStockOnce()throws Exception{
  var request=new CheckoutRequest("12 Test Street","SW1A 1AA","concurrent",List.of(new CheckoutRequest.Line(product.getId(),2)));
  ExecutorService pool=Executors.newFixedThreadPool(2);try{var a=pool.submit(()->service.checkout(customer.getEmail(),request).getId());var b=pool.submit(()->service.checkout(customer.getEmail(),request).getId());assertEquals(a.get(10,TimeUnit.SECONDS),b.get(10,TimeUnit.SECONDS));assertEquals(8,products.findById(product.getId()).orElseThrow().getStockQuantity());}finally{pool.shutdownNow();}
 }
 @Test void authenticationAndStaffBoundaries()throws Exception{
  mvc.perform(get("/api/products")).andExpect(status().isOk());mvc.perform(get("/")).andExpect(status().isOk());
  mvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized());
  mvc.perform(get("/api/admin/users").header("Authorization","Bearer "+customerToken)).andExpect(status().isForbidden());
  mvc.perform(get("/api/rider/orders").header("Authorization","Bearer "+customerToken)).andExpect(status().isForbidden());
  mvc.perform(post("/api/admin/products").header("Authorization","Bearer "+customerToken).contentType("application/json").content("{}")).andExpect(status().isForbidden());
  String login="{\"email\":\""+customer.getEmail()+"\",\"password\":\"TestingOnly123!\"}";
  mvc.perform(post("/api/auth/login").contentType("application/json").content(login)).andExpect(status().isOk()).andExpect(jsonPath("$.accessToken").isNotEmpty());
  mvc.perform(post("/api/auth/login").contentType("application/json").content(login.replace("TestingOnly123!","wrong"))).andExpect(status().isUnauthorized());
  String email=UUID.randomUUID()+"@test.example";
  mvc.perform(post("/api/auth/register").contentType("application/json").content("{\"firstName\":\"New\",\"lastName\":\"Person\",\"email\":\""+email+"\",\"password\":\"TestingOnly123!\",\"role\":\"ADMIN\"}")).andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("CUSTOMER"));
 }
 @Test void disablingAndChangingRolesInvalidateExistingTokens()throws Exception{
  mvc.perform(patch("/api/admin/users/"+customer.getId()).header("Authorization","Bearer "+adminToken).contentType("application/json").content("{\"role\":\"CUSTOMER\",\"active\":false}")).andExpect(status().isOk());
  mvc.perform(get("/api/me").header("Authorization","Bearer "+customerToken)).andExpect(status().isUnauthorized());
  mvc.perform(patch("/api/admin/users/"+rider.getId()).header("Authorization","Bearer "+adminToken).contentType("application/json").content("{\"role\":\"CUSTOMER\",\"active\":true}")).andExpect(status().isOk());
  mvc.perform(get("/api/rider/orders").header("Authorization","Bearer "+riderToken)).andExpect(status().isUnauthorized());
  mvc.perform(patch("/api/admin/users/"+admin.getId()).header("Authorization","Bearer "+adminToken).contentType("application/json").content("{\"role\":\"CUSTOMER\",\"active\":false}")).andExpect(status().isBadRequest());
 }
 @Test void inactiveCategoryHidesProductsAndPreventsCheckout()throws Exception{
  mvc.perform(put("/api/admin/categories/"+category.getId()).header("Authorization","Bearer "+adminToken).contentType("application/json").content("{\"name\":\""+category.getName()+"\",\"description\":\"Test\",\"active\":false}")).andExpect(status().isOk());
  mvc.perform(get("/api/products/"+product.getId())).andExpect(status().isNotFound());
  mvc.perform(post("/api/orders").header("Authorization","Bearer "+customerToken).contentType("application/json").content(checkout("inactive",1))).andExpect(status().isConflict());
  assertEquals(10,products.findById(product.getId()).orElseThrow().getStockQuantity());
 }

 @Test void nativeWebPreviewCorsOnlyAllowsConfiguredOrigin()throws Exception{
  mvc.perform(options("/api/orders").header("Origin","http://localhost:8081").header("Access-Control-Request-Method","POST").header("Access-Control-Request-Headers","Authorization,Content-Type")).andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin","http://localhost:8081"));
  mvc.perform(options("/api/orders").header("Origin","https://untrusted.example").header("Access-Control-Request-Method","POST")).andExpect(status().isForbidden());
 }

}
