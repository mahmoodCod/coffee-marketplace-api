# Database Indexes

## Unique Indexes

users.phone

roles.name

products.slug

categories.slug

coupons.code

articles.slug

----------------------------------------

## Foreign Key Indexes

users.role_id

products.seller_id

addresses.user_id

inventories.product_id

carts.user_id

cart_items.cart_id

cart_items.product_id

orders.user_id

orders.coupon_id

orders.shipping_address_id

order_items.order_id

order_items.product_id

payments.order_id

reviews.user_id

reviews.product_id

notifications.user_id

articles.author_id

----------------------------------------

## Composite Indexes

cart_items (cart_id, product_id)

order_items (order_id, product_id)

reviews (user_id, product_id)

product_categories (product_id, category_id)

product_discounts (product_id, discount_id)

article_products (article_id, product_id)

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