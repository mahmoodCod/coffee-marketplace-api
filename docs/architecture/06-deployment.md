# Deployment

## Environments

The project supports the following environments:

- Development
- Staging
- Production

--------------------------------

## Services

The application consists of the following services:

- API Server
- PostgreSQL
- Redis
- Payment Gateway
- Notification Service

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

SMS_API_KEY=your-sms-key

PAYMENT_GATEWAY_API_KEY=your-payment-key

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