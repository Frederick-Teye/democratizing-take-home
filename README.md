# Authentication API

JWT-based authentication server with rate limiting and secure password hashing.

## Clone the Project

Create a new directory and clone the project:

```bash
mkdir democratizing-take-home
cd democratizing-take-home
git clone git@github.com:Frederick-Teye/democratizing-take-home.git .
```

## Setup

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```
PORT=8000
ACCESS_KEY=your_access_key
REFRESH_KEY=your_refresh_key
environment=development
```

## Run

```bash
npm start
```

The server will start on `http://localhost:8000`

## API Endpoints

### Register

**POST** `/api/auth/register`

Request body:

```json
{
  "username": "john_doe",
  "password": "secure_password"
}
```

Response (201):

```json
{
  "msg": "User registered successfully"
}
```

Rate limit: 5 requests per hour per IP

---

### Login

**POST** `/api/auth/login`

Request body:

```json
{
  "username": "john_doe",
  "password": "secure_password"
}
```

Response (200):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "msg": "Login successful"
}
```

Rate limit: 5 failed attempts per 15 minutes per IP

---

### Get Profile

**GET** `/api/auth/profile`

Headers:

```
Authorization: Bearer {accessToken}
```

Response (200):

```json
{
  "message": "Profile accessed",
  "user": {
    "id": 1,
    "username": "john_doe",
    "password": "hashed_password"
  }
}
```

---

### Refresh Token

**POST** `/api/auth/refresh`

Cookies: `refreshToken` (set after login)

Response (200):

```json
{
  "accessToken": "new_eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Logout

**POST** `/api/auth/logout`

Response (200):

```json
{
  "message": "Logged out successfully"
}
```

## Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs with salt rounds of 10
- **Rate Limiting** - 100 requests per 15 minutes globally, stricter limits on auth endpoints
- **Refresh Tokens** - 7-day refresh token rotation with secure cookies
- **Error Handling** - Centralized error middleware
- **Request Logging** - Request logging middleware

## Project Structure

```
.
├── controllers/
│   └── authController.js      # Authentication logic
├── middleware/
│   ├── authenticateJWT.js     # JWT verification middleware
│   ├── rateLimiter.js         # Rate limiting configuration
│   ├── error.js               # Error handling middleware
│   ├── logger.js              # Request logging middleware
│   └── notFound.js            # 404 handler middleware
├── routes/
│   └── auth.js                # Authentication routes
├── server.js                  # Main server file
├── .env.example               # Environment variables template
└── package.json               # Dependencies
```

## Security Notes

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Passwords are hashed with bcryptjs (10 salt rounds)
- Refresh tokens are stored in httpOnly cookies
- Rate limiting prevents brute force attacks
