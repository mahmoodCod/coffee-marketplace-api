# Deployment

## Environments

The project supports the following environments:

- Development
- Staging
- Production

--------------------------------

## Internal Services

- API Server
- PostgreSQL
- Redis

--------------------------------

## External Services

- Payment Gateway
- SMS Provider
- Email Provider

--------------------------------

## Containerization

The application uses Docker and Docker Compose.

Main files:

- Dockerfile
- docker-compose.yml
- .dockerignore

--------------------------------

## Environment Variables

Example:

NODE_ENV=development

PORT=3000

DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=coffee_marketplace
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password

REDIS_HOST=redis
REDIS_PORT=6379

JWT_ACCESS_SECRET=your-access-secret

JWT_REFRESH_SECRET=your-refresh-secret

JWT_ACCESS_EXPIRES_IN=15m

JWT_REFRESH_EXPIRES_IN=30d

OTP_TTL=120

PAYMENT_GATEWAY_CALLBACK_URL=http://localhost:3000/payments/callback

APP_URL=http://localhost:3000

SMS_API_KEY=your-sms-key

PAYMENT_GATEWAY_API_KEY=your-payment-key

---------------------------------

## Database Migrations

Database migrations are executed during deployment.

Migrations can be executed:

- During CI/CD pipelines
- During container startup
- Manually by administrators

---------------------------------

## Docker Containers

### API

- NestJS application

### Database

- PostgreSQL

### Cache

- Redis

--------------------------------

## Production Requirements

- HTTPS
- Reverse Proxy (Nginx)
- Logging
- Monitoring
- Automatic Backups

--------------------------------

## CI/CD

Recommended tools:

- GitHub Actions
- Docker Hub
- VPS / Cloud Server