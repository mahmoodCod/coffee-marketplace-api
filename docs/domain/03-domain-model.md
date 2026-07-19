# Domain Model

## Core Entities

- User
- Role
- Product
- Category
- Cart
- CartItem
- Order
- OrderItem
- Payment
- Review
- Notification
- Address
- Discount
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

Product ── Discount

Order ── Payment