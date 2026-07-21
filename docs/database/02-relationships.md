# Database Relationships

## Users & Roles

roles.id -> users.role_id

------------------------------------

## Users & Addresses

users.id -> addresses.user_id

------------------------------------

## Users & Products

users.id -> products.seller_id

------------------------------------

## Users & Carts

users.id -> carts.user_id

------------------------------------

## Users & Orders

users.id -> orders.user_id

------------------------------------

## Users & Reviews

users.id -> reviews.user_id

------------------------------------

## Users & Notifications

users.id -> notifications.user_id

------------------------------------

## Categories & Products

products.id -> product_categories.product_id

categories.id -> product_categories.category_id

------------------------------------

## Categories Hierarchy

categories.parent_id -> categories.id

------------------------------------

## Products & Inventories

products.id -> inventories.product_id

------------------------------------

## Products & Discounts

products.id -> product_discounts.product_id

discounts.id -> product_discounts.discount_id

------------------------------------

## Carts & Cart Items

carts.id -> cart_items.cart_id

products.id -> cart_items.product_id

------------------------------------

## Orders & Order Items

orders.id -> order_items.order_id

products.id -> order_items.product_id

------------------------------------

## Orders & Payments

orders.id -> payments.order_id

------------------------------------

## Orders & Coupons

coupons.id -> orders.coupon_id

------------------------------------

## Orders & Addresses

addresses.id -> orders.shipping_address_id

------------------------------------

## Reviews & Products

products.id -> reviews.product_id

------------------------------------

## Articles & Products

articles.id -> article_products.article_id

products.id -> article_products.product_id

------------------------------------

## Articles & Users

users.id -> articles.author_id