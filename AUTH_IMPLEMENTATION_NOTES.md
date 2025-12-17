# Authentication Implementation Notes

Based on GitHub repo: https://github.com/onboarding92/exchange

## Files Found

### Core Auth Files
- `server/src/routers.auth.ts` - Main auth router with login/register/logout
- `server/src/auth.login.ts` - Login logic
- `server/src/auth.login.test.ts` - Login tests
- `server/src/email.ts` - Email sending utilities
- `server/src/emailVerification.ts` - Email verification logic
- `server/src/emailAlerts.ts` - Login alert emails
- `server/src/passwordReset.ts` - Password reset flow
- `server/src/passwordHistory.ts` - Password history tracking
- `server/src/loginHistory.ts` - Login history tracking
- `server/src/loginEvents.ts` - Login event logging
- `server/src/deviceSessions.ts` - Device session management
- `server/src/rateLimit.ts` - Rate limiting for auth endpoints

### From routers.auth.ts (visible code):

```typescript
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "./db";
import { router, publicProcedure, authedProcedure } from "./trpc";
import { createSession, getSession, listUserSessions, revokeSession } from "./session";
import { sendEmail } from "./utils/email";

// Send login alert email
async function sendLoginAlertEmail(params: { to: string; ip?: string; ua?: string }) {
  await sendEmail({
    to: params.to,
    subject: "Login alert",
    text: 
      `A login to your account occurred.\n` +
      `IP: ${params.ip ?? "unknown"}\n` +
      `Device: ${params.ua ?? "unknown"}\n` +
      `Time: ${new Date().toISOString()}\n`,
  });
}

export const authRouter = router({
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(4) }))
    .mutation(async ({ input, ctx }) => {
      const user = db
        .prepare("SELECT id,email,password,role FROM users WHERE email=?")
        .get(input.email) as any;

      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const ok = await bcrypt.compare(input.password, user.password);
      if (!ok) throw new TRPCError({ code: "UNAUTHORIZED" });

      const token = createSession(user.id);

      try {
        const ip =
          (ctx.req.headers["x-real-ip"] as string) ||
          (ctx.req.headers["x-forwarded-for"] as string) ||
          "";
        const ua = (ctx.req.headers["user-agent"] as string) || "";
        await sendLoginAlertEmail({ to: user.email, ip, ua });
      } catch {}

      return { token, user: { id: user.id, email: user.email, role: user.role } };
    }),

  sessionsList: authedProcedure.query(({{ ctx }) => {
    return listUserSessions(ctx.user!.id);
  }),

  sessionsRevoke: authedProcedure
    .input(z.object({ token: z.string().min(10) }))
    .mutation((({ ctx, input }) => {
      const current = getSession(input.token);
      if (!current || current.id !== ctx.user!.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      revokeSession(input.token);
      return { success: true };
    }),
});
```

## Key Implementation Details

### 1. Database (SQLite)
- Uses `better-sqlite3` instead of MySQL
- Direct SQL queries with prepared statements
- Users table has: id, email, password (hashed), role

### 2. Password Hashing
- Uses `bcryptjs` (not `bcrypt`)
- Password comparison with `bcrypt.compare()`

### 3. Session Management
- Custom session system with `createSession()`, `getSession()`, `revokeSession()`
- Token-based (not JWT)
- Device sessions tracking
- Multiple active sessions per user

### 4. Email System
- `sendEmail()` utility function
- Login alerts sent on every login
- Email verification system
- Password reset emails

### 5. Security Features
- Rate limiting on auth endpoints
- Login history tracking
- Password history (prevent reuse)
- Device session management
- IP and user-agent logging

### 6. tRPC Procedures
- `publicProcedure` for login/register
- `authedProcedure` for protected routes
- Returns token + user object on login

## What We Need to Adapt

1. **Database**: Convert from SQLite to MySQL (Drizzle ORM)
2. **Session System**: Implement session management (or use JWT)
3. **Email Utilities**: Port email sending functions
4. **Rate Limiting**: Implement rate limiting middleware
5. **Login History**: Add login tracking tables
6. **Device Sessions**: Add device session tables

## Files to Download and Adapt

Priority files to copy:
1. `routers.auth.ts` - Main auth router
2. `email.ts` - Email utilities
3. `emailVerification.ts` - Email verification
4. `passwordReset.ts` - Password reset
5. `deviceSessions.ts` - Device tracking
6. `rateLimit.ts` - Rate limiting
7. `auth.login.test.ts` - Tests

## Next Steps

1. Download complete auth files from GitHub
2. Adapt SQLite queries to Drizzle ORM (MySQL)
3. Implement session management
4. Add missing database tables (sessions, loginHistory, etc.)
5. Port email utilities
6. Create frontend pages (Login, Register, etc.)
