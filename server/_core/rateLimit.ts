/**
 * Rate Limiting Middleware for tRPC
 * Protects against brute-force attacks and API abuse
 */

import { TRPCError } from "@trpc/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the time window
   */
  max: number;
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  /**
   * Custom message to show when rate limit is exceeded
   */
  message?: string;
}

/**
 * Rate limit middleware factory
 * 
 * @example
 * ```ts
 * // Allow 5 login attempts per minute
 * const loginLimiter = createRateLimiter({
 *   max: 5,
 *   windowMs: 60 * 1000,
 *   message: "Too many login attempts, please try again later"
 * });
 * 
 * export const authRouter = router({
 *   login: publicProcedure
 *     .use(loginLimiter)
 *     .input(z.object({ email: z.string(), password: z.string() }))
 *     .mutation(async ({ input }) => {
 *       // ... login logic
 *     })
 * });
 * ```
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { max, windowMs, message = "Too many requests, please try again later" } = options;

  return async function rateLimitMiddleware(opts: any) {
    const { ctx, next } = opts;
    
    // Get client identifier (IP address or user ID)
    const identifier = ctx.user?.id?.toString() || ctx.ip || "unknown";
    const key = `${ctx.path}:${identifier}`;
    const now = Date.now();

    // Initialize or get existing rate limit data
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Increment request count
    store[key].count++;

    // Check if limit exceeded
    if (store[key].count > max) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `${message}. Retry after ${retryAfter} seconds.`,
      });
    }

    return next();
  };
}

/**
 * Predefined rate limiters for common use cases
 */
export const rateLimiters = {
  /**
   * Strict rate limit for authentication endpoints
   * 5 requests per minute
   */
  auth: createRateLimiter({
    max: 5,
    windowMs: 60 * 1000,
    message: "Too many authentication attempts",
  }),

  /**
   * Moderate rate limit for sensitive operations
   * 10 requests per minute
   */
  sensitive: createRateLimiter({
    max: 10,
    windowMs: 60 * 1000,
    message: "Too many requests for this operation",
  }),

  /**
   * Standard rate limit for general API endpoints
   * 30 requests per minute
   */
  standard: createRateLimiter({
    max: 30,
    windowMs: 60 * 1000,
    message: "Too many requests",
  }),

  /**
   * Lenient rate limit for read-only operations
   * 100 requests per minute
   */
  lenient: createRateLimiter({
    max: 100,
    windowMs: 60 * 1000,
    message: "Too many requests",
  }),
};
