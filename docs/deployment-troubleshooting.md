# 部署指南与故障排查记录

本文记录 `mini-ecommerce` 从本地 Docker Compose 到线上环境的完整部署过程，以及部署期间遇到的问题、原因、排查方法和解决方案。

> 文档中的密码、Token 和连接串均使用占位符表示。不要把真实密钥提交到 GitHub。

## 1. 部署架构

```text
浏览器
  │
  ├── 前端：Vercel（React + Vite）
  │       https://mini-ecommerce-full.vercel.app
  │
  └── 后端：Render（Spring Boot Docker Web Service）
          https://mini-ecommerce-full-sk0g.onrender.com
             ├── MySQL：Aiven
             └── Redis：Upstash
```

线上部署与本地部署的区别：

- 本地使用 `docker-compose.yml`，一次启动前端、后端、MySQL 和 Redis 四个容器。
- Render 的 Docker Web Service 只构建并运行一个 Dockerfile，不会自动执行仓库根目录的 Docker Compose。
- 因此线上 MySQL 和 Redis 必须使用独立的托管服务，本项目分别选择 Aiven 和 Upstash。

## 2. 本地 Docker 部署

### 2.1 环境要求

- Docker Desktop
- Docker Compose v2
- Git

### 2.2 启动项目

在仓库根目录运行：

```bash
docker compose up --build -d
```

查看容器状态：

```bash
docker compose ps
```

查看后端日志：

```bash
docker compose logs -f backend
```

访问地址：

| 服务 | 地址 |
| --- | --- |
| 商城前端 | `http://localhost:3000` |
| 后端 API | `http://localhost:8080/api/v1` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| 健康检查 | `http://localhost:8080/actuator/health` |

### 2.3 重新初始化数据库

数据库初始化脚本只会在 MySQL 数据卷首次创建时执行。如果修改了 SQL 或需要恢复种子数据，需要删除旧数据卷后重新启动：

```bash
docker compose down -v
docker compose up --build -d
```

注意：`down -v` 会删除本地数据库数据，只适用于开发环境。

## 3. 推送代码到 GitHub

远程仓库：

```text
https://github.com/raissazhang0108-droid/mini-ecommerce-full.git
```

首次关联远程仓库：

```bash
git remote add origin https://github.com/raissazhang0108-droid/mini-ecommerce-full.git
git remote -v
```

提交并推送：

```bash
git add <需要提交的文件>
git commit -m "更新说明"
git push origin HEAD:main
```

不要使用 `git add .` 无差别提交，以免把密码、构建产物或临时文件提交到仓库。

## 4. Aiven MySQL 部署

### 4.1 创建数据库

在 Aiven 创建 MySQL 服务后，记录以下信息：

- Host
- Port
- Database
- Username
- Password
- CA/SSL 要求

本项目使用的数据库名为 `defaultdb`。真实密码不能写进代码或本文档。

### 4.2 导入 SQL

项目初始化脚本位于：

```text
database/001_phase_zero.sql
database/002_phase_one_to_eight.sql
```

使用 Aiven 提供的连接参数依次导入：

```bash
mysql \
  --host=<AIVEN_HOST> \
  --port=<AIVEN_PORT> \
  --user=avnadmin \
  --password \
  --ssl-mode=REQUIRED \
  defaultdb < database/001_phase_zero.sql

mysql \
  --host=<AIVEN_HOST> \
  --port=<AIVEN_PORT> \
  --user=avnadmin \
  --password \
  --ssl-mode=REQUIRED \
  defaultdb < database/002_phase_one_to_eight.sql
```

导入后验证：

```sql
SHOW TABLES;
SELECT COUNT(*) FROM products;
SELECT * FROM schema_version ORDER BY version;
```

预期结果：

- 共 13 张业务表
- `products` 中有 6 条种子商品
- `schema_version` 包含初始化版本记录

### 4.3 Render 数据库环境变量

在 Render 服务的 **Environment** 页面配置：

```text
DB_URL=jdbc:mysql://<AIVEN_HOST>:<AIVEN_PORT>/defaultdb?sslMode=REQUIRED&useUnicode=true&characterEncoding=utf8&serverTimezone=UTC
DB_USERNAME=avnadmin
DB_PASSWORD=<AIVEN_PASSWORD>
```

保存后重新部署后端。

## 5. Upstash Redis 部署

创建 Redis 数据库后，应使用 Upstash 的 **TCP 连接信息**，而不是 REST URL 或 REST Token。

连接地址通常类似：

```text
rediss://default:<UPSTASH_PASSWORD>@<UPSTASH_HOST>:6379
```

其中 `rediss://` 表示启用 TLS。

推荐在 Render 配置：

```text
SPRING_DATA_REDIS_URL=rediss://default:<UPSTASH_PASSWORD>@<UPSTASH_HOST>:6379
```

当前代码的本地默认配置仍支持：

```text
REDIS_HOST=redis
REDIS_PORT=6379
```

配置完成后检查：

```bash
curl https://mini-ecommerce-full-sk0g.onrender.com/actuator/health
```

Redis 正常时应看到：

```json
{
  "redis": {
    "status": "UP"
  }
}
```

如果仍然是 `DOWN`，重点检查：

1. 是否误用了 Upstash REST URL；
2. 是否使用 `rediss://`；
3. 密码中是否存在需要 URL 编码的特殊字符；
4. Render 保存环境变量后是否重新部署；
5. Render 日志中是否出现 `RedisConnectionFailureException`、TLS 或认证错误。

## 6. Render 后端部署

### 6.1 创建服务

在 Render 创建 Web Service 并连接 GitHub 仓库：

```text
https://github.com/raissazhang0108-droid/mini-ecommerce-full.git
```

部署方式选择 Docker，Dockerfile 路径指向：

```text
backend/Dockerfile
```

Render 只启动后端容器，不会启动 `docker-compose.yml` 中的 MySQL、Redis 和前端。

### 6.2 环境变量

至少需要配置：

```text
DB_URL=<Aiven JDBC URL>
DB_USERNAME=<Aiven 用户名>
DB_PASSWORD=<Aiven 密码>
SPRING_DATA_REDIS_URL=<Upstash rediss:// TCP URL>
JWT_SECRET=<至少 32 字节的随机字符串>
CORS_ALLOWED_ORIGINS=https://mini-ecommerce-full.vercel.app,http://localhost:3000,http://localhost:5173
```

注意：

- 不要给环境变量值额外添加引号；
- CORS 域名末尾不要添加 `/`；
- 多个 Origin 使用英文逗号分隔，逗号两侧不要添加空格；
- 密码和 Token 只保存在托管平台环境变量中。

### 6.3 验证后端

```bash
curl https://mini-ecommerce-full-sk0g.onrender.com/api/v1/categories
curl https://mini-ecommerce-full-sk0g.onrender.com/api/v1/products
curl https://mini-ecommerce-full-sk0g.onrender.com/actuator/health
```

Swagger：

```text
https://mini-ecommerce-full-sk0g.onrender.com/swagger-ui.html
```

## 7. Vercel 前端部署

### 7.1 创建项目

在 Vercel 导入 GitHub 仓库，并将 Root Directory 设置为：

```text
frontend
```

Vite 项目常用设置：

```text
Framework Preset: Vite
Build Command: pnpm build
Output Directory: dist
```

### 7.2 前端环境变量

在 Vercel 的 Environment Variables 中添加：

```text
VITE_API_BASE_URL=https://mini-ecommerce-full-sk0g.onrender.com
```

`VITE_` 环境变量会在构建阶段写入前端包。修改后必须重新部署 Vercel，单纯刷新页面不会生效。

### 7.3 SPA 路由配置

`frontend/vercel.json`：

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

该配置用于避免直接访问或刷新 `/products`、`/orders` 等 React Router 页面时出现 404。

## 8. 部署期间遇到的问题

### 8.1 最初页面只有健康检查，没有商城功能

**现象**：前端只显示服务健康状态，没有注册、登录、商品、购物车和订单页面。

**原因**：初始版本只实现了 Phase 0 基础设施验证。

**处理**：补充完整购物闭环，包括注册/登录、商品列表、详情、SKU、购物车、优惠券、下单、模拟支付、发货和物流。

### 8.2 Docker Credential Desktop 找不到

**错误**：

```text
docker-credential-desktop not found
```

**原因**：Docker CLI 配置引用了不存在或不可用的凭证助手。

**处理**：修复 Docker Desktop/CLI 凭证配置，或使用不包含错误 `credsStore` 配置的临时 `DOCKER_CONFIG` 后重新构建。

### 8.3 前端容器健康检查失败

**现象**：页面可以构建，但 Compose 判断前端容器不健康。

**原因**：容器内健康检查目标地址不正确。

**处理**：将健康检查目标改为容器内部可访问的：

```text
http://127.0.0.1/
```

### 8.4 中文显示为乱码或问号

**现象**：数据库客户端或页面显示 `????`。

**处理**：

- SQL 初始化脚本加入：

  ```sql
  SET NAMES utf8mb4;
  SET CHARACTER SET utf8mb4;
  ```

- MySQL 容器使用：

  ```text
  --character-set-server=utf8mb4
  --collation-server=utf8mb4_unicode_ci
  ```

- JDBC URL 包含：

  ```text
  useUnicode=true&characterEncoding=utf8
  ```

如果客户端仍显示问号，可以通过 `HEX(name)` 检查实际存储内容。此前验证表明数据库中的中文数据编码正确，问题来自客户端显示环境。

### 8.5 商品详情页不能下单

**现象**：打开商品详情后没有默认 SKU，导致加入购物车或下单按钮不可用。

**原因**：页面初始化时没有选择可售 SKU。

**处理**：优先使用当前选择的 SKU；如果没有，则自动选择第一个库存大于 0 的 SKU。

### 8.6 商品图片不显示或内容单一

**原因**：数据库中的示例图片 URL 不可用或只是占位地址。

**处理**：生成并加入 6 张本地商品图，存放于：

```text
frontend/public/product-images/
```

前端根据商品 ID 映射静态图片，避免依赖外部图片服务。

### 8.7 Render 没有自动启动 MySQL 和 Redis

**原因**：Render Web Service 只运行指定 Dockerfile，不支持像本地一样直接启动整个 Docker Compose 应用栈。

**处理**：

- 后端部署到 Render；
- MySQL 迁移到 Aiven；
- Redis 迁移到 Upstash；
- 前端部署到 Vercel。

### 8.8 Aiven 导入 SQL 后中文看起来不正确

**排查**：执行 `HEX(name)` 检查字段的 UTF-8 字节。

**结论**：实际存储正确，乱码来自终端或客户端字符集，不需要重新导入数据。

### 8.9 不确定 Upstash 应使用哪组连接信息

**错误做法**：把 REST URL 或 REST Token 配置成 Spring Redis 连接。

**正确做法**：使用 Upstash 控制台提供的 TCP 地址，格式为 `rediss://...:6379`。

### 8.10 Vercel 构建出现大 Chunk 警告

**警告**：

```text
Some chunks are larger than 500 kB
```

**结论**：这是前端性能提示，不是部署失败。只要日志包含 `Build Completed` 和 `Deployment completed`，部署就是成功的。

后续可以使用路由懒加载和动态 `import()` 继续减小首屏包体积。

### 8.11 Vercel 页面刷新后 404

**原因**：Vercel 默认按真实静态文件路径查找资源，不知道 React Router 应交给 `index.html` 处理。

**处理**：新增 `frontend/vercel.json`，将所有页面路由重写到 `/index.html`。

### 8.12 前端请求后端被 CORS 拦截

**错误**：

```text
No 'Access-Control-Allow-Origin' header is present on the requested resource
```

**原因**：Render 后端的 CORS 白名单没有包含 Vercel 正式域名。

**处理**：在 Render 添加：

```text
CORS_ALLOWED_ORIGINS=https://mini-ecommerce-full.vercel.app,http://localhost:3000,http://localhost:5173
```

保存并重新部署后端。验证命令：

```bash
curl -i \
  -H 'Origin: https://mini-ecommerce-full.vercel.app' \
  https://mini-ecommerce-full-sk0g.onrender.com/api/v1/products
```

响应应包含：

```text
Access-Control-Allow-Origin: https://mini-ecommerce-full.vercel.app
```

### 8.13 分类接口偶发 500

**错误**：

```text
GET /api/v1/categories 500 (Internal Server Error)
```

**当前状态**：接口已恢复，连续请求返回 200，但并发测试发现明显的后端延迟。

测试结果：

- 5 个并发分类请求约耗时 5～11 秒；
- 5 个并发商品请求中，最慢成功请求约 19.6 秒；
- 另有请求在 30 秒后超时；
- 压力持续后，分类和商品接口均曾出现 45 秒无响应。

**高概率原因**：商品列表 SQL 长时间占用数据库连接，而 HikariCP 的 `connection-timeout` 只有 3 秒。连接池繁忙时，简单的分类查询也可能无法及时获取连接并返回 500。

Render 日志中应搜索：

```text
HikariPool
Connection is not available
SQLTransientConnectionException
CannotGetJdbcConnectionException
Communications link failure
```

建议处理顺序：

1. 优化商品列表聚合 SQL，避免对 `description` 等大字段执行 `GROUP BY`；
2. 将连接等待时间从 3 秒提高到 10 秒；
3. 根据 Render 和 Aiven 套餐限制设置合理的连接池大小；
4. 为分类查询增加联合索引：

   ```sql
   CREATE INDEX idx_categories_status_sort
   ON categories(status, sort_order);
   ```

5. 在 Aiven 执行 `EXPLAIN`，检查商品查询是否出现 `Using temporary` 或 `Using filesort`。

连接池参考配置：

```yaml
spring:
  datasource:
    hikari:
      connection-timeout: 10000
      maximum-pool-size: 10
```

连接池变大只能缓解排队，SQL 优化才是根本解决方案。

### 8.14 浏览器出现 `startTime` JavaScript 错误

**错误**：

```text
VM225:2 Uncaught TypeError:
Cannot read properties of undefined (reading 'startTime')
at et.reportAllChanges
```

**结论**：`VM225` 表示浏览器运行时动态注入的脚本，通常来自浏览器扩展、性能采集脚本或开发者工具，不是商城 React 源码，也不是分类接口 500 的原因。

可以使用无痕窗口或临时关闭浏览器扩展进行验证。

### 8.15 Redis 健康检查仍为 DOWN

健康检查曾显示：

```text
db: UP
redis: DOWN
overall: DOWN
```

这表示：

- Aiven MySQL 已连接成功；
- 商品和分类读取可以正常工作；
- Upstash Redis 连接仍需继续确认；
- 依赖 Redis 的退出登录黑名单等功能可能受影响。

优先检查 Upstash TCP URL、TLS、密码和 Render 环境变量是否正确生效。

## 9. 上线验收清单

### 后端

- [ ] `/api/v1/categories` 返回 200 和 3 个分类
- [ ] `/api/v1/products` 返回 200 和 6 件商品
- [ ] Swagger 可以访问
- [ ] Actuator 中 `db.status` 为 `UP`
- [ ] Actuator 中 `redis.status` 为 `UP`
- [ ] 带 Vercel Origin 的请求返回正确 CORS 响应头
- [ ] Render 日志没有数据库连接池超时

### 前端

- [ ] 首页和商品列表正常显示图片
- [ ] 刷新 `/products` 等路由不会返回 404
- [ ] 注册和登录成功
- [ ] 商品详情自动选择可售 SKU
- [ ] 可以加入购物车并修改数量
- [ ] 可以创建订单并模拟支付
- [ ] 管理员可以发货
- [ ] 用户可以查看物流并确认收货

### 安全

- [ ] GitHub 中没有真实数据库密码
- [ ] GitHub 中没有 Upstash Token 或连接密码
- [ ] `JWT_SECRET` 使用独立随机值
- [ ] 生产环境只放行实际使用的 CORS 域名
- [ ] 如果密钥曾出现在终端截图、聊天记录或提交历史中，立即轮换

## 10. 常用诊断命令

```bash
# 后端健康状态
curl -i https://mini-ecommerce-full-sk0g.onrender.com/actuator/health

# 分类接口
curl -i https://mini-ecommerce-full-sk0g.onrender.com/api/v1/categories

# 商品接口
curl -i https://mini-ecommerce-full-sk0g.onrender.com/api/v1/products

# CORS 验证
curl -i \
  -H 'Origin: https://mini-ecommerce-full.vercel.app' \
  https://mini-ecommerce-full-sk0g.onrender.com/api/v1/categories

# 本地 Docker 状态
docker compose ps

# 本地后端日志
docker compose logs -f backend
```

## 11. 当前线上状态

截至 2026-09-23：

| 项目 | 状态 |
| --- | --- |
| Vercel 前端构建 | 已成功 |
| Render 后端部署 | 已成功 |
| Aiven MySQL | 已连接，数据正常 |
| 商品接口 | 可返回 6 件商品，但存在高延迟风险 |
| 分类接口 | 当前返回正常，曾偶发 500 |
| CORS | 已验证正常 |
| Upstash Redis | 健康检查仍为 `DOWN`，待继续修复 |
| 整体 Actuator | 因 Redis 异常显示 `DOWN` |

后续优先级：先修复 Redis TLS/认证连接，再优化商品查询 SQL 与数据库连接池配置，最后完成完整购物流程的线上验收。
