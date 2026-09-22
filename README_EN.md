# mini-ecommerce

[简体中文](README.md) | [English](README_EN.md)

An independent and compact full-stack e-commerce project with a realistic end-to-end shopping flow. CRMEB Java is used only as a business concept reference; this project neither depends on nor copies CRMEB source code.

## Implemented Shopping Flow

```text
Register / Sign in → Browse products → Select a SKU → Add to cart → Claim a coupon
→ Checkout → Place an order → Simulate payment → Admin ships → Track shipment → Confirm receipt
```

### Customer Features

- Register and sign in with an email address or a mainland China mobile number;
- Browse categories, search products, view product details, and check SKU inventory;
- Add, merge, update, remove, and clear shopping cart items;
- Claim coupons with validity-period and minimum-spend validation;
- Preview, create, list, view, cancel, refund, and simulate payment for orders;
- Track shipments and confirm receipt.

### Minimal Admin Features

- View and filter orders by status;
- Ship paid orders;
- Mark shipped orders as delivered.

## Technology Stack

- Backend: Java 21, Spring Boot 3, Spring Security, MyBatis-Plus, MySQL 8, Redis, JWT, OpenAPI
- Frontend: React 19, TypeScript, Vite, Ant Design, React Router, Axios, TanStack Query
- Runtime: Docker Compose

## Quick Start

```bash
docker compose up --build -d
```

The first startup downloads the required images and initializes the database. Wait until every service is `healthy`:

```bash
docker compose ps
```

Local endpoints:

- Storefront: `http://localhost:3000`
- Backend API: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Actuator health endpoint: `http://localhost:8080/actuator/health`

## Demo Accounts

| Role | Account | Password |
| --- | --- | --- |
| Customer | `demo@example.com` | `Demo123!` |
| Administrator | `admin@example.com` | `Admin123!` |

You can also create a customer account from the registration page using your own email address or mobile number.

## Suggested Acceptance Flow

1. Sign in with the customer account;
2. Open a product, select a SKU, and add it to the cart;
3. Claim and select a coupon during checkout;
4. Place the order and click **Simulate payment**;
5. Sign out, then sign in with the administrator account and open **Order Management**;
6. Enter a carrier and tracking number to ship the order;
7. Switch back to the customer account and open shipment tracking;
8. Mark the order as delivered as the administrator, then confirm receipt as the customer.

## Reset the Database

Database initialization scripts run only when the MySQL volume is created for the first time. To apply schema changes or restore the seed data:

```bash
docker compose down -v
docker compose up --build -d
```

## Tests

```bash
cd backend
mvn test

cd ../frontend
pnpm install
pnpm test
pnpm build
```

## Project Structure

```text
mini-ecommerce/
├── backend/          Spring Boot API and tests
├── frontend/         React storefront and admin pages
├── database/         MySQL schema and seed data
├── docs/             API, architecture, and CRMEB concept references
├── docker-compose.yml
└── README.md
```

## Documentation

- [API Documentation](docs/api.md)
- [Architecture](docs/architecture.md)
- [CRMEB Java Concept Reference](docs/crmeb-reference.md)
