package com.miniecommerce.commerce;

import com.miniecommerce.common.api.ApiResponse;
import com.miniecommerce.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/cart")
public class CartController {
 private final CommerceService service;public CartController(CommerceService service){this.service=service;}
 @GetMapping public ApiResponse<CommerceDtos.CartView> get(@AuthenticationPrincipal AuthenticatedUser u){return ApiResponse.success(service.cart(u.id()));}
 @PostMapping("/items") public ApiResponse<CommerceDtos.CartView> add(@AuthenticationPrincipal AuthenticatedUser u,@Valid @RequestBody CommerceDtos.CartAddRequest r){return ApiResponse.success(service.addCart(u.id(),r));}
 @PutMapping("/items/{id}") public ApiResponse<CommerceDtos.CartView> update(@AuthenticationPrincipal AuthenticatedUser u,@PathVariable long id,@Valid @RequestBody CommerceDtos.CartUpdateRequest r){return ApiResponse.success(service.updateCart(u.id(),id,r));}
 @DeleteMapping("/items/{id}") public ApiResponse<Void> delete(@AuthenticationPrincipal AuthenticatedUser u,@PathVariable long id){service.deleteCartItem(u.id(),id);return ApiResponse.success();}
 @DeleteMapping public ApiResponse<Void> clear(@AuthenticationPrincipal AuthenticatedUser u){service.clearCart(u.id());return ApiResponse.success();}
}
