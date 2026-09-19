package com.miniecommerce.commerce;

import com.miniecommerce.common.api.ApiResponse;
import com.miniecommerce.security.AuthenticatedUser;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/coupons")
public class CouponController {
 private final CommerceService service;public CouponController(CommerceService service){this.service=service;}
 @GetMapping public ApiResponse<List<CommerceDtos.CouponView>> list(){return ApiResponse.success(service.coupons());}
 @PostMapping("/{id}/claim") public ApiResponse<CommerceDtos.CouponView> claim(@AuthenticationPrincipal AuthenticatedUser u,@PathVariable long id){return ApiResponse.success(service.claim(u.id(),id));}
 @GetMapping("/mine") public ApiResponse<List<CommerceDtos.CouponView>> mine(@AuthenticationPrincipal AuthenticatedUser u){return ApiResponse.success(service.myCoupons(u.id()));}
}
