package com.miniecommerce.auth;

import com.miniecommerce.common.api.ApiResponse;
import com.miniecommerce.security.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController @RequestMapping("/api/v1/users")
public class UserController {
 @GetMapping("/me") public ApiResponse<AuthDtos.UserView> me(@AuthenticationPrincipal AuthenticatedUser user){return ApiResponse.success(new AuthDtos.UserView(user.id(),user.account(),user.role()));}
}
