# OTP Verification - API Reference & Examples

## Complete API Documentation

### Endpoint 1: Request OTP

**Purpose:** Initiates password recovery by sending OTP to user's email

**URL:** `POST /api/auth/recover/request`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Validation Rules:**
- Email must be valid format (RFC 5322)
- User account must exist (but not shown for security)

---

### Success Response (200 OK)

**Development Mode** (NODE_ENV=development):
```json
{
  "message": "OTP has been sent to your email address.",
  "otp": "123456",
  "token": "3f7e8b9a2c1d4f6e8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e"
}
```

**Production Mode:**
```json
{
  "message": "OTP has been sent to your email address."
}
```

**Response Headers:**
```
Content-Type: application/json
Content-Length: 65
```

---

### Error Responses

**400 Bad Request - Invalid Email:**
```json
{
  "error": "Invalid email format"
}
```

**404 Not Found - No Account:**
```json
{
  "message": "If the account exists, an OTP has been sent to the email address."
}
```

**500 Server Error:**
```json
{
  "error": "Failed to send OTP email. Please try again later."
}
```

---

### Database Operations

**MongoDB Query (User Lookup):**
```javascript
db.users.findOne({ email: "user@example.com" })
```

**MongoDB Insert (OTP Token):**
```javascript
db.passwordresettokens.insertOne({
  userId: ObjectId("507f1f77bcf86cd799439011"),
  tokenHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  expiresAt: ISODate("2026-05-01T14:30:00Z"),
  used: false,
  otp: "123456",
  otpExpiresAt: ISODate("2026-05-01T14:10:00Z"),
  otpVerified: false,
  otpAttempts: 0,
  maxOtpAttempts: 5,
  createdAt: ISODate("2026-05-01T14:00:00Z"),
  updatedAt: ISODate("2026-05-01T14:00:00Z")
})
```

---

## Endpoint 2: Verify OTP

**Purpose:** Validates the OTP code and issues a password reset token

**URL:** `POST /api/auth/recover/verify-otp`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Validation Rules:**
- Email must be valid format
- OTP must be exactly 6 digits
- OTP must not be expired (10 min expiration)
- User must have active OTP request
- Attempts must be < 5

---

### Success Response (200 OK)

**When OTP is Valid:**
```json
{
  "message": "OTP verified successfully",
  "resetToken": "5f7e8b9a2c1d4f6e8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d"
}
```

---

### Error Responses

**400 Bad Request - Invalid OTP:**
```json
{
  "error": "Invalid OTP. 4 attempts remaining."
}
```

Response after 1st failed attempt shows "4 attempts remaining"
Response after 5th failed attempt:

```json
{
  "error": "Maximum OTP attempts exceeded. Please request a new password reset."
}
```

**400 Bad Request - Expired OTP:**
```json
{
  "error": "OTP has expired"
}
```

**400 Bad Request - Invalid Format:**
```json
{
  "error": "OTP must be 6 digits"
}
```

**400 Bad Request - No Active Request:**
```json
{
  "error": "No active password reset request found"
}
```

**404 Not Found:**
```json
{
  "error": "User not found"
}
```

**500 Server Error:**
```json
{
  "error": "OTP verification failed"
}
```

---

### Database Operations

**MongoDB Query (Find Reset Token):**
```javascript
db.passwordresettokens.findOne({
  userId: ObjectId("507f1f77bcf86cd799439011"),
  used: false,
  expiresAt: { $gt: new Date() }
}).sort({ createdAt: -1 })
```

**MongoDB Update (Mark OTP Verified):**
```javascript
db.passwordresettokens.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439012") },
  {
    $set: {
      otpVerified: true,
      expiresAt: ISODate("2026-05-01T14:15:00Z"),
      tokenHash: "new_hash_value",
      updatedAt: ISODate("2026-05-01T14:05:00Z")
    }
  }
)
```

**MongoDB Update (Increment Attempts):**
```javascript
db.passwordresettokens.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439012") },
  {
    $inc: { otpAttempts: 1 },
    $set: { updatedAt: ISODate("2026-05-01T14:05:30Z") }
  }
)
```

---

## Endpoint 3: Reset Password

**Purpose:** Updates user password using the reset token

**URL:** `POST /api/auth/recover/reset`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "5f7e8b9a2c1d4f6e8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d",
  "newPassword": "MyNewSecurePass123"
}
```

**Validation Rules:**
- Token must be 20+ characters
- Password must be 8-128 characters
- Token must not be expired
- Token must be marked otpVerified=true
- Token must not already be used

---

### Success Response (200 OK)

**When Password Reset Succeeds:**
```json
{
  "message": "Password reset successful"
}
```

---

### Error Responses

**400 Bad Request - Invalid Token:**
```json
{
  "error": "Invalid, expired, or unverified reset token. Please verify your OTP."
}
```

**400 Bad Request - Token Already Used:**
```json
{
  "error": "Invalid, expired, or unverified reset token. Please verify your OTP."
}
```

**400 Bad Request - OTP Not Verified:**
```json
{
  "error": "Invalid, expired, or unverified reset token. Please verify your OTP."
}
```

**400 Bad Request - Invalid Password:**
```json
{
  "error": "Password must be between 8 and 128 characters"
}
```

**400 Bad Request - Invalid Token Format:**
```json
{
  "error": "Invalid input"
}
```

**500 Server Error:**
```json
{
  "error": "Reset failed"
}
```

---

### Database Operations

**MongoDB Query (Find & Validate Token):**
```javascript
db.passwordresettokens.findOne({
  tokenHash: SHA256("reset_token_value"),
  used: false,
  expiresAt: { $gt: new Date() },
  otpVerified: true
})
```

**MongoDB Update (User Password):**
```javascript
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  {
    $set: {
      passwordHash: "$2b$12$encrypted_bcrypt_hash",
      passwordCipher: "iv:authTag:encryptedPassword",
      lastSeenAt: ISODate("2026-05-01T14:05:45Z"),
      updatedAt: ISODate("2026-05-01T14:05:45Z")
    }
  }
)
```

**MongoDB Update (Mark Token Used):**
```javascript
db.passwordresettokens.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439012") },
  {
    $set: {
      used: true,
      updatedAt: ISODate("2026-05-01T14:05:45Z")
    }
  }
)
```

---

## Complete User Flow - Step by Step

### Step 1: User Requests OTP

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/recover/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

**Response (Dev):**
```json
{
  "message": "OTP has been sent to your email address.",
  "otp": "482965",
  "token": "a3f7e8b9a2c1d4f6e8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d"
}
```

**Email Sent:**
```
To: john@example.com
Subject: Your Password Reset OTP - EncrypChat

Body:
Your OTP is: 482965
Valid for: 10 minutes
Max attempts: 5
```

---

### Step 2: User Enters OTP

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/recover/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "482965"
  }'
```

**Response:**
```json
{
  "message": "OTP verified successfully",
  "resetToken": "b4f7e8b9a2c1d4f6e8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d"
}
```

---

### Step 3: User Resets Password

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/recover/reset \
  -H "Content-Type: application/json" \
  -d '{
    "token": "b4f7e8b9a2c1d4f6e8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d",
    "newPassword": "SecurePassword2024!"
  }'
```

**Response:**
```json
{
  "message": "Password reset successful"
}
```

---

### Step 4: User Logs In

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword2024!"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatarUrl": ""
  }
}
```

---

## Status Codes Reference

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful operation |
| 201 | Created | New resource created |
| 400 | Bad Request | Invalid input or business logic error |
| 401 | Unauthorized | Authentication required |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 500 | Server Error | Internal server error |

---

## Rate Limits & Timeouts

| Item | Limit | Timeout |
|------|-------|---------|
| OTP Validity | N/A | 10 minutes |
| Token Validity | N/A | 30 minutes |
| Token (after OTP) | N/A | 45 minutes |
| Password Reset Window | N/A | 15 min after OTP verification |
| OTP Attempts | 5 attempts | Per request session |
| Email Rate | N/A | 1 per minute per user |

---

## Testing Scenarios

### Scenario 1: Happy Path
```
1. Request OTP → Success
2. Verify OTP → Success  
3. Reset Password → Success
4. Login with new password → Success
```

### Scenario 2: Wrong OTP Multiple Times
```
1. Request OTP → Success
2. Verify OTP (wrong) → Attempt 1/5
3. Verify OTP (wrong) → Attempt 2/5
4. Verify OTP (wrong) → Attempt 3/5
5. Verify OTP (wrong) → Attempt 4/5
6. Verify OTP (wrong) → Locked out
7. Request OTP (new) → Reset, back to Step 1
```

### Scenario 3: OTP Expiration
```
1. Request OTP → Success (expires in 10 min)
2. Wait 11 minutes
3. Verify OTP → "OTP has expired"
4. Request OTP (new) → Success
```

### Scenario 4: Token Expiration
```
1. Request OTP → Success (token expires in 30 min)
2. Verify OTP → Success (extends to 45 min)
3. Wait 46 minutes
4. Reset Password → "Token expired"
5. Request OTP (new) → Reset, back to Step 1
```

---

## Common Integration Patterns

### Frontend (React/Next.js)
```javascript
async function handlePasswordReset(email, otp, newPassword) {
  // Step 1: Request OTP
  const step1 = await fetch('/api/auth/recover/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  }).then(r => r.json());

  // Step 2: Verify OTP
  const step2 = await fetch('/api/auth/recover/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  }).then(r => r.json());

  // Step 3: Reset Password
  const step3 = await fetch('/api/auth/recover/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: step2.resetToken, newPassword })
  }).then(r => r.json());

  return step3;
}
```

### Backend (Express/Fastify)
```javascript
// Integrate with your middleware
app.use('/api/auth/recover', require('./recover-routes'));
```

---

## Monitoring & Logging

### Key Metrics to Track
- OTP success rate
- Failed verification attempts
- Email delivery rate
- Average reset time
- Token expiration rate

### Log Entry Examples
```
[2026-05-01T14:00:00Z] OTP_REQUEST email=john@example.com
[2026-05-01T14:02:15Z] OTP_VERIFY attempt=1 email=john@example.com result=invalid
[2026-05-01T14:02:45Z] OTP_VERIFY attempt=2 email=john@example.com result=valid
[2026-05-01T14:03:30Z] PASSWORD_RESET email=john@example.com result=success
```

---

**Last Updated:** May 1, 2026  
**API Version:** 1.0.0  
**Status:** Stable
