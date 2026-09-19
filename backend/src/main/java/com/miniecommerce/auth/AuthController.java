package com.miniecommerce.auth;

import com.miniecommerce.common.api.ApiResponse;
import com.miniecommerce.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService service; public AuthController(AuthService service){this.service=service;}
    @PostMapping("/register") public ApiResponse<AuthDtos.TokenResponse> register(@Valid @RequestBody AuthDtos.RegisterRequest r){return ApiResponse.success(service.register(r));}
    @PostMapping("/login") public ApiResponse<AuthDtos.TokenResponse> login(@Valid @RequestBody AuthDtos.LoginRequest r){return ApiResponse.success(service.login(r));}
    @PostMapping("/logout") public ApiResponse<Void> logout(@RequestHeader(HttpHeaders.AUTHORIZATION) String h){service.logout(h);return ApiResponse.success();}
    @GetMapping("/me") public ApiResponse<AuthDtos.UserView> me(@AuthenticationPrincipal AuthenticatedUser p){return ApiResponse.success(service.me(p));}
}
