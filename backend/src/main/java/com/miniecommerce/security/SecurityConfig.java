package com.miniecommerce.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.miniecommerce.common.api.ApiResponse;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration @EnableMethodSecurity
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder(){return new BCryptPasswordEncoder();}
    @Bean SecurityFilterChain chain(HttpSecurity http,JwtAuthenticationFilter jwt,ObjectMapper om) throws Exception {
        return http.csrf(c->c.disable()).cors(c->{}).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
          .authorizeHttpRequests(a->a.requestMatchers("/api/v1/auth/register","/api/v1/auth/login","/api/v1/health","/actuator/**","/swagger-ui/**","/swagger-ui.html","/v3/api-docs/**").permitAll()
            .requestMatchers(HttpMethod.GET,"/api/v1/categories/**","/api/v1/products/**","/api/v1/coupons").permitAll().requestMatchers("/api/v1/admin/**").hasRole("ADMIN").anyRequest().authenticated())
          .exceptionHandling(e->e.authenticationEntryPoint((q,r,x)->{r.setStatus(401);r.setContentType("application/json;charset=UTF-8");om.writeValue(r.getWriter(),ApiResponse.error(40100,"请先登录"));})
            .accessDeniedHandler((q,r,x)->{r.setStatus(403);r.setContentType("application/json;charset=UTF-8");om.writeValue(r.getWriter(),ApiResponse.error(40300,"无权访问"));}))
          .addFilterBefore(jwt,UsernamePasswordAuthenticationFilter.class).build();
    }
    @Bean CorsConfigurationSource corsConfigurationSource(org.springframework.core.env.Environment env){
        CorsConfiguration c=new CorsConfiguration(); c.setAllowedOrigins(List.of(env.getProperty("app.cors.allowed-origins","http://localhost:5173").split(","))); c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS")); c.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource s=new UrlBasedCorsConfigurationSource();s.registerCorsConfiguration("/**",c);return s;
    }
}
