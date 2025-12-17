# 🔐 Authentication System - Implementation Guide

## Current Status

⚠️ **CRITICAL BLOCKER FOR VPS DEPLOYMENT**

The exchange currently uses **Manus OAuth** for authentication, which will NOT work when deployed on your VPS (bitchangemoney.xyz).

## The Problem

### What's Currently Implemented

```typescript
// server/_core/auth.ts - Uses Manus OAuth
import { OAuthClient } from '@manus/oauth';

const oauth = new OAuthClient({
  baseURL: process.env.OAUTH_SERVER_URL,
  // ... Manus-specific configuration
});
```

This system:
- ✅ Works in Manus development environment
- ❌ Will NOT work on VPS deployment
- ❌ Requires Manus infrastructure
- ❌ Not independent/portable

### What's in the Database

The `users` table already has these columns added:

```sql
email VARCHAR(255)
password VARCHAR(255)  -- for hashed passwords
emailVerified BOOLEAN DEFAULT false
```

But there's a **TypeScript/Drizzle ORM cache bug** preventing these fields from being recognized.

## What Needs to Be Implemented

### 1. Email/Password Authentication System

**Backend (server/routers/auth.ts):**

```typescript
// Register new user
auth.register = publicProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string()
  }))
  .mutation(async ({ input }) => {
    // 1. Check if email already exists
    // 2. Hash password with bcrypt
    // 3. Generate email verification token
    // 4. Insert user into database
    // 5. Send verification email
    // 6. Return success message
  });

// Login user
auth.login = publicProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string()
  }))
  .mutation(async ({ input }) => {
    // 1. Find user by email
    // 2. Verify password with bcrypt
    // 3. Check if email is verified
    // 4. Generate JWT token
    // 5. Set session cookie
    // 6. Return user data
  });

// Logout user
auth.logout = protectedProcedure
  .mutation(async ({ ctx }) => {
    // 1. Clear session cookie
    // 2. Invalidate JWT token
    // 3. Return success
  });

// Verify email
auth.verifyEmail = publicProcedure
  .input(z.object({
    token: z.string()
  }))
  .mutation(async ({ input }) => {
    // 1. Verify token
    // 2. Update user emailVerified = true
    // 3. Return success
  });
```

**Frontend Pages:**

```typescript
// client/src/pages/Login.tsx
// - Email/password form
// - "Forgot password" link
// - "Register" link
// - Error handling
// - Redirect to dashboard on success

// client/src/pages/Register.tsx
// - Email/password/name form
// - Password strength indicator
// - Terms & conditions checkbox
// - "Already have account" link
// - Email verification notice

// client/src/pages/ForgotPassword.tsx
// - Email input form
// - Send reset link
// - Success message

// client/src/pages/ResetPassword.tsx
// - New password form
// - Token validation
// - Redirect to login on success
```

### 2. Email OTP System

**For email verification, password reset, 2FA:**

```typescript
// server/utils/email.ts
import nodemailer from 'nodemailer';

export async function sendVerificationEmail(email: string, token: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify your BitChange Pro account',
    html: `
      <h1>Welcome to BitChange Pro!</h1>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
    `
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  // Similar implementation
}

export async function sendOTPEmail(email: string, otp: string) {
  // Send 6-digit OTP code
}
```

**Database additions:**

```sql
-- Add to schema
CREATE TABLE email_verification_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### 3. Session Management

**Update JWT handling:**

```typescript
// server/utils/jwt.ts
import jwt from 'jsonwebtoken';

export function generateToken(userId: number, email: string) {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!);
}

// server/_core/context.ts
// Update to read JWT from cookie instead of Manus OAuth
```

### 4. Email Notifications

**Implement notifications for:**

- ✅ Welcome email on registration
- ✅ Email verification
- ✅ Password reset
- ✅ Login from new device
- ✅ Withdrawal request submitted
- ✅ Withdrawal approved/rejected
- ✅ KYC status update
- ✅ Support ticket reply
- ✅ Staking reward earned

## Implementation Steps

### Phase 1: Fix Database Schema Issue

```bash
# Clear Drizzle cache
rm -rf node_modules/.drizzle
rm -rf .drizzle

# Regenerate schema
pnpm db:push

# Restart dev server
pnpm dev
```

### Phase 2: Implement Backend Auth

1. Install dependencies:
```bash
pnpm add bcrypt nodemailer
pnpm add -D @types/bcrypt @types/nodemailer
```

2. Create auth router with register/login/logout/verify endpoints
3. Implement JWT token generation
4. Update context to use JWT instead of OAuth
5. Add email sending utilities

### Phase 3: Create Frontend Pages

1. Create Login.tsx page
2. Create Register.tsx page
3. Create ForgotPassword.tsx page
4. Create ResetPassword.tsx page
5. Create VerifyEmail.tsx page
6. Update App.tsx routing
7. Update navigation/sidebar

### Phase 4: Email Configuration

1. Setup SMTP credentials (Gmail, SendGrid, etc.)
2. Add to .env:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@bitchangemoney.xyz
```

3. Test email sending

### Phase 5: Testing

1. Test registration flow
2. Test email verification
3. Test login/logout
4. Test password reset
5. Test session persistence
6. Test protected routes

## Dependencies Needed

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "nodemailer": "^6.9.7",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/nodemailer": "^6.4.14",
    "@types/jsonwebtoken": "^9.0.5"
  }
}
```

## Environment Variables Required

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@bitchangemoney.xyz

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Frontend URL for email links
FRONTEND_URL=https://bitchangemoney.xyz
```

## Security Considerations

1. **Password Hashing**: Use bcrypt with salt rounds >= 10
2. **JWT Secret**: Use strong random secret (32+ characters)
3. **Token Expiry**: Email verification tokens expire in 24h
4. **Password Reset**: Tokens expire in 1h, single-use only
5. **Rate Limiting**: Limit login attempts (5 per 15 minutes)
6. **HTTPS Only**: Cookies should be secure and httpOnly
7. **Email Validation**: Verify email format and domain
8. **Password Strength**: Minimum 8 characters, require complexity

## Current Workaround

For immediate testing on VPS without auth:

1. Manually insert admin user in database:
```sql
INSERT INTO users (email, password, role, kycStatus, emailVerified, createdAt)
VALUES (
  'admin@bitchangemoney.xyz',
  '$2b$10$...',  -- bcrypt hash of your password
  'admin',
  'approved',
  true,
  NOW()
);
```

2. Generate hash:
```bash
node -e "console.log(require('bcrypt').hashSync('your-password', 10))"
```

3. Access dashboard directly (bypass login for testing)

## Estimated Implementation Time

- **Phase 1** (Fix schema): 1 hour
- **Phase 2** (Backend auth): 4-6 hours
- **Phase 3** (Frontend pages): 4-6 hours
- **Phase 4** (Email setup): 2-3 hours
- **Phase 5** (Testing): 2-3 hours

**Total: 13-19 hours of development**

## Alternative: Quick Auth Solution

If you need to deploy ASAP, consider:

1. **Simple password-only auth** (no email verification initially)
2. **Admin creates users manually** (no public registration)
3. **Add email verification later** as enhancement

This reduces implementation to ~6-8 hours.

## Questions?

- Do you want full email verification flow or simple password auth first?
- Do you have SMTP credentials ready (Gmail, SendGrid, etc.)?
- Should users be able to self-register or admin-only user creation?
- Do you want 2FA (two-factor authentication) as well?

---

**Next Step:** Choose implementation approach and I'll start building the auth system.
