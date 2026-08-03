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
| Testing | Jest |

---

## Features (Implemented)

### Roles
- CRUD for system roles
- UUID path validation
- Unit tests for service and controller

### Auth
- OTP-based registration and login
- OTP verification
- JWT access + refresh token lifecycle
- Logout / refresh token revocation
- JWT strategy and protected route support

### Users
- Authenticated profile get / update
- Address CRUD under the current user
- Ownership checks (`NotFound` / `Forbidden`)
- Soft delete support where applicable
- Unit tests for service and controller

### Categories
- Category entity with unique `name` / `slug`, hierarchy (`parentId`), sort order, active flag, soft delete
- Admin-oriented create / update / delete + public list / detail
- Uniqueness conflict handling
- Database migration for `categories`
- Unit tests for service (and controller scaffolding)

---

## Project Structure

```text
coffee-marketplace-api/
├── docs/                          # Business, domain, database, architecture docs
└── coffee-marketplace-api/        # NestJS application
    ├── src/
    │   ├── common/                # Guards, decorators, filters, interceptors
    │   ├── config/                # Configuration + Joi validation
    │   ├── database/              # TypeORM, migrations, seeds
    │   └── modules/
    │       ├── auth/
    │       ├── roles/
    │       ├── users/
    │       └── categories/
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
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/categories` | List categories |
| `GET` | `/categories/:id` | Category details |
| `POST` | `/categories` | Create category |
| `PATCH` | `/categories/:id` | Update category |
| `DELETE` | `/categories/:id` | Soft-delete category |

> Write endpoints for categories are intended for admin use; auth/authorization guards will be tightened as the admin layer matures. Full interactive contracts live in Swagger.

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
- **API contracts**: Swagger is the source of interactive API documentation.

---

## Roadmap (Next)

1. **Seller** — seller profile and seller-scoped operations  
2. **Product** — product catalog linked to categories and sellers  
3. **Inventory** — stock management  
4. **Cart → Order → Payment** — purchase flow  

---

## License

Private / UNLICENSED — not published as an open-source package.
=======
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
| Testing | Jest |

---

## Features (Implemented)

### Roles
- CRUD for system roles
- UUID path validation
- Unit tests for service and controller

### Auth
- OTP-based registration and login
- OTP verification
- JWT access + refresh token lifecycle
- Logout / refresh token revocation
- JWT strategy and protected route support

### Users
- Authenticated profile get / update
- Address CRUD under the current user
- Ownership checks (`NotFound` / `Forbidden`)
- Soft delete support where applicable
- Unit tests for service and controller

### Categories
- Category entity with unique `name` / `slug`, hierarchy (`parentId`), sort order, active flag, soft delete
- Admin-oriented create / update / delete + public list / detail
- Uniqueness conflict handling
- Database migration for `categories`
- Unit tests for service (and controller scaffolding)

---

## Project Structure

```text
coffee-marketplace-api/
├── docs/                          # Business, domain, database, architecture docs
└── coffee-marketplace-api/        # NestJS application
    ├── src/
    │   ├── common/                # Guards, decorators, filters, interceptors
    │   ├── config/                # Configuration + Joi validation
    │   ├── database/              # TypeORM, migrations, seeds
    │   └── modules/
    │       ├── auth/
    │       ├── roles/
    │       ├── users/
    │       └── categories/
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
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/categories` | List categories |
| `GET` | `/categories/:id` | Category details |
| `POST` | `/categories` | Create category |
| `PATCH` | `/categories/:id` | Update category |
| `DELETE` | `/categories/:id` | Soft-delete category |

> Write endpoints for categories are intended for admin use; auth/authorization guards will be tightened as the admin layer matures. Full interactive contracts live in Swagger.

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
- **API contracts**: Swagger is the source of interactive API documentation.

---

## Roadmap (Next)

1. **Seller** — seller profile and seller-scoped operations  
2. **Product** — product catalog linked to categories and sellers  
3. **Inventory** — stock management  
4. **Cart → Order → Payment** — purchase flow  

---

## License

Private / UNLICENSED — not published as an open-source package.
