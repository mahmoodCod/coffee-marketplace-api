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
- created_at
- updated_at

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
- shipping_address_id
- tracking_code
- shipped_at
- delivered_at
- paid_at
- created_at
- updated_at

--------------------------