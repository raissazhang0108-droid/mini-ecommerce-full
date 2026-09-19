# Mini Ecommerce API（Phase 0-8）

Base URL：`/api/v1`。除公开接口外，请发送 `Authorization: Bearer <JWT>`。所有响应均为：

```json
{"code":0,"message":"success","data":{}}
```

失败时 HTTP 状态与业务状态一致，`code` 使用 `40000/40100/40300/40400/40900/50000`；参数校验为 `40001`。业务对象均通过 DTO/VO 返回，不暴露数据库实体。

## 认证

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| POST | `/auth/register` | 公开 | 邮箱或中国大陆手机号注册；account 全局唯一，密码 8-72 位、BCrypt 存储 |
| POST | `/auth/login` | 公开 | 返回 JWT、有效秒数与用户摘要 |
| POST | `/auth/logout` | 登录 | JWT jti 写入 Redis 黑名单直到 token 过期 |
| GET | `/auth/me` | 登录 | 当前用户 |
| GET | `/users/me` | 登录 | 当前用户兼容路径 |

注册：`{"account":"user@example.com","password":"Password1!"}`。登录字段相同。

种子账号：管理员 `admin@example.com / Admin123!`；普通用户 `demo@example.com / Demo123!`。

## 商品

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| GET | `/categories` | 公开 | 启用分类 |
| GET | `/products?categoryId=&keyword=` | 公开 | 在售商品列表 |
| GET | `/products/{id}` | 公开 | 商品和多个在售 SKU |
| GET | `/products/{id}/skus` | 公开 | 在售 SKU 列表（附件兼容路径） |

价格约束 `> 0`、库存约束 `>= 0`，商品和 SKU 均有上下架状态。初始化包含 3 个分类、6 个商品、12 个 SKU。

## 购物车

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/cart` | 我的购物车及服务端小计/总计 |
| POST | `/cart/items` | `{"skuId":1,"quantity":2}`；相同 SKU 合并 |
| PUT | `/cart/items/{itemId}` | `{"quantity":3}` |
| DELETE | `/cart/items/{itemId}` | 删除我的购物车项 |
| DELETE | `/cart` | 清空我的购物车 |

所有查询和写入绑定 JWT 用户；加入及修改时锁定 SKU 并校验库存。

## 优惠券

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/coupons` | 当前有效、可领取券 |
| POST | `/coupons/{couponId}/claim` | 领取；同一用户同一券仅一次 |
| GET | `/coupons/mine` | 我的券及 UNUSED/USED 状态 |
| GET | `/user/coupons` | 我的券（附件指定兼容路径） |

下单时校验领取关系、有效期、状态和最低金额；使用后不可复用，取消/退款后释放。

## 订单、支付与物流

`preview` 和 `create` 请求相同；`items` 为空或省略时使用购物车：

```json
{
  "items":[{"skuId":1,"quantity":2}],
  "couponId":1,
  "shippingAddress":"上海市浦东新区示例路 100 号"
}
```

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/orders/preview` | 服务端实时读取 SKU 价格、库存和优惠券并计算 |
| POST | `/orders` | 创建订单、保存商品/SKU/价格快照、条件扣库存、核销券 |
| GET | `/orders?status=&page=1&pageSize=20` | 我的订单分页 |
| GET | `/orders/{id}` | 我的订单详情 |
| POST | `/orders/{id}/cancel` | 仅 PENDING_PAYMENT；返库存和券 |
| POST | `/orders/{id}/refund` | 仅 PAID；返库存和券，状态 REFUNDED |
| POST | `/orders/{id}/pay` | 模拟支付；重复调用幂等返回同一支付结果 |
| POST | `/orders/{id}/ship` | 附件兼容路径，仅 ADMIN；PAID 订单发货 |
| GET | `/orders/{id}/shipment` | 我的物流与轨迹事件（附件指定路径） |
| GET | `/orders/{id}/tracking` | 我的物流信息（兼容路径） |
| POST | `/orders/{id}/complete` | 用户将 DELIVERED 订单确认为 COMPLETED |
| GET | `/shipments/{trackingNumber}/tracking` | 按唯一运单号查询轨迹 |

状态流转：`PENDING_PAYMENT → PAID → SHIPPED → DELIVERED → COMPLETED`；取消为 `CANCELLED`，退款为 `REFUNDED`。管理员确认送达后由用户显式完成订单。

## 最小管理端（仅 ADMIN）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/admin/orders?status=&page=1&pageSize=20` | 全部订单分页 |
| GET | `/admin/orders/{id}` | 订单详情 |
| POST | `/admin/orders/{id}/ship` | 仅 PAID；`{"carrier":"SF","trackingNumber":"SF1234567890"}`；运单号全局唯一 |
| POST | `/admin/orders/{id}/deliver` | 仅 SHIPPED；更新订单与物流为 DELIVERED；重复调用幂等 |
| POST | `/admin/shipments/{shipmentId}/deliver` | 按物流记录 ID 确认送达（附件指定路径） |
| GET | `/admin/orders/{id}/tracking` | 管理端物流查询 |

## 并发与一致性约定

- 创建、取消、退款、支付、发货、送达均运行在数据库事务中。
- SKU 使用行锁并通过 `stock >= quantity` 条件更新防止超卖。
- 订单价格永远按数据库 SKU 重算，不信任客户端金额。
- `(user_id, sku_id)`、`(user_id, coupon_id)`、支付订单、物流订单及 tracking number 均有唯一约束。
- 用户订单、购物车、优惠券、物流查询始终附带当前 `user_id`；管理员路径由 Spring Security 的 `ROLE_ADMIN` 保护。

健康检查：`GET /api/v1/health`；Actuator：`GET /actuator/health`；OpenAPI：`/v3/api-docs`；Swagger UI：`/swagger-ui.html`。
