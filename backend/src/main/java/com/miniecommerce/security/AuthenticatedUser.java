package com.miniecommerce.security;
public record AuthenticatedUser(Long id, String account, String role) {}
