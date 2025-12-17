import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getSession } from "../sessionManager";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { parse as parseCookieHeader } from "cookie";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Priority 1: Check email/password session (auth_token cookie)
  try {
    const cookies = parseCookieHeader(opts.req.headers.cookie || "");
    const authToken = cookies.auth_token;
    
    if (authToken) {
      const session = await getSession(authToken);
      if (session) {
        // Get user from database using session userId
        const db = await getDb();
        if (db) {
          const userResult = await db
            .select()
            .from(users)
            .where(eq(users.id, session.userId))
            .limit(1);
          
          if (userResult.length > 0) {
            user = userResult[0];
            console.log("[Auth] Authenticated via email/password session:", user.email);
          }
        }
      }
    }
  } catch (error) {
    console.warn("[Auth] Email/password session check failed:", error);
  }

  // Priority 2: Fallback to OAuth session if no email/password session
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
      console.log("[Auth] Authenticated via OAuth:", user?.email);
    } catch (error) {
      // Authentication is optional for public procedures.
      console.log("[Auth] No valid session found (OAuth or email/password)");
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
