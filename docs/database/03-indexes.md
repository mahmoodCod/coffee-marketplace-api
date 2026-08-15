# Database Indexes

## Unique Indexes

users.phone

roles.name

products.slug

categories.slug

coupons.code

articles.slug

payments.order_id

----------------------------------------

## Foreign Key Indexes

users.role_id

addresses.user_id

products.seller_id

categories.parent_id

inventories.product_id

carts.user_id

cart_items.cart_id

cart_items.product_id

orders.user_id

orders.coupon_id

orders.shipping_address_id

order_items.order_id

order_items.product_id

reviews.user_id

reviews.product_id

notifications.user_id

articles.author_id

----------------------------------------

## Unique Composite Indexes

reviews (user_id, product_id)

product_categories (product_id, category_id)

product_discounts (product_id, discount_id)

article_products (article_id, product_id)

cart_items (cart_id, product_id)

----------------------------------------

## Partial Unique Indexes

carts (user_id) WHERE status = 'ACTIVE'

----------------------------------------

## Composite Indexes

order_items (order_id, product_id)

orders (user_id, created_at)

orders (status, created_at)

products (status, created_at)

products (seller_id, status)

----------------------------------------

## Search Indexes

products.title

products.product_type

categories.name

articles.title

----------------------------------------

## Sort Indexes

products.created_at

orders.created_at

articles.published_at

categories.sort_order