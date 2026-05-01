# Brevo Email Setup Guide

This guide helps you configure Brevo to send OTP emails for password reset.

## Prerequisites

- Brevo account
- A verified sender email address in Brevo
- Node.js and npm installed

## Step 1: Create and Verify a Sender

1. Sign in to the [Brevo dashboard](https://www.brevo.com/).
2. Go to your sender or domain verification settings.
3. Add and verify the email address you want to send OTPs from, such as `noreply@yourdomain.com`.
4. Make sure the sender is approved before testing.

## Step 2: Create an API Key

1. In Brevo, open the SMTP & API settings.
2. Create a new API key with transactional email access.
3. Copy the key and store it securely.

## Step 3: Configure Environment Variables

Add these values to your `.env.local` file:

```env
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=EncrypChat
```

## Step 4: Test the OTP Flow

1. Start the app with `npm run dev`.
2. Open `/recover`.
3. Request a password reset using your test email.
4. Check your inbox for the OTP message.

## Troubleshooting

- Verify the sender email is approved in Brevo.
- Confirm `BREVO_API_KEY` is set correctly.
- Check spam or promotions folders if the email lands there.
- Make sure the account has transactional email enabled.

## Development Behavior

When `NODE_ENV=development`, the app logs the OTP preview if Brevo is not configured so you can still test the recovery flow locally.