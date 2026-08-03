# API Design

## Authentication

POST   /auth/register

POST   /auth/login

POST   /auth/verify-otp

POST   /auth/logout

POST /auth/refresh

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

GET    /seller/orders/:id

PATCH  /seller/orders/:id/received

GET    /seller/reports

GET    /seller/dashboard

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

GET     /users/profile

PATCH   /users/profile

GET     /users/addresses

POST    /users/addresses

PATCH   /users/addresses/:id

DELETE  /users/addresses/:id

-----------------------------

## Products

Customer

GET   /products

GET   /products/:id

-----------------------------

Seller

POST   /seller/products

PATCH  /seller/products/:id

DELETE /seller/products/:id

GET    /seller/products

-----------------------------

Admin

GET    /admin/products

PATCH  /admin/products/:id

DELETE /admin/products/:id

-----------------------------

## Categories

POST   /admin/categories

GET    /categories

GET    /categories/:id

PATCH  /admin/categories/:id

DELETE /admin/categories/:id

------------------------------

## Inventory

GET    /inventory/:productId

PATCH  /seller/inventory/:productId

PATCH  /admin/inventory/:productId

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

Customer

PATCH /reviews/:id

DELETE /reviews/:id

-------------------------------

Admin

GET /admin/reviews

PATCH /admin/reviews/:id/approve

PATCH /admin/reviews/:id/reject

--------------------------------

## Review Moderation

GET    /admin/reviews

PATCH  /admin/reviews/:id/approve

PATCH  /admin/reviews/:id/reject

--------------------------------

## Discounts

GET    /admin/discounts

POST   /seller/discounts

PATCH  /seller/discounts/:id

DELETE /seller/discounts/:id

--------------------------------

## Coupons

GET /admin/coupons

POST /admin/coupons

PATCH /admin/coupons/:id

DELETE /admin/coupons/:id

--------------------------------

Customer

POST /coupons/apply

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

GET  /admin/dashboard/statistics

GET  /admin/dashboard/sales

--------------------------------

GET  /seller/dashboard

--------------------------------

## Reports

GET  /admin/reports/orders

GET  /admin/reports/products

GET  /admin/reports/users