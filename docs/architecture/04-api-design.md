# API Design

## Authentication

POST   /auth/register

POST   /auth/login

POST   /auth/verify-otp

POST   /auth/logout

---------------------------

## Roles

GET    /roles

GET    /roles/:id

POST   /roles

PATCH  /roles/:id

DELETE /roles/:id

----------------------------

## Sellers

GET    /seller/profile

PATCH  /seller/profile

GET    /seller/products

GET    /seller/orders

GET    /seller/reports

----------------------------

## Admin - User Management

GET    /admin/users

GET    /admin/users/:id

PATCH  /admin/users/:id

PATCH  /admin/users/:id/suspend

PATCH  /admin/users/:id/activate

----------------------------

## Admin - Order Management

GET    /admin/orders

PATCH  /admin/orders/:id/status

PATCH  /admin/orders/:id/ship

PATCH  /admin/orders/:id/deliver

----------------------------

## Users

GET    /users/profile

PATCH  /users/profile

GET    /users/addresses

POST   /users/addresses

PATCH  /users/addresses/:id

DELETE /users/addresses/:id

----------------------------

## Products

GET    /products

GET    /products/:id

POST   /products

PATCH  /products/:id

DELETE /products/:id

GET /products?q=coffee

-----------------------------

## Categories

GET    /categories

GET    /categories/:id

POST   /categories

PATCH  /categories/:id

DELETE /categories/:id

------------------------------

## Inventory

GET    /inventory/:productId

PATCH  /inventory/:productId

------------------------------

## Cart

GET    /cart

POST   /cart/items

PATCH  /cart/items/:id

DELETE /cart/items/:id

DELETE /cart/clear

------------------------------

## Orders

GET    /orders

GET    /orders/:id

POST   /orders

PATCH  /orders/:id/cancel

-------------------------------

## Payments

POST   /payments/:orderId

GET    /payments/verify

POST   /payments/callback

-------------------------------

## Reviews

GET    /products/:id/reviews

POST   /products/:id/reviews

PATCH  /reviews/:id

DELETE /reviews/:id

--------------------------------

## Review Moderation

GET    /admin/reviews

PATCH  /admin/reviews/:id/approve

PATCH  /admin/reviews/:id/reject

--------------------------------

## Discounts

GET    /discounts

POST   /discounts

PATCH  /discounts/:id

DELETE /discounts/:id

--------------------------------

## Coupons

GET    /coupons

POST   /coupons

PATCH  /coupons/:id

DELETE /coupons/:id

POST   /coupons/apply

--------------------------------

## Notifications

GET    /notifications

PATCH  /notifications/:id/read

--------------------------------

## Articles

GET    /articles

GET    /articles/:slug

POST   /articles

PATCH  /articles/:id

DELETE /articles/:id

--------------------------------

## Dashboard

GET    /dashboard/statistics

GET    /dashboard/sales

--------------------------------

## Reports

GET    /reports/orders

GET    /reports/products

GET    /reports/users