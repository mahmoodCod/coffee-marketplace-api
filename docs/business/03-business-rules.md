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

- Discount codes have expiration dates.
- Expired discount codes cannot be applied.
- A discount code cannot reduce the final price below zero.

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

- Users receive a notification after a successful payment.
- Users receive a notification when their order status changes.
- Users receive a notification upon successful registration.

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

-------------------------------

## Business Rules

- Each product must have one inventory.
- Stock cannot be negative.
- Reserved stock cannot be greater than stock.
- Products with zero available stock cannot be purchased.
- Only product owner seller can update inventory.
- Admin can update any inventory.
- Inventory changes must be tracked.