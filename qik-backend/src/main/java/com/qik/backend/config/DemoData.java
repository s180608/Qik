package com.qik.backend.config;
import com.qik.backend.entity.*;
import com.qik.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
@Component @Profile("demo")
public class DemoData implements CommandLineRunner {
 private final UserRepository users;private final CategoryRepository categories;private final ProductRepository products;private final PasswordEncoder encoder;
 @Value("${qik.demo.password}") private String password;
 public DemoData(UserRepository u,CategoryRepository c,ProductRepository p,PasswordEncoder e){users=u;categories=c;products=p;encoder=e;}
 @Transactional public void run(String... args){
  if(password.length()<12)throw new IllegalArgumentException("DEMO_PASSWORD must contain at least 12 characters");
  for(Role role:Role.values()){String email=role.name().toLowerCase()+"@qik.demo";if(!users.existsByEmail(email))users.save(User.builder().firstName(role==Role.RIDER?"Jamie":"QIK").lastName(role.name()).email(email).password(encoder.encode(password)).role(role).active(true).build());}
  if(categories.count()>0||products.count()>0)return;
  String[] names={"Fruit & veg","Dairy & eggs","Bakery","Pantry","Drinks","Snacks"};Category[] cs=new Category[names.length];for(int i=0;i<names.length;i++)cs[i]=categories.save(Category.builder().name(names[i]).description("Everyday favourites").build());
  String[][] data={{"Perfectly ripe avocados","2 pack","2.40","0","avocado"},{"British strawberries","400g · British grown","3.25","0","strawberry"},{"Sweet bananas","5 pack","1.30","0","banana"},{"Tender broccoli","1 head","0.85","0","broccoli"},{"Oat milk","1 litre · Barista","1.85","1","milk"},{"Free range eggs","6 large eggs","2.20","1","eggs"},{"Greek yoghurt","500g · Natural","2.10","1","yoghurt"},{"Sourdough loaf","500g · Baked today","3.50","2","bread"},{"Butter croissants","2 pack · All butter","2.30","2","croissant"},{"Penne pasta","500g · Durum wheat","1.20","3","pasta"},{"Extra virgin olive oil","500ml","5.90","3","oil"},{"Sparkling water","1 litre","0.90","4","water"},{"Fresh orange juice","1 litre","2.75","4","orange"},{"Dark chocolate","100g · 70% cocoa","2.00","5","chocolate"},{"Sea salt crisps","150g","1.75","5","crisps"}};
  for(var d:data)products.save(Product.builder().name(d[0]).description(d[1]).price(new BigDecimal(d[2])).stockQuantity(60).category(cs[Integer.parseInt(d[3])]).imageUrl("/assets/"+d[4]+".svg").build());
 }
}
