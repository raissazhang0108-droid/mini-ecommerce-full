package com.miniecommerce.commerce;

import com.miniecommerce.common.api.ApiResponse;
import com.miniecommerce.common.api.PageResponse;
import com.miniecommerce.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/orders")
public class OrderController {
 private final CommerceService service;public OrderController(CommerceService service){this.service=service;}
 @PostMapping("/preview") public ApiResponse<CommerceDtos.OrderPreview> preview(@AuthenticationPrincipal AuthenticatedUser u,@Valid @RequestBody CommerceDtos.OrderRequest r){return ApiResponse.success(service.preview(u.id(),r));}
 @PostMapping public ApiResponse<CommerceDtos.OrderView> create(@AuthenticationPrincipal AuthenticatedUser u,@Valid @RequestBody CommerceDtos.OrderRequest r){return ApiResponse.success(service.create(u.id(),r));}
 @GetMapping public ApiResponse<PageResponse<CommerceDtos.OrderView>> list(@AuthenticationPrincipal AuthenticatedUser u,@RequestParam(required=false) String status,@RequestParam(defaultValue="1") int page,@RequestParam(defaultValue="20") int pageSize){return ApiResponse.success(service.orders(u.id(),status,page,pageSize,false));}
 @GetMapping("/{id}") public ApiResponse<CommerceDtos.OrderView> detail(@AuthenticationPrincipal AuthenticatedUser u,@PathVariable long id){return ApiResponse.success(service.order(u.id(),id,false));}
 @PostMapping("/{id}/cancel") public ApiResponse<CommerceDtos.OrderView> cancel(@AuthenticationPrincipal AuthenticatedUser u,@PathVariable long id){return ApiResponse.success(service.cancel(u.id(),id));}
 @PostMapping("/{id}/refund") public ApiResponse<CommerceDtos.OrderView> refund(@AuthenticationPrincipal AuthenticatedUser u,@PathVariable long id){return ApiResponse.success(service.refund(u.id(),id));}
 @PostMapping("/{id}/pay") public ApiResponse<CommerceDtos.PayView> pay(@AuthenticationPrincipal AuthenticatedUser u,@PathVariable long id){return ApiResponse.success(service.pay(u.id(),id));}
 @PreAuthorize("hasRole('ADMIN')") @PostMapping("/{id}/ship") public ApiResponse<CommerceDtos.TrackingView> ship(@PathVariable long id,@Valid @RequestBody CommerceDtos.ShipRequest r){return ApiResponse.success(service.ship(id,r));}
 @GetMapping("/{id}/shipment") public ApiResponse<CommerceDtos.TrackingView> shipment(@AuthenticationPrincipal AuthenticatedUser u,@PathVariable long id){return ApiResponse.success(service.tracking(u.id(),id,false));}
 @GetMapping("/{id}/tracking") public ApiResponse<CommerceDtos.TrackingView> tracking(@AuthenticationPrincipal AuthenticatedUser u,@PathVariable long id){return ApiResponse.success(service.tracking(u.id(),id,false));}
 @PostMapping("/{id}/complete") public ApiResponse<CommerceDtos.OrderView> complete(@AuthenticationPrincipal AuthenticatedUser u,@PathVariable long id){return ApiResponse.success(service.complete(u.id(),id));}
}
