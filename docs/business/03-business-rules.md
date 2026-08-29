# Business Rules

## Authentication

- Only authenticated users can place orders.
- Only authenticated users can submit reviews.
- Users can only manage their own profiles.

-------------------------------

## Products

- Products with zero stock cannot be purchased.
- Product prices cannot be left blank.
- Each product must belong to at least one category.
- Products cannot be purchased without registering.
- Only sellers can create products.
- Sellers can update only their own products.
- Sellers can delete only their own products.
- Product slug must be unique.
- Product title cannot be empty.
- Product price must be greater than zero.
- Product rating is calculated from approved reviews.
- Sold count increases only after successful payment.
- Archived products cannot be purchased.
- Inactive products are hidden from customers.

-------------------------------

## Shopping Cart

- A user can have only one active cart.
- An order cannot be created from an empty cart.
- The quantity of products in the cart cannot exceed the inventory.

-------------------------------

## Orders

- Orders are created from the user's active cart.
- After order creation, the active cart is marked COMPLETED.
- Orders must contain at least one product.
- An order must include a shipping address.
- Users can only view their own orders.
- Users can only cancel their own orders.
- An order can only be paid once.
- Inventory decreases only after successful payment.
- Orders cannot be canceled after shipment.
- Order final_price is calculated from total_price after coupon discounts.

-------------------------------

## Payments

- Users can only pay for their own orders.
- Only orders with PENDING_PAYMENT status can be paid.
- An order can only have one successful payment.
- Successful payment marks the order as PAID.
- Failed payments do not mark the order as PAID.
- Inventory decreases only after successful payment.
- Sold count increases only after successful payment.

-------------------------------

## Discounts

- Only sellers can create product discounts.
- Sellers can manage only discounts attached to their own products.
- Admins can view all product discounts.
- Only active discounts within start_date and end_date are applied.
- Expired discounts cannot be applied to products.
- A discount cannot make the product price less than zero.
- Product discounts are linked to products through product_discounts.

------------------------------

## Coupons

- Only admins can manage coupons.
- Coupon codes have expiration dates.
- Expired coupon codes cannot be applied.
- Only active coupons can be applied.
- A coupon cannot reduce the final order price below zero.
- An order can have at most one coupon.
- Coupon usage cannot exceed usage_limit.

------------------------------

## Reviews

- Customers can review a product only after purchasing it.
- A user can submit only one review per product.
- Users can only edit their own reviews.
- Users can only delete their own reviews.
- New reviews are not visible until approved.
- Only approved reviews are shown to customers.
- Product rating is calculated from approved reviews.
- Admins can approve or reject reviews.

------------------------------

## Notifications

- Users can only view their own notifications.
- Users can only mark their own notifications as read.
- New notifications are unread by default.
- Users receive a notification upon successful registration.
- Users receive a notification after a successful payment.
- Users receive a notification when their order status changes.

-------------------------------

## Categories

- A category name must be unique.
- A category slug must be unique.
- A category cannot be deleted if it contains products.

-------------------------------

## Seller

- Sellers can view and update only their own profile.
- Sellers can manage only their own products.
- Sellers can view only their own orders.
- Sellers cannot access other sellers' information.
- Sellers can confirm only delivered orders.
- Sellers can manage only their own product discounts.

-------------------------------

## Business Rules

- Each product must have one inventory.
- Stock cannot be negative.
- Reserved stock cannot be greater than stock.
- Products with zero available stock cannot be purchased.
- Only product owner seller can update inventory.
- Admin can update any inventory.
- Inventory changes must be tracked.