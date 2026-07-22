# System Overview

## Architecture Style

This project follows a Modular Monolithic architecture using NestJS.

The system is divided into independent modules, each responsible for a specific business capability.

The architecture is designed to be scalable, maintainable, and extensible.

-------------------------------

## Technology Stack

### Backend

- NestJS
- TypeScript
- Node.js

### Database

- PostgreSQL
- TypeORM
- Database Migrations

### Cache

- Redis

### API Documentation

- Swagger / OpenAPI

### Containerization

- Docker
- Docker Compose
- Dockerfile

---

## Main Modules

- Authentication Module
- User Module
- Role Module
- Product Module
- Category Module
- Inventory Module
- Seller Module
- Cart Module
- Order Module
- Payment Module
- Address Module
- Review Module
- Notification Module
- Discount Module
- Coupon Module
- Article Module
- Dashboard Module
- Report Module

---

## External Services

### Payment Gateway

Responsible for:

- Payment verification
- Payment confirmation
- Payment rejection

### Notification Service

Responsible for:

- Sending SMS
- Sending email
- Sending system notifications

---

## User Roles

- Guest
- Customer
- Seller
- Admin

---

## System Goals

- Provide an online marketplace for coffee products.
- Allow sellers to manage products and inventory.
- Allow customers to place orders and complete payments.
- Provide administrators with monitoring and management tools.
- Ensure scalability and maintainability.