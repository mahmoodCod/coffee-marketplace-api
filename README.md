# Coffee Marketplace API

A modular NestJS backend for an online coffee marketplace.  
Customers browse and buy coffee products, sellers manage catalog and inventory, and administrators oversee the platform.

Built as a **modular monolith** with clear domain boundaries, TypeORM + PostgreSQL, JWT/OTP authentication, and OpenAPI documentation.

---

## Live Local Endpoints

| Resource | URL |
|----------|-----|
| **API Server** | [http://localhost:3000](http://localhost:3000) |
| **Swagger UI** | [http://localhost:3000/api/docs](http://localhost:3000/api/docs) |

> Start the app with `npm run start:dev` inside `coffee-marketplace-api/`, then open Swagger to explore and try endpoints interactively.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js, TypeScript |
| Framework | NestJS |
| Database | PostgreSQL, TypeORM |
| Auth | OTP login/register, JWT access & refresh tokens, Passport |
| Validation | `class-validator`, `class-transformer`, Joi config schema |
| Docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| Infrastructure | Mock payment gateway, SMS / mail / storage adapters |
| Testing | Jest |

---

## Features (Implemented)

### Identity & Access
- **Roles** — system role CRUD (`admin`, `seller`, `customer`)
- **Auth** — OTP registration/login, OTP verify, JWT access + refresh, logout/revocation
- **Users** — profile get/update, address CRUD under the current user
- **Sellers** — authenticated seller profile get/update

### Catalog
- **Categories** — hierarchical categories, public list/detail, admin create/update/delete
- **Products** — public catalog, seller product CRUD, admin moderation (list/update/delete)
- **Inventory** — public stock view, seller stock updates, admin stock overrides

### Shopping & Checkout
- **Cart** — get cart, add/update/remove items, clear cart
- **Orders** — create from cart, list/detail, cancel; seller order views + received; admin status/ship/deliver
- **Payments** — create payment, verify, gateway callback; marks orders paid on success
- **Coupons** — admin coupon CRUD; apply/remove coupon on unpaid orders

### Engagement & Marketing
- **Reviews** — customer create/edit/delete; public product reviews; admin approve/reject
- **Notifications** — list notifications, mark as read
- **Discounts** — seller discount CRUD + attach to products; admin discount listing
- **Articles** — public published articles; admin full CMS (CRUD, publish/unpublish, link products)

### Analytics
- **Dashboards** — admin statistics & sales aggregates; seller dashboard overview
- **Reports** — admin order/product/user operational reports; seller order & product sales reports

---

## Project Structure

```text
coffee-marketplace-api/
├── docs/                              # Business, domain, database, architecture docs
└── coffee-marketplace-api/            # NestJS application
    ├── src/
    │   ├── common/                    # Guards, decorators, filters, interceptors, pipes
    │   ├── config/                    # Configuration + Joi validation
    │   ├── database/                  # TypeORM config, migrations, seeds
    │   ├── infrastructure/            # Payment, SMS, mail, storage adapters
    │   └── modules/
    │       ├── auth/
    │       ├── roles/
    │       ├── users/                 # Profile + addresses
    │       ├── sellers/
    │       ├── categories/
    │       ├── products/
    │       ├── inventoryes/
    │       ├── cart/
    │       ├── orders/
    │       ├── payments/
    │       ├── reviews/
    │       ├── notifications/
    │       ├── discounts/
    │       ├── coupons/
    │       ├── articles/
    │       ├── dashboards/
    │       └── reports/
    ├── example.env
    ├── docker-compose.yml
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+ (recommended)
- PostgreSQL 14+
- npm
- Redis (optional for local cache-related config; see `.env`)

### 1. Install dependencies

```bash
cd coffee-marketplace-api
npm install
```

### 2. Configure environment

```bash
cp example.env .env
```

Update database credentials and JWT secrets in `.env` as needed:

```env
NODE_ENV=development
PORT=3000

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=coffee_marketplace
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
```

### 3. Run migrations

```bash
npm run migration:run
```

### 4. Seed base data (roles, etc.)

```bash
npm run seed
```

### 5. Start the server

```bash
# development (watch mode)
npm run start:dev

# production build
npm run build
npm run start:prod
```

After startup you should see:

- Server: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`

---

## API Overview

Full request/response contracts live in Swagger. Below is a concise map of the main routes.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Request registration OTP |
| `POST` | `/auth/login` | Request login OTP |
| `POST` | `/auth/verify-otp` | Verify OTP and issue tokens |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Revoke refresh token |

### Roles
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/roles` | List roles |
| `GET` | `/roles/:id` | Get role by id |
| `POST` | `/roles` | Create role |
| `PATCH` | `/roles/:id` | Update role |
| `DELETE` | `/roles/:id` | Delete role |

### Users (JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users/profile` | Current user profile |
| `PATCH` | `/users/profile` | Update profile |
| `GET` | `/users/addresses` | List addresses |
| `POST` | `/users/addresses` | Create address |
| `PATCH` | `/users/addresses/:id` | Update address |
| `DELETE` | `/users/addresses/:id` | Delete address |

### Sellers (JWT + seller role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/seller/profile` | Seller profile |
| `PATCH` | `/seller/profile` | Update seller profile |
| `GET` | `/seller/products` | List own products |
| `POST` | `/seller/products` | Create product |
| `PATCH` | `/seller/products/:id` | Update product |
| `DELETE` | `/seller/products/:id` | Delete product |
| `PATCH` | `/seller/inventory/:productId` | Update stock |
| `GET` | `/seller/orders` | Orders containing seller items |
| `GET` | `/seller/orders/:id` | Seller order detail |
| `PATCH` | `/seller/orders/:id/received` | Confirm order received |
| `GET` | `/seller/discounts` | List own discounts |
| `POST` | `/seller/discounts` | Create discount |
| `POST` | `/seller/discounts/:discountId/products/:productId` | Attach discount to product |
| `PATCH` | `/seller/discounts/:id` | Update discount |
| `DELETE` | `/seller/discounts/:id` | Delete discount |
| `GET` | `/seller/dashboard` | Seller dashboard KPIs |
| `GET` | `/seller/reports/orders` | Seller order report |
| `GET` | `/seller/reports/products` | Seller product sales report |

### Catalog (public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/categories` | List categories |
| `GET` | `/categories/:id` | Category details |
| `GET` | `/products` | List products |
| `GET` | `/products/:id` | Product details |
| `GET` | `/products/:productId/inventory` | Product stock |
| `GET` | `/products/:productId/reviews` | Product reviews |
| `GET` | `/articles` | Published articles |
| `GET` | `/articles/:slug` | Article by slug |

### Cart (JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/cart` | Get active cart |
| `POST` | `/cart/items` | Add item |
| `PATCH` | `/cart/items/:id` | Update quantity |
| `DELETE` | `/cart/items/:id` | Remove item |
| `DELETE` | `/cart/clear` | Clear cart |

### Orders & Payments (JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/orders` | Create order from cart |
| `GET` | `/orders` | List my orders |
| `GET` | `/orders/:id` | Order detail |
| `PATCH` | `/orders/:id/cancel` | Cancel order |
| `POST` | `/orders/:id/coupon` | Apply coupon |
| `DELETE` | `/orders/:id/coupon` | Remove coupon |
| `POST` | `/payments` | Create / initiate payment |
| `POST` | `/payments/verify` | Verify payment |
| `GET` | `/payments/callback` | Payment gateway callback |

### Reviews & Notifications (JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/reviews` | Create review |
| `PATCH` | `/reviews/:id` | Update review |
| `DELETE` | `/reviews/:id` | Delete review |
| `GET` | `/notifications` | List notifications |
| `PATCH` | `/notifications/:id/read` | Mark as read |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/categories` | Create category |
| `PATCH` | `/categories/:id` | Update category |
| `DELETE` | `/categories/:id` | Soft-delete category |
| `GET` | `/admin/products` | List products |
| `PATCH` | `/admin/products/:id` | Update product |
| `DELETE` | `/admin/products/:id` | Delete product |
| `PATCH` | `/admin/inventory/:productId` | Override stock |
| `GET` | `/admin/orders` | List orders |
| `PATCH` | `/admin/orders/:id/status` | Update status |
| `PATCH` | `/admin/orders/:id/ship` | Mark shipped |
| `PATCH` | `/admin/orders/:id/deliver` | Mark delivered |
| `GET` | `/admin/reviews` | List reviews |
| `PATCH` | `/admin/reviews/:id/approve` | Approve review |
| `PATCH` | `/admin/reviews/:id/reject` | Reject review |
| `GET` | `/admin/discounts` | List discounts |
| `GET` | `/admin/coupons` | List coupons |
| `GET` | `/admin/coupons/:id` | Coupon detail |
| `POST` | `/admin/coupons` | Create coupon |
| `PATCH` | `/admin/coupons/:id` | Update coupon |
| `DELETE` | `/admin/coupons/:id` | Delete coupon |
| `GET` | `/admin/articles` | List articles |
| `GET` | `/admin/articles/:id` | Article detail |
| `POST` | `/admin/articles` | Create article |
| `PATCH` | `/admin/articles/:id` | Update article |
| `POST` | `/admin/articles/:id/publish` | Publish |
| `POST` | `/admin/articles/:id/unpublish` | Unpublish |
| `DELETE` | `/admin/articles/:id` | Delete article |
| `POST` | `/admin/articles/:id/products/:productId` | Link product |
| `DELETE` | `/admin/articles/:id/products/:productId` | Unlink product |
| `GET` | `/admin/dashboard/statistics` | Platform KPIs |
| `GET` | `/admin/dashboard/sales` | Sales aggregates |
| `GET` | `/admin/reports/orders` | Order report |
| `GET` | `/admin/reports/products` | Product report |
| `GET` | `/admin/reports/users` | User report |

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run start:dev` | Start API in watch mode |
| `npm run build` | Compile TypeScript |
| `npm run start:prod` | Run compiled app |
| `npm run test` | Run unit tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run lint` | Lint source files |
| `npm run migration:generate` | Generate migration from entities |
| `npm run migration:run` | Apply pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run seed` | Seed database |

---

## Documentation

Design and domain documentation lives under `/docs`:

- `docs/business/` — goals, actors, business rules, use cases
- `docs/domain/` — entities and relationships
- `docs/database/` — tables, indexes, migrations notes
- `docs/architecture/` — system overview, modules, API design, auth flow, deployment

---

## Architecture Notes

- **Modular monolith**: each capability is an independent Nest module (controller → service → repository → entity).
- **Config-first**: environment validated with Joi at bootstrap.
- **Migrations-first schema**: database changes ship via TypeORM migrations.
- **Auth model**: phone OTP for register/login; short-lived access JWT + refresh token rotation/revocation.
- **RBAC**: `JwtAuthGuard` + `RolesGuard` with `SYSTEM_ROLES` (`admin` / `seller` / `customer`).
- **Addresses**: managed inside the Users module (no separate Address Nest module).
- **Analytics split**: Dashboards = aggregates/KPIs; Reports = filtered operational listings.
- **API contracts**: Swagger is the source of interactive API documentation.

---

## Roadmap (Optional / Future)

1. **Avatar upload** — user profile image (marked as future in architecture docs)
2. **Real payment gateway** — replace mock payment adapter for production
3. **Real SMS / email providers** — wire infrastructure adapters to production services
4. **Admin user management API** — suspend/activate users (documented; not yet implemented as dedicated admin-users routes)

---

## License

Private / UNLICENSED — not published as an open-source package.
