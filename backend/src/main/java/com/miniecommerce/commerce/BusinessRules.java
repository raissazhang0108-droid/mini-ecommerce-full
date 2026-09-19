package com.miniecommerce.commerce;

import com.miniecommerce.common.api.BusinessException;
import java.math.BigDecimal;
import java.math.RoundingMode;

public final class BusinessRules {
 private BusinessRules(){}
 public static BigDecimal subtotal(BigDecimal price,int quantity){if(price==null||price.signum()<=0)throw BusinessException.badRequest("商品价格必须大于 0");if(quantity<=0)throw BusinessException.badRequest("数量必须大于 0");return price.multiply(BigDecimal.valueOf(quantity)).setScale(2,RoundingMode.HALF_UP);}
 public static BigDecimal discount(BigDecimal goods,BigDecimal minimum,BigDecimal amount){return goods.compareTo(minimum)>=0?amount.min(goods):BigDecimal.ZERO.setScale(2);}
 public static void requireStock(int stock,int quantity){if(stock<quantity)throw BusinessException.conflict("库存不足");}
 public static boolean canCancel(String status){return "PENDING_PAYMENT".equals(status);}
 public static boolean canRefund(String status){return "PAID".equals(status);}
}
