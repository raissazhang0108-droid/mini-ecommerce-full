package com.miniecommerce.commerce;

import com.miniecommerce.common.api.ApiResponse;
import com.miniecommerce.security.AuthenticatedUser;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/user/coupons")
public class UserCouponController {
 private final CommerceService service;public UserCouponController(CommerceService service){this.service=service;}
 @GetMapping public ApiResponse<List<CommerceDtos.CouponView>> mine(@AuthenticationPrincipal AuthenticatedUser u){return ApiResponse.success(service.myCoupons(u.id()));}
}
