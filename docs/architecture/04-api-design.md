# API Design

## Authentication

POST   /auth/register

POST   /auth/login

POST   /auth/verify-otp

POST   /auth/logout

---------------------------

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

GET    /products/search

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

-------------------------------