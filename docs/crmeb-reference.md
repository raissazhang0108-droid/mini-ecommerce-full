# CRMEB Java 参考提炼（Phase 0-8）

本项目将 CRMEB Java 仅作为电商领域和工程分层的概念参考；实现为独立的 Java 21 / Spring Boot 3 模块化单体，没有复制 CRMEB 源码或引入其运行依赖。

## CRMEB 参考位置

| CRMEB 位置 | 参考内容 | 本项目取舍 |
|---|---|---|
| `backend/crmeb-common/pom.xml` | Web、MySQL、Redis 等公共依赖 | 升级到 Spring Boot 3 / Java 21，按单体模块统一依赖 |
| `backend/crmeb-front/` | 用户端 Controller、Service 与接口边界 | 仅保留认证、目录、购物车、券、订单 Golden Path |
| `backend/crmeb-admin/` | 管理端应用及订单操作模式 | 合并到同一进程，以 `/api/v1/admin/**` 和 ADMIN 角色隔离 |
| `backend/sql/Crmeb_v3.1.sql` | 商品/SKU、购物车、订单、支付、物流关系 | 重新设计最小 MySQL 8 schema，不复制表结构或数据 |
| `frontend/admin/`、`frontend/pc/`、`frontend/uni-app/` | 多客户端 API 边界 | 本任务不修改前端，也不引入多端体系 |

## 参考与取舍

| 参考概念 | 本项目实现 | 明确简化 |
|---|---|---|
| 用户端与管理端边界 | `/api/v1/**` 与 `/api/v1/admin/**` 命名空间隔离 | 单应用部署，不拆分 admin/front 进程 |
| 用户与权限 | BCrypt、JWT、Redis logout 黑名单、USER/ADMIN | 不实现复杂 RBAC、社交登录和微信授权 |
| 商品/SPU/SKU | Category、Product、Sku，独立状态、价格和库存 | 不实现规格模板、品牌、评价和搜索引擎 |
| 购物车 | 用户私有、同 SKU 合并、实时库存校验 | 不实现游客购物车和跨端合并 |
| 优惠券 | 领取记录、门槛、有效期、一次领取、核销/释放 | 不实现券包、叠加规则和活动中心 |
| 订单 | 预览、创建、快照、状态机、取消、退款 | 不实现拆单、售后审批和多包裹 |
| 库存一致性 | 事务、SKU 行锁、条件扣减、取消/退款返还 | 不引入 MQ、库存预占过期任务 |
| 支付 | 本地模拟支付、订单唯一支付记录、幂等 | 不接第三方支付 SDK、回调和对账 |
| 物流 | 管理端发货、唯一运单号、送达、用户查询 | 不接物流轨迹供应商 |
| 数据库初始化 | `database/001_phase_zero.sql` + `002_phase_one_to_eight.sql` | MySQL Docker 首次初始化按文件名顺序执行 |

## 模块边界

- `auth`：账号注册登录、当前用户；MyBatis-Plus `BaseMapper` 管理用户持久化。
- `security`：Spring Security 无状态过滤链、JWT 签发校验、Redis 注销。
- `catalog`：公开分类、商品、SKU 展示。
- `commerce`：购物车、优惠券、订单、支付、物流及事务规则。
- `admin`：最小订单管理接口，仅 ADMIN。
- `common.api`：统一 `ApiResponse`、分页响应和异常映射。

复杂写事务使用 Spring `JdbcTemplate` 显式 SQL，以便清晰表达 `SELECT ... FOR UPDATE`、条件扣库存、快照落库及状态条件；认证用户持久化使用 MyBatis-Plus。所有 API 输出均为 record DTO/VO，而非实体。

## Phase 1-8 对应关系

1. 认证：邮箱/手机号唯一账号、BCrypt、JWT、logout、me。
2. 商品：分类、商品、SKU、上下架、价格库存约束和真实感种子数据。
3. 购物车：增改删清、同 SKU 合并、用户隔离、库存校验。
4. 优惠券：列表、领取、我的券、时间和门槛校验、不可复用。
5. 订单：preview/create/list/detail/cancel/refund，服务端重算和购买快照。
6. 支付：模拟幂等支付，状态更新为 PAID。
7. 物流：PAID 发货、唯一运单号、查询、送达。
8. 管理端：订单列表、详情、发货、送达，仅 ADMIN。

## 保留范围外能力

微信生态、真实支付、MQ 最终一致性、定时关单、复杂营销、门店、多仓、多商户、发票、评价、推荐、统计报表、云存储和完整运营后台不在本次最小闭环内。
