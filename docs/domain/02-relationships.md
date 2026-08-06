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

--------------------------------------------

## Inventory

- An inventory belongs to one product.

--------------------------------------------

## Article

- An article can be created by an admin.

--------------------------------------------

## Coupon

- A coupon can be applied to many orders.

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

--------------------------------------------

## OrderItem

- An order item belongs to one order.
- An order item belongs to one product.

--------------------------------------------

## Payment

- A payment belongs to one order.

--------------------------------------------

## Review

- A review belongs to one user.
- A review belongs to one product.

--------------------------------------------

## Discount

- A discount can belong to many products.

--------------------------------------------

## Address

- An address belongs to one user.

--------------------------------------------

## Notification

- A notification belongs to one user.