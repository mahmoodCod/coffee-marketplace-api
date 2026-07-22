# Authentication Flow

## User Registration

1. The user enters their phone number.
2. The system validates the phone number.
3. An OTP code is generated.
4. The OTP code is sent via SMS.
5. The user submits the OTP code.
6. The system verifies the OTP.
7. A new user account is created.
8. Access and refresh tokens are generated.

----------------------------------------------

## User Login

1. The user enters their phone number.
2. The system generates an OTP code.
3. The OTP code is sent via SMS.
4. The user submits the OTP code.
5. The system verifies the OTP.
6. Access and refresh tokens are generated.

----------------------------------------------

## Authentication

The client includes the access token in the request headers.

Example:

Authorization: Bearer <access_token>

----------------------------------------------

## Authorization

The system validates:

- User authentication
- User role
- User permissions

----------------------------------------------

## Logout

1. The refresh token is revoked.
2. The user session is terminated.

----------------------------------------------

## Security Rules

- OTP codes expire after a limited time.
- OTP codes can only be used once.
- Access tokens have a short lifetime.
- Refresh tokens have a longer lifetime.
- Protected endpoints require authentication.