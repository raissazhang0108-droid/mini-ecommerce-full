# mini-ecommerce

[简体中文](README.md) | [English](README_EN.md)

一个独立、精简但具备真实购物闭环的全栈电商项目。CRMEB Java 仅作为业务概念参考，项目不依赖也未复制 CRMEB 源码。

## 已实现的购物流程

```text
注册 / 登录 → 浏览商品 → 选择 SKU → 加入购物车 → 领取优惠券
→ 结算下单 → 模拟支付 → 管理员发货 → 查看物流 → 确认收货
```

### 用户端

- 邮箱或中国大陆手机号注册、登录、退出；
- 商品分类、搜索、列表、详情和 SKU 库存；
- 购物车添加、合并、改数量、删除和清空；
- 优惠券领取、有效期和最低消费校验；
- 订单预览、创建、列表、详情、取消、退款和模拟支付；
- 物流轨迹查询与确认收货。

### 最小管理端

- 管理员订单列表和状态筛选；
- 已支付订单发货；
- 运输中订单标记送达。

## 技术栈

- 后端：Java 21、Spring Boot 3、Spring Security、MyBatis-Plus、MySQL 8、Redis、JWT、OpenAPI
- 前端：React 19、TypeScript、Vite、Ant Design、React Router、Axios、TanStack Query
- 运行：Docker Compose

## 一键启动

```bash
docker compose up --build -d
```

首次启动会下载镜像并初始化数据库，等待所有服务变为 `healthy`：

```bash
docker compose ps
```

访问入口：

- 商城前端：`http://localhost:3000`
- 后端 API：`http://localhost:8080/api/v1`
- Swagger UI：`http://localhost:8080/swagger-ui.html`
- Actuator：`http://localhost:8080/actuator/health`

## 演示账号

| 角色 | 账号 | 密码 |
| --- | --- | --- |
| 普通用户 | `demo@example.com` | `Demo123!` |
| 管理员 | `admin@example.com` | `Admin123!` |

也可以在注册页使用自己的邮箱或手机号创建普通用户。

## 验收建议

1. 使用普通账号登录；
2. 打开商品详情并选择 SKU；
3. 加入购物车，在结算页领取并选择优惠券；
4. 提交订单并点击“模拟支付”；
5. 退出后使用管理员账号进入“订单管理”，填写承运商和运单号发货；
6. 切回普通账号查看物流；
7. 管理员标记送达，普通用户确认收货。

## 重新初始化数据库

数据库脚本只会在 MySQL 数据卷首次创建时执行。升级代码或需要恢复种子数据时：

```bash
docker compose down -v
docker compose up --build -d
```

## 测试

```bash
cd backend
mvn test

cd ../frontend
pnpm install
pnpm test
pnpm build
```

## 目录

```text
mini-ecommerce/
├── backend/          Spring Boot API 与测试
├── frontend/         React 商城与管理页面
├── database/         MySQL 表结构与种子数据
├── docs/             API、架构与 CRMEB 概念参考
├── docker-compose.yml
└── README.md
```

## 文档

- [API 文档](docs/api.md)
- [架构说明](docs/architecture.md)
- [CRMEB Java 概念参考](docs/crmeb-reference.md)
