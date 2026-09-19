package com.miniecommerce.commerce;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class CommerceDtos {
 private CommerceDtos(){}
 public record CartAddRequest(@NotNull Long skuId,@NotNull @Min(1) @Max(99) Integer quantity){}
 public record CartUpdateRequest(@NotNull @Min(1) @Max(99) Integer quantity){}
 public record CartItemView(Long id,Long skuId,Long productId,String productName,String skuName,String coverUrl,BigDecimal unitPrice,Integer quantity,Integer stock,BigDecimal subtotal){}
 public record CartView(List<CartItemView> items,BigDecimal totalAmount,Integer totalQuantity){}
 public record CouponView(Long id,String name,BigDecimal discountAmount,BigDecimal minimumAmount,LocalDateTime validFrom,LocalDateTime validTo,String status){}
 public record BuyItem(@NotNull Long skuId,@NotNull @Min(1) Integer quantity){}
 public record OrderRequest(List<@Valid BuyItem> items,Long couponId,@NotBlank @Size(max=500) String shippingAddress){}
 public record PreviewItem(Long skuId,String productName,String skuName,BigDecimal unitPrice,Integer quantity,BigDecimal subtotal){}
 public record OrderPreview(List<PreviewItem> items,BigDecimal goodsAmount,BigDecimal discountAmount,BigDecimal payableAmount,Long couponId){}
 public record OrderItemView(Long skuId,String productName,String skuName,String skuCode,BigDecimal unitPrice,Integer quantity,BigDecimal subtotal){}
 public record OrderView(Long id,String orderNo,String status,BigDecimal goodsAmount,BigDecimal discountAmount,BigDecimal payableAmount,String shippingAddress,LocalDateTime createdAt,List<OrderItemView> items){}
 public record PayView(String orderNo,String status,String paymentNo,LocalDateTime paidAt){}
 public record ShipRequest(@NotBlank String carrier,@NotBlank @Pattern(regexp="^[A-Za-z0-9-]{6,40}$") String trackingNumber){}
 public record ShipmentEventView(String status,String description,LocalDateTime eventTime){}
 public record TrackingView(Long shipmentId,String orderNo,String carrier,String trackingNumber,String status,LocalDateTime shippedAt,LocalDateTime deliveredAt,List<ShipmentEventView> events){}
}
