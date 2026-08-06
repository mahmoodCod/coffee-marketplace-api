# Tables

## users

- id
- name
- phone
- role_id
- is_verified
- is_active
- last_login_at
- created_at
- updated_at
- deleted_at

-------------------------

## roles

- id
- name
- description
- created_at
- updated_at
- deleted_at

-------------------------

## addresses

- id
- user_id
- title
- province
- city
- street
- postal_code
- created_at
- updated_at

-------------------------

## categories

- id
- name
- slug
- description
- parent_id
- sort_order
- is_active
- created_at
- updated_at
- deleted_at

-------------------------

## products

- id
- seller_id
- original_price
- product_type
- weight
- caffeine_level
- flavor_notes
- origin_country
- sold_count
- recommended
- warranty_description
- has_warranty
- how_to_use
- benefits
- ingredients
- rating
- title
- images
- thumbnail
- slug
- description
- price
- status
- created_at
- updated_at
- deleted_at

--------------------------

## product_categories

- product_id
- category_id

--------------------------

## inventories

- id
- product_id
- stock
- reserved_stock
- created_at
- updated_at

--------------------------

## carts

- id
- user_id
- status
- created_at
- updated_at

--------------------------

## cart_items

- id
- cart_id
- product_id
- quantity
- unit_price
- created_at
- updated_at

--------------------------

## orders

- id
- user_id
- coupon_id
- status
- total_price
- final_price
- shipping_address_id
- tracking_code
- shipped_at
- delivered_at
- paid_at
- created_at
- updated_at

--------------------------

## order_items

- id
- order_id
- product_id
- quantity
- unit_price
- created_at
- updated_at

--------------------------

## payments

- id
- order_id
- authority
- transaction_id
- amount
- status
- paid_at
- created_at

--------------------------

## reviews

- id
- user_id
- product_id
- rating
- is_approved
- comment
- created_at
- updated_at

---------------------------

## notifications

- id
- user_id
- title
- type
- message
- is_read
- created_at

---------------------------

## discounts

- id
- name
- type
- value
- description
- minimum_order_amount
- maximum_discount_amount
- usage_limit
- used_count
- is_active
- start_date
- end_date
- created_at
- updated_at

---------------------------

## product_discounts

- product_id
- discount_id

---------------------------

## coupons

- id
- code
- type
- value
- usage_limit
- is_active
- used_count
- expires_at
- created_at
- updated_at

---------------------------

## articles

- id
- author_id
- title
- slug
- excerpt
- content
- thumbnail
- badge
- read_time
- is_published
- published_at
- created_at
- updated_at

----------------------------

## article_products

- article_id
- product_id