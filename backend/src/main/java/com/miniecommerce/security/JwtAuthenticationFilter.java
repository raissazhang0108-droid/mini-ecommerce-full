package com.miniecommerce.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwt; private final StringRedisTemplate redis;
    public JwtAuthenticationFilter(JwtService jwt,StringRedisTemplate redis){this.jwt=jwt;this.redis=redis;}
    @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain) throws ServletException,IOException {
        String h=req.getHeader("Authorization");
        if(h!=null&&h.startsWith("Bearer ")) try {
            Claims c=jwt.parse(h.substring(7));
            if(!Boolean.TRUE.equals(redis.hasKey("jwt:blacklist:"+c.getId()))) {
                AuthenticatedUser p=new AuthenticatedUser(Long.valueOf(c.getSubject()),c.get("account",String.class),c.get("role",String.class));
                SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(p,null,List.of(new SimpleGrantedAuthority("ROLE_"+p.role()))));
            }
        } catch(Exception ignored) { SecurityContextHolder.clearContext(); }
        chain.doFilter(req,res);
    }
}
