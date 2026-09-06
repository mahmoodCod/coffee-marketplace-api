# Entities

## Identity

- User
- Role
- Address

---------------------------

## Catalog

- Product
- Category
- Inventory
- Article (content / guides, admin-managed)

---------------------------

## Shopping

- Cart
- CartItem

---------------------------

## Orders

- Order
- OrderItem
- Payment

---------------------------

## Customer Interaction

- Review
- Notification

---------------------------

## Marketing

- Discount (product-level, seller-managed)
- Coupon (order-level, admin-managed)

---------------------------

## Analytics

- Dashboard and Reports are read-only query modules.
- They do not introduce dedicated database entities.
- They aggregate data from Orders, Payments, Products, Users, and Inventory.