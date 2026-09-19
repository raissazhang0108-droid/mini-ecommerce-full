package com.miniecommerce.catalog;

import java.math.BigDecimal;
import java.util.List;

public final class CatalogDtos {
 private CatalogDtos(){}
 public record CategoryView(Long id,String name,String slug,Integer sortOrder){}
 public record SkuView(Long id,String skuCode,String name,BigDecimal price,Integer stock,String status){}
 public record ProductView(Long id,Long categoryId,String categoryName,String name,String subtitle,String description,String coverUrl,String status,BigDecimal minPrice,List<SkuView> skus){}
}
