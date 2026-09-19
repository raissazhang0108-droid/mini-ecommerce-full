package com.miniecommerce.admin;

import com.miniecommerce.commerce.CommerceDtos;
import com.miniecommerce.commerce.CommerceService;
import com.miniecommerce.common.api.ApiResponse;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/admin/shipments")
public class AdminShipmentController {
 private final CommerceService service;public AdminShipmentController(CommerceService service){this.service=service;}
 @PostMapping("/{shipmentId}/deliver") public ApiResponse<CommerceDtos.TrackingView> deliver(@PathVariable long shipmentId){return ApiResponse.success(service.deliverShipment(shipmentId));}
}
