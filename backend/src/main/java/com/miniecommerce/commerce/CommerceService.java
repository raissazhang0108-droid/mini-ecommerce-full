package com.miniecommerce.commerce;

import com.miniecommerce.common.api.BusinessException;
import com.miniecommerce.common.api.PageResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommerceService {
 private final JdbcTemplate jdbc;
 public CommerceService(JdbcTemplate jdbc){this.jdbc=jdbc;}
 private record Sku(Long id,Long productId,String productName,String skuName,String skuCode,String coverUrl,BigDecimal price,int stock){}
 private record Calculation(List<CommerceDtos.PreviewItem> items,BigDecimal goods,BigDecimal discount,BigDecimal payable,Long couponId){}

 @Transactional public CommerceDtos.CartView addCart(long userId,CommerceDtos.CartAddRequest r){
   Sku s=sku(r.skuId(),true);Integer current=jdbc.query("select quantity from cart_items where user_id=? and sku_id=? for update",rs->rs.next()?rs.getInt(1):null,userId,r.skuId());
   int target=(current==null?0:current)+r.quantity();BusinessRules.requireStock(s.stock(),target);
   jdbc.update("insert into cart_items(user_id,sku_id,quantity) values(?,?,?) on duplicate key update quantity=values(quantity),updated_at=current_timestamp",userId,r.skuId(),target);return cart(userId);
 }
 @Transactional public CommerceDtos.CartView updateCart(long userId,long itemId,CommerceDtos.CartUpdateRequest r){
   Long skuId=jdbc.query("select sku_id from cart_items where id=? and user_id=? for update",rs->rs.next()?rs.getLong(1):null,itemId,userId);if(skuId==null)throw BusinessException.notFound("购物车项不存在");
   BusinessRules.requireStock(sku(skuId,true).stock(),r.quantity());jdbc.update("update cart_items set quantity=?,updated_at=current_timestamp where id=? and user_id=?",r.quantity(),itemId,userId);return cart(userId);
 }
 public CommerceDtos.CartView cart(long userId){
   List<CommerceDtos.CartItemView> items=jdbc.query("select ci.id,s.id,p.id,p.name,s.name,p.cover_url,s.price,ci.quantity,s.stock from cart_items ci join skus s on s.id=ci.sku_id join products p on p.id=s.product_id where ci.user_id=? and p.status='ACTIVE' and s.status='ACTIVE' order by ci.id",(r,n)->new CommerceDtos.CartItemView(r.getLong(1),r.getLong(2),r.getLong(3),r.getString(4),r.getString(5),r.getString(6),r.getBigDecimal(7),r.getInt(8),r.getInt(9),BusinessRules.subtotal(r.getBigDecimal(7),r.getInt(8))),userId);
   BigDecimal total=items.stream().map(CommerceDtos.CartItemView::subtotal).reduce(BigDecimal.ZERO,BigDecimal::add);int qty=items.stream().mapToInt(CommerceDtos.CartItemView::quantity).sum();return new CommerceDtos.CartView(items,total,qty);
 }
 public void deleteCartItem(long userId,long itemId){if(jdbc.update("delete from cart_items where id=? and user_id=?",itemId,userId)==0)throw BusinessException.notFound("购物车项不存在");}
 public void clearCart(long userId){jdbc.update("delete from cart_items where user_id=?",userId);}

 public List<CommerceDtos.CouponView> coupons(){return jdbc.query("select id,name,discount_amount,minimum_amount,valid_from,valid_to,status from coupons where status='ACTIVE' and now() between valid_from and valid_to order by id",(r,n)->coupon(r));}
 @Transactional public CommerceDtos.CouponView claim(long userId,long couponId){
   CommerceDtos.CouponView c=couponById(couponId);if(!"ACTIVE".equals(c.status())||LocalDateTime.now().isBefore(c.validFrom())||LocalDateTime.now().isAfter(c.validTo()))throw BusinessException.badRequest("优惠券不在可领取时间内");
   if(jdbc.queryForObject("select count(*) from user_coupons where user_id=? and coupon_id=?",Integer.class,userId,couponId)>0)throw BusinessException.conflict("每位用户仅可领取一次");
   jdbc.update("insert into user_coupons(user_id,coupon_id,status) values(?,?,'UNUSED')",userId,couponId);return c;
 }
 public List<CommerceDtos.CouponView> myCoupons(long userId){return jdbc.query("select c.id,c.name,c.discount_amount,c.minimum_amount,c.valid_from,c.valid_to,uc.status from user_coupons uc join coupons c on c.id=uc.coupon_id where uc.user_id=? order by uc.id desc",(r,n)->coupon(r),userId);}

 public CommerceDtos.OrderPreview preview(long userId,CommerceDtos.OrderRequest req){Calculation c=calculate(userId,req,false);return new CommerceDtos.OrderPreview(c.items(),c.goods(),c.discount(),c.payable(),c.couponId());}
 @Transactional public CommerceDtos.OrderView create(long userId,CommerceDtos.OrderRequest req){
   Calculation c=calculate(userId,req,true);String no=orderNo();
   jdbc.update("insert into orders(order_no,user_id,status,goods_amount,discount_amount,payable_amount,coupon_id,shipping_address) values(?,?,'PENDING_PAYMENT',?,?,?,?,?)",no,userId,c.goods(),c.discount(),c.payable(),c.couponId(),req.shippingAddress().trim());
   Long orderId=jdbc.queryForObject("select last_insert_id()",Long.class);
   for(CommerceDtos.PreviewItem i:c.items()){
     Sku s=sku(i.skuId(),true);if(jdbc.update("update skus set stock=stock-? where id=? and stock>=?",i.quantity(),i.skuId(),i.quantity())!=1)throw BusinessException.conflict("库存不足: "+s.skuName());
     jdbc.update("insert into order_items(order_id,sku_id,product_name,sku_name,sku_code,unit_price,quantity,subtotal) values(?,?,?,?,?,?,?,?)",orderId,i.skuId(),i.productName(),i.skuName(),s.skuCode(),i.unitPrice(),i.quantity(),i.subtotal());
   }
   if(c.couponId()!=null&&jdbc.update("update user_coupons set status='USED',used_order_id=?,used_at=now() where user_id=? and coupon_id=? and status='UNUSED'",orderId,userId,c.couponId())!=1)throw BusinessException.conflict("优惠券已被使用");
   if(req.items()==null||req.items().isEmpty()) jdbc.update("delete from cart_items where user_id=?",userId);return order(userId,orderId,false);
 }
 public PageResponse<CommerceDtos.OrderView> orders(long userId,String status,int page,int size,boolean admin){
   int p=Math.max(1,page),s=Math.min(100,Math.max(1,size));String where=admin?" where 1=1":" where user_id="+userId;List<Object> args=new ArrayList<>();if(status!=null&&!status.isBlank()){where+=" and status=?";args.add(status);}
   long total=jdbc.queryForObject("select count(*) from orders"+where,Long.class,args.toArray());args.add(s);args.add((p-1)*s);
   List<Long> ids=jdbc.query("select id from orders"+where+" order by id desc limit ? offset ?",(r,n)->r.getLong(1),args.toArray());List<CommerceDtos.OrderView> result=ids.stream().map(id->order(userId,id,admin)).toList();return new PageResponse<>(result,total,p,s);
 }
 public CommerceDtos.OrderView order(long userId,long id,boolean admin){
   String sql="select id,order_no,status,goods_amount,discount_amount,payable_amount,shipping_address,created_at from orders where id=?"+(admin?"":" and user_id=?");Object[] args=admin?new Object[]{id}:new Object[]{id,userId};
   List<CommerceDtos.OrderView> rows=jdbc.query(sql,(r,n)->new CommerceDtos.OrderView(r.getLong(1),r.getString(2),r.getString(3),r.getBigDecimal(4),r.getBigDecimal(5),r.getBigDecimal(6),r.getString(7),r.getTimestamp(8).toLocalDateTime(),List.of()),args);if(rows.isEmpty())throw BusinessException.notFound("订单不存在");
   var o=rows.get(0);var items=jdbc.query("select sku_id,product_name,sku_name,sku_code,unit_price,quantity,subtotal from order_items where order_id=? order by id",(r,n)->new CommerceDtos.OrderItemView(r.getLong(1),r.getString(2),r.getString(3),r.getString(4),r.getBigDecimal(5),r.getInt(6),r.getBigDecimal(7)),id);
   return new CommerceDtos.OrderView(o.id(),o.orderNo(),o.status(),o.goodsAmount(),o.discountAmount(),o.payableAmount(),o.shippingAddress(),o.createdAt(),items);
 }
 @Transactional public CommerceDtos.OrderView cancel(long userId,long id){return reverse(userId,id,"PENDING_PAYMENT","CANCELLED");}
 @Transactional public CommerceDtos.OrderView refund(long userId,long id){return reverse(userId,id,"PAID","REFUNDED");}
 private CommerceDtos.OrderView reverse(long userId,long id,String expected,String target){
   String status=lockOwnedOrder(userId,id);if(!expected.equals(status))throw BusinessException.conflict("当前订单状态不允许该操作");restore(id);jdbc.update("update orders set status=?,updated_at=now() where id=?",target,id);return order(userId,id,false);
 }
 @Transactional public CommerceDtos.PayView pay(long userId,long id){
   String status=lockOwnedOrder(userId,id);if("PAID".equals(status)){return payment(id);}if(!"PENDING_PAYMENT".equals(status))throw BusinessException.conflict("当前订单状态不可支付");
   String paymentNo="SIM"+orderNo();jdbc.update("insert into payments(order_id,payment_no,status,paid_at) values(?,?,'SUCCESS',now())",id,paymentNo);jdbc.update("update orders set status='PAID',paid_at=now(),updated_at=now() where id=?",id);return payment(id);
 }
 public CommerceDtos.TrackingView tracking(long userId,long id,boolean admin){
   if(admin) order(userId,id,true); else order(userId,id,false);
   return trackingQuery("where o.id=?",id);
 }
 public CommerceDtos.TrackingView trackingByNumber(long userId,String trackingNumber){Long orderId=jdbc.query("select o.id from orders o join logistics l on l.order_id=o.id where o.user_id=? and l.tracking_number=?",r->r.next()?r.getLong(1):null,userId,trackingNumber);if(orderId==null)throw BusinessException.notFound("物流记录不存在");return tracking(userId,orderId,false);}
 private CommerceDtos.TrackingView trackingQuery(String where,Object value){
   List<CommerceDtos.TrackingView> v=jdbc.query("select l.id,o.order_no,l.carrier,l.tracking_number,l.status,l.shipped_at,l.delivered_at from logistics l join orders o on o.id=l.order_id "+where,(r,n)->new CommerceDtos.TrackingView(r.getLong(1),r.getString(2),r.getString(3),r.getString(4),r.getString(5),r.getTimestamp(6).toLocalDateTime(),r.getTimestamp(7)==null?null:r.getTimestamp(7).toLocalDateTime(),List.of()),value);if(v.isEmpty())throw BusinessException.notFound("物流记录不存在");var t=v.get(0);
   var events=jdbc.query("select status,description,event_time from shipment_tracking_events where shipment_id=? order by event_time,id",(r,n)->new CommerceDtos.ShipmentEventView(r.getString(1),r.getString(2),r.getTimestamp(3).toLocalDateTime()),t.shipmentId());return new CommerceDtos.TrackingView(t.shipmentId(),t.orderNo(),t.carrier(),t.trackingNumber(),t.status(),t.shippedAt(),t.deliveredAt(),events);
 }
 @Transactional public CommerceDtos.TrackingView ship(long id,CommerceDtos.ShipRequest req){
   String status=lockAnyOrder(id);if(!"PAID".equals(status))throw BusinessException.conflict("只有已支付订单可以发货");
   jdbc.update("insert into logistics(order_id,carrier,tracking_number,status,shipped_at) values(?,?,?,'SHIPPED',now())",id,req.carrier().trim(),req.trackingNumber().trim());Long shipmentId=jdbc.queryForObject("select last_insert_id()",Long.class);jdbc.update("insert into shipment_tracking_events(shipment_id,status,description,event_time) values(?,'CREATED','商家已创建物流单',now()),(?,'PICKED_UP','包裹已由承运商揽收',now())",shipmentId,shipmentId);jdbc.update("update orders set status='SHIPPED',updated_at=now() where id=?",id);return tracking(0,id,true);
 }
 @Transactional public CommerceDtos.TrackingView deliver(long id){String status=lockAnyOrder(id);if("DELIVERED".equals(status)||"COMPLETED".equals(status))return tracking(0,id,true);if(!"SHIPPED".equals(status))throw BusinessException.conflict("只有已发货订单可以确认送达");jdbc.update("update logistics set status='DELIVERED',delivered_at=now() where order_id=?",id);jdbc.update("insert into shipment_tracking_events(shipment_id,status,description,event_time) select id,'DELIVERED','包裹已送达',now() from logistics where order_id=?",id);jdbc.update("update orders set status='DELIVERED',updated_at=now() where id=?",id);return tracking(0,id,true);}
 @Transactional public CommerceDtos.TrackingView deliverShipment(long shipmentId){Long orderId=jdbc.query("select order_id from logistics where id=?",r->r.next()?r.getLong(1):null,shipmentId);if(orderId==null)throw BusinessException.notFound("物流记录不存在");return deliver(orderId);}
 @Transactional public CommerceDtos.OrderView complete(long userId,long id){String status=lockOwnedOrder(userId,id);if("COMPLETED".equals(status))return order(userId,id,false);if(!"DELIVERED".equals(status))throw BusinessException.conflict("只有已送达订单可以完成");jdbc.update("update orders set status='COMPLETED',updated_at=now() where id=?",id);return order(userId,id,false);}

 private Calculation calculate(long userId,CommerceDtos.OrderRequest req,boolean lock){
   List<CommerceDtos.BuyItem> requested=req.items();if(requested==null||requested.isEmpty())requested=jdbc.query("select sku_id,quantity from cart_items where user_id=? order by id",(r,n)->new CommerceDtos.BuyItem(r.getLong(1),r.getInt(2)),userId);if(requested.isEmpty())throw BusinessException.badRequest("订单商品不能为空");
   Map<Long,Integer> merged=new LinkedHashMap<>();for(var i:requested)merged.merge(i.skuId(),i.quantity(),Integer::sum);List<CommerceDtos.PreviewItem> items=new ArrayList<>();BigDecimal goods=BigDecimal.ZERO;
   for(var e:merged.entrySet()){Sku s=sku(e.getKey(),lock);BusinessRules.requireStock(s.stock(),e.getValue());BigDecimal sub=BusinessRules.subtotal(s.price(),e.getValue());goods=goods.add(sub);items.add(new CommerceDtos.PreviewItem(s.id(),s.productName(),s.skuName(),s.price(),e.getValue(),sub));}
   BigDecimal discount=BigDecimal.ZERO;if(req.couponId()!=null){CommerceDtos.CouponView c=ownedCoupon(userId,req.couponId(),lock);discount=BusinessRules.discount(goods,c.minimumAmount(),c.discountAmount());if(discount.signum()==0)throw BusinessException.badRequest("订单金额未达到优惠券门槛");}
   return new Calculation(items,goods,discount,goods.subtract(discount),req.couponId());
 }
 private Sku sku(long id,boolean lock){String sql="select s.id,s.product_id,p.name,s.name,s.sku_code,p.cover_url,s.price,s.stock from skus s join products p on p.id=s.product_id where s.id=? and s.status='ACTIVE' and p.status='ACTIVE'"+(lock?" for update":"");List<Sku> r=jdbc.query(sql,(x,n)->new Sku(x.getLong(1),x.getLong(2),x.getString(3),x.getString(4),x.getString(5),x.getString(6),x.getBigDecimal(7),x.getInt(8)),id);if(r.isEmpty())throw BusinessException.notFound("SKU 不存在或已下架");return r.get(0);}
 private CommerceDtos.CouponView coupon(java.sql.ResultSet r)throws java.sql.SQLException{return new CommerceDtos.CouponView(r.getLong(1),r.getString(2),r.getBigDecimal(3),r.getBigDecimal(4),r.getTimestamp(5).toLocalDateTime(),r.getTimestamp(6).toLocalDateTime(),r.getString(7));}
 private CommerceDtos.CouponView couponById(long id){List<CommerceDtos.CouponView> r=jdbc.query("select id,name,discount_amount,minimum_amount,valid_from,valid_to,status from coupons where id=?",(x,n)->coupon(x),id);if(r.isEmpty())throw BusinessException.notFound("优惠券不存在");return r.get(0);}
 private CommerceDtos.CouponView ownedCoupon(long userId,long couponId,boolean lock){String sql="select c.id,c.name,c.discount_amount,c.minimum_amount,c.valid_from,c.valid_to,uc.status from user_coupons uc join coupons c on c.id=uc.coupon_id where uc.user_id=? and c.id=? and uc.status='UNUSED' and c.status='ACTIVE' and now() between c.valid_from and c.valid_to"+(lock?" for update":"");List<CommerceDtos.CouponView> r=jdbc.query(sql,(x,n)->coupon(x),userId,couponId);if(r.isEmpty())throw BusinessException.badRequest("优惠券不可用");return r.get(0);}
 private String lockOwnedOrder(long userId,long id){List<String> r=jdbc.query("select status from orders where id=? and user_id=? for update",(x,n)->x.getString(1),id,userId);if(r.isEmpty())throw BusinessException.notFound("订单不存在");return r.get(0);}
 private String lockAnyOrder(long id){List<String> r=jdbc.query("select status from orders where id=? for update",(x,n)->x.getString(1),id);if(r.isEmpty())throw BusinessException.notFound("订单不存在");return r.get(0);}
 private void restore(long orderId){jdbc.update("update skus s join order_items oi on oi.sku_id=s.id set s.stock=s.stock+oi.quantity where oi.order_id=?",orderId);jdbc.update("update user_coupons set status='UNUSED',used_order_id=null,used_at=null where used_order_id=?",orderId);}
 private CommerceDtos.PayView payment(long orderId){return jdbc.queryForObject("select o.order_no,o.status,p.payment_no,p.paid_at from orders o join payments p on p.order_id=o.id where o.id=?",(r,n)->new CommerceDtos.PayView(r.getString(1),r.getString(2),r.getString(3),r.getTimestamp(4).toLocalDateTime()),orderId);}
 private String orderNo(){return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"))+String.format("%04d",ThreadLocalRandom.current().nextInt(10000));}
}
