import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that DON'T require authentication
const PUBLIC_PATHS = [
  "/login",
  "/menu",        // QR Menu for customers
  "/payment",     // Payment page for customers
  "/queue-display",
  "/_next",
  "/favicon.ico",
  "/manifest.json",
  "/icon-",
  "/uploads",
];

// API routes that DON'T require authentication
const PUBLIC_API_PATHS = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/menu",             // GET menu for QR customers
  "/api/tables",           // GET tables for QR flow
  "/api/orders/table/",    // GET orders by table for QR customers
  "/api/payment/",         // Payment flow (create + notify webhook)
  "/api/sse/",             // Server-Sent Events
];

// API routes that allow specific methods without auth
const CONDITIONAL_API_PATHS = [
  { path: "/api/orders", methods: ["POST"] },           // QR customers can create orders
  { path: "/api/orders/", methods: ["POST", "GET"] },   // Cancel order + get order details
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and public pages
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname === "/") {
    return NextResponse.next();
  }

  // Allow public API routes
  if (PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow conditional API routes (e.g., POST /api/orders from QR)
  for (const rule of CONDITIONAL_API_PATHS) {
    if (pathname.startsWith(rule.path) && rule.methods.includes(request.method)) {
      return NextResponse.next();
    }
  }

  // Everything else requires authentication via session cookie
  const sessionToken = request.cookies.get("pos_session_id")?.value;

  if (!sessionToken) {
    // API routes: return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized - Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    // Page routes: redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session cookie exists - allow through
  // (Detailed validation happens in individual API routes via requireAuth())
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3)$).*)",
  ],
};
