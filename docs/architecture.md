# mini-ecommerce 架构

```text
Browser
  │
  ▼
React + TypeScript + Ant Design (5173 / Docker 3000)
  │  REST /api/v1 + Bearer JWT
  ▼
Spring Boot 3 / Java 21 (8080)
  ├── auth/security     注册、登录、JWT、权限
  ├── catalog           分类、商品、SKU、库存
  ├── commerce          购物车、优惠券、订单、支付、物流
  ├── admin             最小订单履约管理
  ├── MySQL 8           交易事实与状态
  └── Redis 7           登出令牌黑名单
```

## 设计原则

- 后端是独立实现，不引用 CRMEB 源码或依赖。
- 模块化单体保持部署简单，并通过包边界隔离业务。
- 所有私有资源都由 JWT 用户身份约束；管理 API 要求 `ADMIN`。
- 金额使用 `DECIMAL` / `BigDecimal`，服务端在预览和下单时重新计算。
- SKU 库存使用事务、行锁和条件更新防止超卖与负库存。
- 订单项保存商品、SKU、编码和成交价快照。
- 支付使用本地模拟通道，但保留支付记录和幂等约束。
- 物流是订单的一对一履约记录，并包含有序轨迹事件。
- Docker 场景由 Nginx 将 `/api/` 反向代理到后端；开发环境由 Vite 代理。

## 数据初始化

- `001_phase_zero.sql`：数据库版本基线。
- `002_phase_one_to_eight.sql`：业务表、约束、商品、优惠券和演示账号。

MySQL 官方镜像仅在数据卷首次创建时执行初始化脚本。升级模型时请执行 `docker compose down -v` 后重建。
