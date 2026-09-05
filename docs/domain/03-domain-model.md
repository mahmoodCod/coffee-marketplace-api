# Domain Model

## Core Entities

- User
- Role
- Product
- Category
- Inventory
- Cart
- CartItem
- Order
- OrderItem
- Payment
- Review
- Notification
- Address
- Discount
- Coupon
- Article

-------------------------------

## Main Relationships

User ── Role

User ── Cart ── CartItem ── Product

User ── Order ── OrderItem ── Product

User ── Review ── Product

User ── Address

User ── Notification

Product ── Category

Product ── Inventory

Product ── Discount

Order ── Coupon (optional, at most one)

Order ── Address

Order ── Payment

User ── Article (author)

Article ── Product (many-to-many via article_products)
