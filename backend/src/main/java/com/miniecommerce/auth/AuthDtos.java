package com.miniecommerce.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {}
    public record RegisterRequest(
        @NotBlank @Pattern(regexp="^(?:[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}|1[3-9]\\d{9})$", message="必须是有效邮箱或手机号") String account,
        @NotBlank @Size(min=8,max=72) String password) {}
    public record LoginRequest(@NotBlank String account, @NotBlank String password) {}
    public record TokenResponse(String token, String tokenType, long expiresIn, UserView user) {}
    public record UserView(Long id, String account, String role) {}
}
