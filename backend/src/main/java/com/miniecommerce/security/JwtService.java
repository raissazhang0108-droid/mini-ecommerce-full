package com.miniecommerce.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtService {
    private final SecretKey key; private final long expirationSeconds;
    public JwtService(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.expiration-seconds}") long expirationSeconds) {
        this.key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); this.expirationSeconds=expirationSeconds;
    }
    public String issue(AuthenticatedUser user) {
        Instant now=Instant.now();
        return Jwts.builder().subject(user.id().toString()).id(UUID.randomUUID().toString()).claim("account", user.account()).claim("role", user.role())
            .issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(expirationSeconds))).signWith(key).compact();
    }
    public Claims parse(String token) { return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload(); }
    public long expirationSeconds(){return expirationSeconds;}
}
