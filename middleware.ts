import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limit store (per instance)
const buckets = new Map<string, { count: number; reset: number }>();

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS = 40; // per window

// Paths to protect (state-changing + expensive)
const RATE_PATHS = [/^\/api\/auth/, /^\/api\/ai/, /^\/api\/uploads/, /^\/api\/orders/, /^\/api\/wishlist/, /^\/api\/admin/];
const CSRF_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

function key(req: NextRequest) {
  const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown";
  const pathGroup = RATE_PATHS.find((re) => re.test(req.nextUrl.pathname))?.source || "other";
  return `${ip}:${pathGroup}`;
}

function isRateLimited(req: NextRequest): boolean {
  const k = key(req);
  const now = Date.now();
  const bucket = buckets.get(k);
  if (!bucket || bucket.reset < now) {
    buckets.set(k, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  if (bucket.count >= MAX_REQUESTS) return true;
  bucket.count += 1;
  return false;
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Seed CSRF token cookie if missing (non-HttpOnly so client can read and echo)
  const existingCsrf = req.cookies.get("csrfToken")?.value;
  if (!existingCsrf) {
    const token = crypto.randomUUID();
    res.cookies.set("csrfToken", token, {
      sameSite: "lax",
      secure: true,
      path: "/",
    });
  }

  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");

  // Enforce same-origin + token on state-changing requests to mitigate CSRF (except NextAuth which has its own CSRF)
  if (CSRF_METHODS.includes(req.method) && !isAuthRoute) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
    const headerToken = req.headers.get("x-csrf-token");
    const cookieToken = existingCsrf || res.cookies.get("csrfToken")?.value;
    if (!cookieToken || headerToken !== cookieToken) {
      return NextResponse.json({ error: "CSRF token missing or invalid" }, { status: 403 });
    }
  }

  // Rate limit selective routes
  if (RATE_PATHS.some((re) => re.test(req.nextUrl.pathname))) {
    if (isRateLimited(req)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
};
