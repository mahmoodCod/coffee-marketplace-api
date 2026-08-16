# Coffee Marketplace API

A modular NestJS backend for an online coffee marketplace.  
Customers browse and buy coffee products, sellers manage catalog and inventory, and administrators oversee the platform.

Built as a **modular monolith** with clear domain boundaries, TypeORM + PostgreSQL, JWT/OTP authentication, role-based authorization, and OpenAPI documentation.

---

## Live Local Endpoints

| Resource | URL |
|----------|-----|
| **API Server** | [http://localhost:3000](http://localhost:3000) |
| **Swagger UI** | [http://localhost:3000/api/docs](http://localhost:3000/api/docs) |

> Start the app with `npm run start:dev` inside `coffee-marketplace-api/`, then open Swagger to explore and try endpoints interactively.  
> Use **Authorize** in Swagger with a Bearer access token for protected routes.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js, TypeScript |
| Framework | NestJS |
| Database | PostgreSQL, TypeORM |
| Auth | OTP login/register, JWT access & refresh tokens, Passport |
| Authorization | `@Roles()`, `RolesGuard`, `@Public()`, `SYSTEM_ROLES` |
| Validation | `class-validator`, `class-transformer`, Joi config schema |
| Docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| Testing | Jest |

---

## Features (Implemented)

### Roles
- CRUD for system roles (`admin`, `seller`, `customer`)
- UUID path validation
- Unit tests for service and controller

### Auth
- OTP-based registration and login
- OTP verification with token issuance
- JWT access + refresh token lifecycle
- Logout / refresh token revocation
- Passport JWT strategy for protected routes

### Authorization
- Centralized `SYSTEM_ROLES` constants
- `@Roles()` decorator + `RolesGuard`
- `@Public()` support inside `JwtAuthGuard`
- Unit tests for guards and decorator metadata

### Users
- Authenticated profile get / update
- Address CRUD under the current user
- Ownership checks (`NotFound` / `Forbidden`)
- Soft delete where applicable
- Unit tests for service and controller

### Categories
- Unique `name` / `slug`, hierarchy (`parentId`), sort order, active flag, soft delete
- Public list / detail
- Admin-only create / update / delete (`JwtAuthGuard` + `RolesGuard`)
- Unit tests for service and controller

### Sellers
- JWT + seller-role protected profile endpoints
- Get / update seller profile
- Unit tests for service and controller

### Products
- Public product catalog (`GET /products`, `GET /products/:id`)
- Seller product CRUD under `/seller/products`
- Admin product management under `/admin/products`
- Product lifecycle statuses (`draft`, `active`, `out_of_stock`, `archived`)
- Category linkage and ownership rules
- Unit tests for service and controllers

### Inventory
- Public inventory lookup by product
- Seller inventory updates under `/seller/inventory`
- Admin inventory updates under `/admin/inventory`
- Unit tests for controllers

### Cart
- Authenticated shopping cart under `/cart`
- Get-or-create single **ACTIVE** cart per user
- Add / update / remove items with inventory and product-status checks
- Clear cart
- Partial unique DB index enforcing one active cart per user
- Response DTOs + Swagger request examples
- Unit tests for service and controller

---

## Project Structure

```text
coffee-marketplace-api/
├── docs/                              # Business, domain, database, architecture docs
└── coffee-marketplace-api/            # NestJS application
    ├── src/
    │   ├── common/                    # Guards, decorators, filters, interceptors, constants
    │   ├── config/                    # Configuration + Joi validation
    │   ├── database/                  # TypeORM, migrations, seeds
    │   └── modules/
    │       ├── auth/
    │       ├── roles/
    │       ├── users/
    │       ├── categories/
    │       ├── sellers/
    │       ├── products/
    │       ├── inventoryes/
    │       └── cart/
    ├── example.env
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+ (recommended)
- PostgreSQL 14+
- npm

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

### Users (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users/profile` | Current user profile |
| `PATCH` | `/users/profile` | Update profile |
| `GET` | `/users/addresses` | List addresses |
| `POST` | `/users/addresses` | Create address |
| `PATCH` | `/users/addresses/:id` | Update address |
| `DELETE` | `/users/addresses/:id` | Delete address |

### Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/categories` | Public | List categories |
| `GET` | `/categories/:id` | Public | Category details |
| `POST` | `/categories` | Admin JWT | Create category |
| `PATCH` | `/categories/:id` | Admin JWT | Update category |
| `DELETE` | `/categories/:id` | Admin JWT | Soft-delete category |

### Sellers (Seller JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/seller/profile` | Get seller profile |
| `PATCH` | `/seller/profile` | Update seller profile |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/products` | Public | List products |
| `GET` | `/products/:id` | Public | Product details |
| `POST` | `/seller/products` | Seller JWT | Create product |
| `GET` | `/seller/products` | Seller JWT | List own products |
| `PATCH` | `/seller/products/:id` | Seller JWT | Update own product |
| `DELETE` | `/seller/products/:id` | Seller JWT | Delete own product |
| `GET` | `/admin/products` | Admin JWT | Admin product list |
| `PATCH` | `/admin/products/:id` | Admin JWT | Admin product update |
| `DELETE` | `/admin/products/:id` | Admin JWT | Admin product delete |

### Inventory
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/products/:productId/inventory` | Public | Get product inventory |
| `PATCH` | `/seller/inventory/:productId` | Seller JWT | Update own product stock |
| `PATCH` | `/admin/inventory/:productId` | Admin JWT | Admin inventory update |

### Cart (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/cart` | Get or create active cart |
| `POST` | `/cart/items` | Add product to cart |
| `PATCH` | `/cart/items/:id` | Update cart item quantity |
| `DELETE` | `/cart/items/:id` | Remove cart item |
| `DELETE` | `/cart/clear` | Clear all cart items |

> Full request/response schemas and Try-it-out examples live in Swagger: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

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

- `docs/business/` — goals, actors, business rules
- `docs/domain/` — entities and relationships
- `docs/database/` — tables, indexes, migrations notes, ERDs
- `docs/architecture/` — system overview, modules, API design, auth flow

---

## Architecture Notes

- **Modular monolith**: each capability is an independent Nest module (controller → service → repository → entity).
- **Config-first**: environment validated with Joi at bootstrap.
- **Migrations-first schema**: database changes ship via TypeORM migrations.
- **Auth model**: phone OTP for register/login; short-lived access JWT + refresh token rotation/revocation.
- **Authorization model**: role-based access with `JwtAuthGuard` + `RolesGuard` and shared `SYSTEM_ROLES`.
- **Actor-scoped APIs**: customer / seller / admin routes are separated by path prefix where needed.
- **API contracts**: Swagger is the source of interactive API documentation.

---

## Roadmap (Next)

1. **Order** — create order from active cart, order history, cancel flow  
2. **Payment** — payment records, gateway callback, status updates  
3. **Reviews / Discounts / Coupons** — post-purchase and marketing features  
4. **Seller / Admin dashboards & reports**

---

## License

Private / UNLICENSED — not published as an open-source package.
