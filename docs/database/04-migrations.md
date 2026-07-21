# Database Migrations

## Migration Strategy

- Database changes must be managed through migrations.
- Each migration must contain both up and down methods.
- Migrations must be versioned and stored in the repository.
- Direct modifications to the production database are not allowed.

----------------------------------------

## Migration Order

1. Create roles table.
2. Create users table.
3. Create addresses table.

4. Create categories table.
5. Create products table.
6. Create product_categories table.
7. Create inventories table.

8. Create carts table.
9. Create cart_items table.

10. Create coupons table.
11. Create discounts table.
12. Create product_discounts table.

13. Create orders table.
14. Create order_items table.
15. Create payments table.

16. Create reviews table.
17. Create notifications table.

18. Create articles table.
19. Create article_products table.

----------------------------------------

## Naming Convention

Migration files should follow this format:

YYYYMMDDHHMMSS-description.ts

Examples:

20260721123000-create-users-table.ts

20260721124500-create-products-table.ts

----------------------------------------

## Rollback Rules

- Every migration must support rollback.
- Rollbacks must restore the previous database state.
- Failed migrations must not leave partial changes.

----------------------------------------

## Seed Data

The following data should be seeded:

- Roles
- Admin account
- Initial categories
- Sample products