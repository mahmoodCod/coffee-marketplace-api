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

PATCH  /seller/inventory/:productId

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

GET    /products/:productId/inventory

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

POST   /orders/:id/coupon

DELETE /orders/:id/coupon

-------------------------------

## Payments

POST   /payments/:orderId

GET    /payments/verify

POST   /payments/callback

-------------------------------

## Reviews

Customer

POST   /reviews

GET    /products/:productId/reviews

PATCH  /reviews/:id

DELETE /reviews/:id

-------------------------------

Admin

GET    /admin/reviews

PATCH  /admin/reviews/:id/approve

PATCH  /admin/reviews/:id/reject

--------------------------------

## Discounts

Admin

GET    /admin/discounts

Seller

GET    /seller/discounts

POST   /seller/discounts

POST   /seller/discounts/:discountId/products/:productId

PATCH  /seller/discounts/:id

DELETE /seller/discounts/:id

--------------------------------

## Coupons

Admin

GET    /admin/coupons

GET    /admin/coupons/:id

POST   /admin/coupons

PATCH  /admin/coupons/:id

DELETE /admin/coupons/:id

Customer

POST   /orders/:id/coupon

DELETE /orders/:id/coupon

Notes:

- Apply/remove coupon endpoints require authentication.
- Coupons can only be applied to the customer's own orders.
- Coupons can only be applied while the order status is PENDING_PAYMENT.
- POST /orders/:id/coupon request body: { "code": "SUMMER20" }
- Applying a coupon updates orders.final_price based on orders.total_price.
- Removing a coupon resets orders.coupon_id to null and restores final_price to total_price.

--------------------------------

## Notifications

GET    /notifications

PATCH  /notifications/:id/read

--------------------------------

## Articles

Public

GET    /articles

GET    /articles/:slug

Admin

GET    /admin/articles

GET    /admin/articles/:id

POST   /admin/articles

PATCH  /admin/articles/:id

DELETE /admin/articles/:id

POST   /admin/articles/:id/products/:productId

DELETE /admin/articles/:id/products/:productId

Notes:

- Public endpoints return only published articles.
- Admin endpoints require authentication and the ADMIN role.
- Article slug must be unique.
- Publishing sets published_at when an article becomes published for the first time.
- Unpublishing keeps the article record but hides it from public listing and detail endpoints.
- Product attach/remove endpoints manage the article_products junction table.
- An article can be linked to many products; a product can appear in many articles.

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