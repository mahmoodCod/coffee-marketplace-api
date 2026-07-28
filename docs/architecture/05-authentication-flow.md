# Authentication Flow

## Registration OTP Request

Endpoint:

POST /auth/register

Flow:

1. The user enters their phone number.
2. The system validates the phone number.
3. The system checks whether the phone number already exists.
4. An OTP code is generated and stored in Redis.
5. The OTP code is sent via SMS.

----------------------------------------

## Login Request

Endpoint:

POST /auth/login

Flow:

1. The user enters their phone number.
2. The system checks whether the account exists.
3. An OTP code is generated and stored in Redis.
4. The OTP code is sent via SMS.

----------------------------------------

## OTP Verification

Endpoint:

POST /auth/verify-otp

Flow:

1. The user submits the OTP code.
2. The system validates the OTP code.
3. The OTP expiration time is checked.
4. The system verifies that the OTP has not been used before.

If the request originated from registration:

* A new user account is created.
* The default role is set to Customer.

If the request originated from login:

* The existing account is authenticated.

After successful verification:

* Access token is generated.
* Refresh token is generated.
* Refresh token is stored securely.
* User session is created.

------------------------------------------

## Token Refresh

Endpoint:

POST /auth/refresh

Flow:

1. The user sends the refresh token.
2. The system validates the refresh token.
3. A new access token is generated.

------------------------------------------

## Authentication

Protected endpoints require authentication.

The client includes the access token in the request headers.

Example:

Authorization: Bearer <access_token>

------------------------------------------

## Authorization

The system validates:

* User authentication
* User role
* User permissions

------------------------------------------

## Logout

Endpoint:

POST /auth/logout

Flow:

1. Stored refresh token is removed or revoked.
2. User session is terminated.

------------------------------------------

## Security Rules

* OTP codes expire after a limited time.
* OTP codes can only be used once.
* OTP codes are stored in Redis.
* Access tokens have a short lifetime.
* Refresh tokens have a longer lifetime.
* OTP requests are rate-limited.
* The number of incorrect attempts is limited.
* Protected endpoints require authentication.
* Refresh tokens are stored securely.
* JWT secrets are stored in environment variables.
