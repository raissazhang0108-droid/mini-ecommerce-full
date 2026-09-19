package com.miniecommerce.catalog;
import com.miniecommerce.common.api.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1")
public class CatalogController {
 private final CatalogService service;public CatalogController(CatalogService service){this.service=service;}
 @GetMapping("/categories") public ApiResponse<List<CatalogDtos.CategoryView>> categories(){return ApiResponse.success(service.categories());}
 @GetMapping("/products") public ApiResponse<List<CatalogDtos.ProductView>> products(@RequestParam(required=false) Long categoryId,@RequestParam(required=false) String keyword){return ApiResponse.success(service.products(categoryId,keyword));}
 @GetMapping("/products/{id}") public ApiResponse<CatalogDtos.ProductView> detail(@PathVariable long id){return ApiResponse.success(service.detail(id));}
 @GetMapping("/products/{id}/skus") public ApiResponse<List<CatalogDtos.SkuView>> skus(@PathVariable long id){return ApiResponse.success(service.detail(id).skus());}
}
