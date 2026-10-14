package com.qik.backend.config;
import com.qik.backend.entity.*;
import com.qik.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Locale;
@Component
public class AdminBootstrap implements CommandLineRunner {
 private final UserRepository users;private final PasswordEncoder encoder;
 @Value("${QIK_ADMIN_EMAIL:}") private String email;
 @Value("${QIK_ADMIN_PASSWORD:}") private String password;
 public AdminBootstrap(UserRepository users,PasswordEncoder encoder){this.users=users;this.encoder=encoder;}
 public void run(String...args){if(email.isBlank())return;String normalized=email.trim().toLowerCase(Locale.ROOT);
  if(users.existsByEmail(normalized))return;
  if(password.length()<12)throw new IllegalArgumentException("QIK_ADMIN_PASSWORD must contain at least 12 characters");
  users.save(User.builder().firstName("QIK").lastName("Admin").email(normalized).password(encoder.encode(password)).role(Role.ADMIN).active(true).build());
 }
}
