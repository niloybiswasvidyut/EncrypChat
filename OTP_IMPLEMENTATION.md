# OTP Verification Implementation Guide

## Overview

EncrypChat includes a complete OTP (One-Time Password) verification system for secure password recovery. The system uses Brevo to send OTP codes to users' email addresses.

## Architecture

### Flow Diagram
```
User Request → OTP Generation → Email Send → OTP Verification → Token Issuance → Password Reset
```

### Components

#### 1. Models (`src/models/`)

**User.js** - User account model with password management
- `name`: User's full name
- `email`: Unique email address (lowercase)
- `passwordHash`: Bcrypt hashed password
- `passwordCipher`: Encrypted password backup
- `isOnline`: Online status
- `lastSeenAt`: Last activity timestamp

**PasswordResetToken.js** - OTP and reset token management
- `userId`: Reference to User
- `tokenHash`: Hashed reset token (SHA-256)
- `otp`: 6-digit OTP code
- `otpExpiresAt`: OTP expiration (10 minutes)
- `expiresAt`: Token expiration (30 minutes)
- `otpVerified`: OTP verification status
- `otpAttempts`: Failed OTP attempts counter
- `maxOtpAttempts`: Maximum allowed attempts (5)

#### 2. Validators (`src/lib/validators.js`)

```javascript
verifyOtpSchema: z.object({
  email: z.email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
})

resetPasswordSchema: z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8).max(128),
})

recoverRequestSchema: z.object({
  email: z.email(),
})
```

#### 3. Email Service (`src/lib/email.js`)

Sends HTML-formatted OTP emails via Brevo with:
- Professional email template
- Security warnings
- OTP validity info (10 minutes)
- 5 attempt limit notice

#### 4. API Endpoints

**POST `/api/auth/recover/request`**
- Input: `{ email }`
- Process:
  1. Finds user by email
  2. Generates 6-digit OTP
  3. Creates PasswordResetToken record
  4. Sends email via Brevo
  5. Returns token (dev only) and OTP (dev only)
- Response: `{ message, token?, otp? }`

**POST `/api/auth/recover/verify-otp`**
- Input: `{ email, otp }`
- Process:
  1. Validates email and OTP format
  2. Finds most recent reset token
  3. Checks OTP expiration
  4. Verifies OTP matches
  5. Increments attempt counter on failure
  6. Marks OTP as verified on success
  7. Generates new token hash
  8. Extends main token expiration (15 min)
- Response: `{ message, resetToken }`
- Error: Tracks attempts remaining

**POST `/api/auth/recover/reset`**
- Input: `{ token, newPassword }`
- Process:
  1. Verifies token and checks it's otpVerified
  2. Hashes new password with bcrypt
  3. Encrypts password for backup
  4. Updates user record
  5. Marks token as used
- Response: `{ message }`

#### 5. UI Pages

**`/recover` - Recovery Page**
- Multi-step form:
  - **Step 1**: Email input → Request OTP
  - **Step 2**: 6-digit OTP input → Verify OTP
  - **Step 3**: New password input → Reset password
- Features:
  - Attempt counter display
  - Back buttons between steps
  - Error and success messages
  - Dev mode shows OTP and token
  - Security warnings

## Environment Configuration

Create `.env.local` with:

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DB=encrypchat

# JWT Secret
JWT_SECRET=your-jwt-secret-key

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret

# Encryption
ENCRYPTION_SECRET=your-encryption-secret

# Brevo Email
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=EncrypChat

# Pusher (Real-time)
NEXT_PUBLIC_PUSHER_KEY=your-pusher-key
NEXT_PUBLIC_PUSHER_CLUSTER=your-cluster
PUSHER_APP_ID=your-app-id
PUSHER_SECRET=your-secret

# Firebase Storage
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Security Features

1. **Password Hashing**: bcryptjs with 12 salt rounds
2. **Encryption**: AES-256-GCM for password backup
3. **OTP Expiration**: 10 minutes validity
4. **Token Expiration**: 30 minutes (extended after OTP verification)
5. **Rate Limiting**: 5 OTP attempts maximum
6. **Token Hashing**: SHA-256 hash of reset tokens
7. **JWT Tokens**: 7-day expiration for auth sessions

## Usage Flow

### For Users

1. **Password Recovery Request**
   - Navigate to `/recover`
   - Enter email address
   - Click "Send OTP"

2. **OTP Verification**
   - Receive email with 6-digit OTP
   - Enter OTP in form
   - See remaining attempts if incorrect
   - Click "Verify OTP"

3. **Password Reset**
   - Enter new password (min 8 chars)
   - Click "Reset Password"
   - Redirected to login page

### For Development

In development mode (`NODE_ENV=development`), OTP and token are returned in API response:

```javascript
{
  "message": "OTP has been sent to your email address.",
  "otp": "123456",      // Shown in development only
  "token": "base64..."  // Shown in development only
}
```

This allows testing without email access.

## Testing

### Test Email Sending
```bash
curl -X POST http://localhost:3000/api/auth/recover/request \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### Verify OTP
```bash
curl -X POST http://localhost:3000/api/auth/recover/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","otp":"123456"}'
```

### Reset Password
```bash
curl -X POST http://localhost:3000/api/auth/recover/reset \
  -H "Content-Type: application/json" \
  -d '{"token":"your-token","newPassword":"newPass123"}'
```

## Troubleshooting

### Email Not Received
- Verify Brevo sender email is approved
- Check Brevo transactional email is enabled
- Verify AWS credentials in `.env.local`
- Check email spam folder
- Verify IAM user has `ses:SendEmail` permission

### OTP Always Invalid
- Verify 6-digit format (no spaces)
- Check OTP hasn't expired (10 min limit)
- Verify attempts remaining (max 5)

### Token Expired Error
- Request new OTP (token expires at 30 min, more if OTP verified)
- OTP extension extends token 15 more minutes
- Must complete password reset within 15 min of OTP verification

## Dependencies

- `mongoose`: MongoDB object modeling
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT token generation
- `fetch`: Brevo email service HTTP client
- `zod`: Schema validation
- `crypto`: Built-in encryption/hashing

## Files Structure

```
src/
├── models/
│   ├── User.js
│   ├── PasswordResetToken.js
│   ├── Conversation.js
│   └── Message.js
├── lib/
│   ├── email.js              # Brevo OTP sender
│   ├── validators.js         # Zod schemas
│   ├── mongodb.js            # DB connection
│   ├── encryption.js         # AES-256-GCM encryption
│   └── auth.js               # JWT utilities
├── app/
│   └── api/
│       └── auth/
│           ├── recover/
│           │   ├── request/route.js      # OTP request
│           │   ├── verify-otp/route.js   # OTP verification
│           │   └── reset/route.js        # Password reset
│           ├── register/route.js
│           ├── login/route.js
│           └── [...nextauth]/route.js
└── pages/
    └── recover/page.js       # Multi-step recovery UI
```

## Next Steps

1. Install dependencies: `npm install`
2. Configure Brevo email delivery (see BREVO_SETUP.md)
3. Set environment variables in `.env.local`
4. Test OTP flow at `/recover` page
5. For production: Enable email verification and exit sandbox mode
