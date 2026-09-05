# Relationships

## User

- A user has one role.
- A user can have many carts.
- A user has many orders.
- A user has many addresses.
- A user has many reviews.
- A user receives many notifications.

-------------------------------------------

## Role

- A role can belong to many users.

-------------------------------------------

## Product

- A product belongs to one seller.
- A product belongs to many categories.
- A category contains many products.
- A product has one inventory.
- A product can have many reviews.
- A product can have many discounts.
- A product can appear in many cart items.
- A product can appear in many order items.
- A product can appear in many articles.

--------------------------------------------

## Inventory

- An inventory belongs to one product.

--------------------------------------------

## Article

- An article is created and managed by an administrator.
- An article belongs to one author (user).
- An article can be linked to many products.
- A product can appear in many articles.
- Article-product links are stored in article_products.
- Only published articles are visible to guests and customers.

--------------------------------------------

## Discount

- A discount belongs to one seller.
- A discount can belong to many products.
- A discount is linked to products through product_discounts.

--------------------------------------------

## Coupon

- A coupon is managed by administrators.
- A coupon can be applied to many orders.
- An order can have at most one coupon.
- A coupon affects orders.final_price, not individual product prices.

--------------------------------------------

## Category

- A category has many products.

--------------------------------------------

## Cart

- A cart belongs to one user.
- A cart has many cart items.

--------------------------------------------

## CartItem

- A cart item belongs to one cart.
- A cart item belongs to one product.

--------------------------------------------

## Order

- An order belongs to one user.
- An order has many order items.
- An order has one payment.
- An order has one shipping address.
- An order can have one coupon.

--------------------------------------------

## OrderItem

- An order item belongs to one order.
- An order item belongs to one product.

--------------------------------------------

## Payment

- A payment belongs to one order.
- An order has at most one payment.

--------------------------------------------

## Review

- A review belongs to one user.
- A review belongs to one product.
- A user can have only one review per product.

--------------------------------------------

## Address

- An address belongs to one user.

--------------------------------------------

## Notification

- A notification belongs to one user.