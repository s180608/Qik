package com.qik.backend.security;
import com.qik.backend.repository.UserRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
public class ActiveAccountFilter extends OncePerRequestFilter {
 private final UserRepository users;
 public ActiveAccountFilter(UserRepository users){this.users=users;}
 @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws ServletException,IOException{
  var auth=SecurityContextHolder.getContext().getAuthentication();
  if(auth instanceof JwtAuthenticationToken token){
   var user=users.findByEmail(auth.getName());
   if(user.isEmpty()||!Boolean.TRUE.equals(user.get().getActive())||!user.get().getRole().name().equals(token.getToken().getClaimAsString("role"))){response.setStatus(401);response.setContentType("application/json");response.getWriter().write("{\"message\":\"Account unavailable or permissions changed. Sign in again.\"}");return;}
  }
  chain.doFilter(request,response);
 }
}
