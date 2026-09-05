# Modules

## Authentication Module

Responsible for:

- Registration OTP requests
- Login OTP requests
- OTP verification
- JWT token generation
- Refresh token management
- Logout
- User authentication

-------------------------------------

## User Module

Responsible for:

- Get current user profile
- Update current user profile
- Manage user addresses
- Upload avatar (future)
- Change profile information

-------------------------------------

## Role Module

Responsible for:

- Managing system roles
- Role permissions
- Authorization rules

-------------------------------------

## Seller Module

Responsible for:

- Managing seller profile
- Managing seller products
- Managing seller inventory
- Viewing seller orders
- Confirming delivered orders
- Viewing seller reports
- Viewing seller dashboard

-------------------------------------

## Product Module

Responsible for:

- Creating products
- Updating products
- Deleting products
- Viewing product details

-------------------------------------

## Category Module

Responsible for:

- Category management
- Product categorization

-------------------------------------

## Inventory Module

Responsible for:

- Stock management
- Inventory updates

-------------------------------------

## Cart Module

Responsible for:

- Creating carts
- Managing cart items
- Updating quantities

-------------------------------------

## Order Module

Responsible for:

- Creating orders from cart
- Viewing order history
- Canceling orders
- Managing order status
- Applying and removing coupons on unpaid orders (via Coupon Module)

-------------------------------------

## Payment Module

Responsible for:

- Creating payment records for orders
- Initiating payment with the payment gateway
- Verifying payment results
- Handling payment callbacks
- Updating payment status
- Marking orders as paid after successful payment

-------------------------------------

## Address Module

Responsible for:

- Managing user addresses
- Selecting shipping addresses

-------------------------------------

## Review Module

Responsible for:

- Creating reviews
- Editing reviews
- Deleting reviews
- Viewing product reviews
- Approving reviews
- Rejecting reviews

-------------------------------------

## Notification Module

Responsible for:

- Creating notifications
- Listing user notifications
- Marking notifications as read
- Sending SMS through SMS Provider
- Sending email through Email Provider

-------------------------------------

## Discount Module

Responsible for:

- Creating product discounts
- Updating product discounts
- Deleting product discounts
- Listing seller product discounts
- Attaching discounts to seller products
- Viewing all product discounts (admin)

-------------------------------------

## Coupon Module

Order-level discount codes managed by administrators.

Scope:

- Applies to the entire order total, not individual products.
- Separate from the Discount Module, which handles product-level discounts created by sellers.

Responsible for:

- Creating coupons
- Updating coupons
- Deleting coupons
- Listing coupons
- Validating coupon codes
- Applying coupons to customer orders
- Removing coupons from unpaid orders
- Tracking coupon usage

Dependencies:

- Order Module (coupon is stored on orders.coupon_id and affects final_price)
- Payment Module (used_count increments after successful payment)

-------------------------------------

## Article Module

Content and educational articles managed by administrators.

Scope:

- Articles are platform content (blog / guides), not seller-owned product listings.
- Articles can optionally link to related marketplace products.
- Separate from Product Module, which manages sellable catalog items.

Responsible for:

- Creating articles
- Updating articles
- Deleting articles
- Listing published articles for guests and customers
- Listing all articles for administrators (including drafts)
- Publishing and unpublishing articles
- Attaching products to articles
- Removing products from articles

Dependencies:

- User Module (author_id references the admin who created the article)
- Product Module (optional product links through article_products)

-------------------------------------

## Dashboard Module

Responsible for:

- Dashboard statistics
- Sales analytics

-------------------------------------

## Report Module

Responsible for:

- Generating reports
- Monitoring system activity