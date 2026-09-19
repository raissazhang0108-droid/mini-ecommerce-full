package com.miniecommerce.commerce;

import com.miniecommerce.common.api.ApiResponse;
import com.miniecommerce.security.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/shipments")
public class ShipmentController {
 private final CommerceService service;public ShipmentController(CommerceService service){this.service=service;}
 @GetMapping("/{trackingNumber}/tracking") public ApiResponse<CommerceDtos.TrackingView> tracking(@AuthenticationPrincipal AuthenticatedUser u,@PathVariable String trackingNumber){return ApiResponse.success(service.trackingByNumber(u.id(),trackingNumber));}
}
