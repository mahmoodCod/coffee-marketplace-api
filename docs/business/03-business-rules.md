# Business Rules

## Authentication

- Only authenticated users can place orders.
- Only authenticated users can submit reviews.
- Users can only manage their own profiles.

---

## Products

- Products with zero stock cannot be purchased.
- Product prices cannot be left blank.
- Each product must belong to at least one category.
- Products cannot be purchased without registering.

---

## Shopping Cart

- A user can have only one active cart.
- An order cannot be created from an empty cart.
- The quantity of products in the cart cannot exceed the inventory.

---

## Orders

- Orders must contain at least one product.
- An order can only be paid once.
- Inventory decreases only after successful payment.
- Orders cannot be canceled after shipment.

---

## Discounts

- Discount codes have expiration dates.
- Expired discount codes cannot be applied.
- A discount code cannot reduce the final price below zero.

---

## Reviews

- Customers can review a product only after purchasing it.
- Users can only edit their own reviews.

---

## Notifications

- Users receive a notification after a successful payment.
- Users receive a notification when their order status changes.
- Users receive a notification upon successful registration.