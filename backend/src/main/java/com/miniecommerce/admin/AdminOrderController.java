package com.miniecommerce.admin;

import com.miniecommerce.commerce.CommerceDtos;
import com.miniecommerce.commerce.CommerceService;
import com.miniecommerce.common.api.ApiResponse;
import com.miniecommerce.common.api.PageResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {
 private final CommerceService service;public AdminOrderController(CommerceService service){this.service=service;}
 @GetMapping public ApiResponse<PageResponse<CommerceDtos.OrderView>> list(@RequestParam(required=false) String status,@RequestParam(defaultValue="1") int page,@RequestParam(defaultValue="20") int pageSize){return ApiResponse.success(service.orders(0,status,page,pageSize,true));}
 @GetMapping("/{id}") public ApiResponse<CommerceDtos.OrderView> detail(@PathVariable long id){return ApiResponse.success(service.order(0,id,true));}
 @PostMapping("/{id}/ship") public ApiResponse<CommerceDtos.TrackingView> ship(@PathVariable long id,@Valid @RequestBody CommerceDtos.ShipRequest r){return ApiResponse.success(service.ship(id,r));}
 @PostMapping("/{id}/deliver") public ApiResponse<CommerceDtos.TrackingView> deliver(@PathVariable long id){return ApiResponse.success(service.deliver(id));}
 @GetMapping("/{id}/tracking") public ApiResponse<CommerceDtos.TrackingView> tracking(@PathVariable long id){return ApiResponse.success(service.tracking(0,id,true));}
}
