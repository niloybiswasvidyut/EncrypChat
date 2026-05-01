# OTP Verification - Quick Start Guide

## System Overview

Your OTP Verification system is now fully implemented! Here's what's ready:

### ✅ Implemented Components

- **3 API Endpoints** for password recovery flow
- **Multi-step UI** with email → OTP → password reset
- **Email Service** with Brevo integration
- **Secure OTP Storage** with expiration tracking
- **Rate Limiting** (5 OTP attempts max)
- **Input Validation** with Zod schemas

---

## API Endpoints Reference

### 1. Request OTP
**POST** `/api/auth/recover/request`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "OTP has been sent to your email address.",
  "otp": "123456",        // DEV MODE ONLY
  "token": "base64..."    // DEV MODE ONLY
}
```

**Error Response (400):**
```json
{
  "message": "If the account exists, an OTP has been sent to the email address."
}
```

---

### 2. Verify OTP
**POST** `/api/auth/recover/verify-otp`

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "message": "OTP verified successfully",
  "resetToken": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Error Response (400):**
```json
{
  "error": "Invalid OTP. 4 attempts remaining."
}
```

**Other Errors:**
- `"OTP has expired"` - OTP valid for 10 minutes only
- `"Maximum OTP attempts exceeded. Please request a new password reset."` - 5 attempts limit
- `"No active password reset request found"` - Request OTP first

---

### 3. Reset Password
**POST** `/api/auth/recover/reset`

**Request:**
```json
{
  "token": "resetToken_from_verify_otp",
  "newPassword": "NewSecurePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset successful"
}
```

**Error Response (400):**
```json
{
  "error": "Invalid, expired, or unverified reset token. Please verify your OTP."
}
```

---

## UI Pages

### `/recover` - Password Recovery Page
Multi-step form with three stages:

**Stage 1: Email Request**
- Enter email address
- Click "Send OTP"
- Receive OTP (dev: shown in response)

**Stage 2: OTP Verification**
- 6-digit code input
- Auto-formatted input field
- Displays remaining attempts
- Back button to retry email

**Stage 3: Password Reset**
- Minimum 8 characters
- Confirm changes
- Redirects to login

---

## Environment Variables Required

```env
# Brevo Email Service
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=EncrypChat

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DB=encrypchat

# Security
JWT_SECRET=your-secret
NEXTAUTH_SECRET=your-secret
ENCRYPTION_SECRET=your-secret
```

---

## Testing the OTP Flow

### Option 1: Using the Web UI
1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000/recover`
3. Enter test email
4. View OTP in dev response or check email
5. Enter OTP and verify
6. Set new password

### Option 2: Using cURL (Testing API Directly)

**Request OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/recover/request \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected Output (Dev):**
```json
{
  "message": "OTP has been sent to your email address.",
  "otp": "123456",
  "token": "abc123..."
}
```

**Verify OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/recover/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

**Expected Output:**
```json
{
  "message": "OTP verified successfully",
  "resetToken": "..."
}
```

**Reset Password:**
```bash
curl -X POST http://localhost:3000/api/auth/recover/reset \
  -H "Content-Type: application/json" \
  -d '{"token":"resetToken","newPassword":"NewPass123"}'
```

---

## Key Features

| Feature | Details |
|---------|---------|
| **OTP Validity** | 10 minutes |
| **Token Validity** | 30 minutes (extended to 45 after OTP verified) |
| **Max Attempts** | 5 attempts to enter OTP |
| **Password Hash** | bcryptjs 12 rounds |
| **Encryption** | AES-256-GCM for password backup |
| **Email Service** | Brevo |
| **Validation** | Zod schemas |

---

## Security Best Practices

✅ **Implemented:**
- OTP expires after 10 minutes
- Maximum 5 verification attempts
- Password hashing with bcrypt
- Token hashing with SHA-256
- Encrypted password backup
- Email verification required

⚠️ **To Configure:**
1. Set strong `JWT_SECRET` and `ENCRYPTION_SECRET`
2. Enable Brevo transactional email sending
3. Verify sender email in Brevo
4. Implement rate limiting (consider Redis)
5. Add HTTPS in production
6. Monitor failed OTP attempts

---

## Common Scenarios

### Scenario 1: User Forgets Password
1. Click "Forgot password?" on login page
2. Enter email → OTP sent
3. Enter 6-digit OTP from email
4. Set new password
5. Login with new password ✅

### Scenario 2: OTP Expires
1. Request new OTP (step 1 again)
2. Old OTP is invalidated
3. New OTP sent to email
4. Verify new OTP ✅

### Scenario 3: Too Many Attempts
1. User enters wrong OTP 5 times
2. Error: "Maximum OTP attempts exceeded"
3. User must request new OTP
4. Reset process restarts ✅

---

## File Structure

```
src/
├── app/
│   ├── recover/page.js              ← UI form
│   └── api/auth/recover/
│       ├── request/route.js         ← Generate & send OTP
│       ├── verify-otp/route.js      ← Verify OTP code
│       └── reset/route.js           ← Update password
├── lib/
│   ├── email.js                     ← Brevo sender
│   ├── validators.js                ← Input validation
│   ├── mongodb.js                   ← DB connection
│   └── encryption.js                ← AES-256-GCM
└── models/
    ├── User.js                      ← User accounts
    └── PasswordResetToken.js        ← OTP & tokens
```

---

## Next Steps

1. **Configure Brevo**
  - Create a Brevo API key
  - Verify sender email in Brevo
   - Add credentials to `.env.local`

2. **Test the Flow**
   - Start: `npm run dev`
   - Visit: `http://localhost:3000/recover`
   - Complete recovery flow

3. **Deploy**
   - Set environment variables in your hosting
   - Request SES sandbox exit (for production)
   - Configure rate limiting middleware
   - Enable HTTPS

---

## Troubleshooting

**"AWS credentials not configured"**
- Add `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` to `.env.local`

**OTP not received**
- Check Brevo sender approval is complete
- Verify sender email is approved in Brevo
- Check email spam folder

**"Invalid OTP" with attempts**
- Ensure 6-digit format
- Check OTP hasn't expired (10 min limit)
- Use exact OTP from email or dev response

**Token expired**
- Request new OTP within 30 minutes
- OTP verification extends token to 45 minutes
- Complete password reset within 15 min of OTP verification

---

## Support Resources

- [Brevo Documentation](https://developers.brevo.com/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Zod Validation](https://zod.dev/)

---

**Status:** ✅ OTP Verification system fully implemented and ready for deployment!
