package com.miniecommerce.commerce;

import static org.assertj.core.api.Assertions.*;
import com.miniecommerce.common.api.BusinessException;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class BusinessRulesTest {
 @Test void calculatesMoneyOnServer(){assertThat(BusinessRules.subtotal(new BigDecimal("19.90"),3)).isEqualByComparingTo("59.70");assertThat(BusinessRules.discount(new BigDecimal("120"),new BigDecimal("100"),new BigDecimal("15"))).isEqualByComparingTo("15");}
 @Test void couponBelowThresholdIsZero(){assertThat(BusinessRules.discount(new BigDecimal("99.99"),new BigDecimal("100"),new BigDecimal("15"))).isZero();}
 @Test void rejectsInsufficientStock(){assertThatThrownBy(()->BusinessRules.requireStock(2,3)).isInstanceOf(BusinessException.class).hasMessageContaining("库存不足");}
 @Test void stateTransitionsAreStrict(){assertThat(BusinessRules.canCancel("PENDING_PAYMENT")).isTrue();assertThat(BusinessRules.canCancel("PAID")).isFalse();assertThat(BusinessRules.canRefund("PAID")).isTrue();assertThat(BusinessRules.canRefund("SHIPPED")).isFalse();}
}
