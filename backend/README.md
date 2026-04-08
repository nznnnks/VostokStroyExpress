# Backend

NestJS + Prisma backend for the climate equipment storefront.

## Module structure

- `src/prisma` - Prisma client lifecycle and database access.
- `src/common` - global DTOs, Prisma error mapping and JSON serialization.
- `src/users` - `User` and `ClientProfile`.
- `src/catalog` - `Category`, `Product`, `Discount`.
- `src/service-offerings` - catalog of installation/maintenance services.
- `src/carts` - `Cart` and `CartItem`.
- `src/orders` - `Order`, `OrderItem`, `OrderTemplate`, `Payment`.
- `src/news` - news feed for the public site.
- `src/admin-users` - admin panel accounts.

## Quick start

```bash
npm install
copy .env.example .env
npm run prisma:generate
npm run build
```

## Frontend-oriented JSON rules

- `Decimal` values are serialized to numbers.
- `Date` values are serialized to ISO strings.
- Sensitive fields such as `passwordHash` are never returned from controllers.
- Nested responses already include related entities needed by the frontend:
  `product.category`, `cart.items`, `order.items`, `order.payment`, `news.author`.
