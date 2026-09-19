package com.miniecommerce.security;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
class JwtServiceTest {
 @Test void roundTripsIdentity(){JwtService jwt=new JwtService("0123456789012345678901234567890123456789",3600);String token=jwt.issue(new AuthenticatedUser(7L,"demo@example.com","USER"));var claims=jwt.parse(token);assertThat(claims.getSubject()).isEqualTo("7");assertThat(claims.get("role",String.class)).isEqualTo("USER");assertThat(claims.getId()).isNotBlank();}
}
