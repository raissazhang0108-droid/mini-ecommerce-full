package com.miniecommerce.auth;

import static org.assertj.core.api.Assertions.assertThat;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class AuthDtosTest {
 private final jakarta.validation.Validator validator=Validation.buildDefaultValidatorFactory().getValidator();
 @Test void acceptsEmailAndMainlandMobile(){assertThat(validator.validate(new AuthDtos.RegisterRequest("buyer@example.com","Password1!"))).isEmpty();assertThat(validator.validate(new AuthDtos.RegisterRequest("138"+"0013"+"8000","Password1!"))).isEmpty();}
 @Test void rejectsInvalidAccountAndShortPassword(){assertThat(validator.validate(new AuthDtos.RegisterRequest("not-an-account","short"))).hasSize(2);}
 @Test void seededPasswordsAreValidBcrypt(){var encoder=new BCryptPasswordEncoder();assertThat(encoder.matches("Admin123!","$2b$12$gKxBYa6Dae6Xe.mf/pCyoOpKGVkwzGpwLiNb56V9D79kXugihLs1i")).isTrue();assertThat(encoder.matches("Demo123!","$2b$12$i3YMuR9IKrFhaCplTRIzz.LYB0aJ0sQRd2zRK2P/4mT5hwZHNtLg.")).isTrue();}
}
