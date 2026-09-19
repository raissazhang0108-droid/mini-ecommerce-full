package com.miniecommerce.catalog;

import com.miniecommerce.common.api.BusinessException;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class CatalogService {
 private final JdbcTemplate jdbc; public CatalogService(JdbcTemplate jdbc){this.jdbc=jdbc;}
 public List<CatalogDtos.CategoryView> categories(){return jdbc.query("select id,name,slug,sort_order from categories where status='ACTIVE' order by sort_order,id",(r,n)->new CatalogDtos.CategoryView(r.getLong(1),r.getString(2),r.getString(3),r.getInt(4)));}
 public List<CatalogDtos.ProductView> products(Long categoryId,String keyword){
   String sql="select p.id,p.category_id,c.name,p.name,p.subtitle,p.description,p.cover_url,p.status,min(s.price) from products p join categories c on c.id=p.category_id join skus s on s.product_id=p.id and s.status='ACTIVE' where p.status='ACTIVE'";
   List<Object> args=new ArrayList<>();if(categoryId!=null){sql+=" and p.category_id=?";args.add(categoryId);}if(keyword!=null&&!keyword.isBlank()){sql+=" and (p.name like ? or p.subtitle like ?)";args.add("%"+keyword.trim()+"%");args.add("%"+keyword.trim()+"%");}sql+=" group by p.id,p.category_id,c.name,p.name,p.subtitle,p.description,p.cover_url,p.status order by p.id";
   return jdbc.query(sql,(r,n)->new CatalogDtos.ProductView(r.getLong(1),r.getLong(2),r.getString(3),r.getString(4),r.getString(5),r.getString(6),r.getString(7),r.getString(8),r.getBigDecimal(9),List.of()),args.toArray());
 }
 public CatalogDtos.ProductView detail(long id){
   List<CatalogDtos.ProductView> found=jdbc.query("select p.id,p.category_id,c.name,p.name,p.subtitle,p.description,p.cover_url,p.status,(select min(price) from skus where product_id=p.id and status='ACTIVE') from products p join categories c on c.id=p.category_id where p.id=? and p.status='ACTIVE'",(r,n)->new CatalogDtos.ProductView(r.getLong(1),r.getLong(2),r.getString(3),r.getString(4),r.getString(5),r.getString(6),r.getString(7),r.getString(8),r.getBigDecimal(9),List.of()),id);
   if(found.isEmpty()) throw BusinessException.notFound("商品不存在或已下架"); CatalogDtos.ProductView p=found.get(0);
   var skus=jdbc.query("select id,sku_code,name,price,stock,status from skus where product_id=? and status='ACTIVE' order by id",(r,n)->new CatalogDtos.SkuView(r.getLong(1),r.getString(2),r.getString(3),r.getBigDecimal(4),r.getInt(5),r.getString(6)),id);
   return new CatalogDtos.ProductView(p.id(),p.categoryId(),p.categoryName(),p.name(),p.subtitle(),p.description(),p.coverUrl(),p.status(),p.minPrice(),skus);
 }
}
