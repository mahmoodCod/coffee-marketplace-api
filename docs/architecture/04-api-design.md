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