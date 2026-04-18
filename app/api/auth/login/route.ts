import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSessionToken, setSessionCookie } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const endpoint = "/api/auth/login";

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    // Rate Limiting Check
    let rateLimit = await prisma.rateLimit.findUnique({
      where: { ip_endpoint: { ip, endpoint } }
    });

    if (rateLimit && rateLimit.blockedUntil && rateLimit.blockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((rateLimit.blockedUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json({ error: `Terlalu banyak percobaan. Coba lagi dalam ${remainingMinutes} menit.` }, { status: 429 });
    }

    // Server-side only: query DB and verify password
    const bcrypt = await import("bcrypt");
    const user = await prisma.user.findUnique({ where: { username } });

    // Handle Invalid Attempt
    const handleInvalid = async () => {
      if (!rateLimit) {
        await prisma.rateLimit.create({ data: { ip, endpoint, attempts: 1 } });
      } else {
        const attempts = rateLimit.attempts + 1;
        const blockedUntil = attempts >= 5 ? new Date(Date.now() + 5 * 60 * 1000) : null;
        await prisma.rateLimit.update({
          where: { id: rateLimit.id },
          data: { attempts, blockedUntil }
        });
      }
      return NextResponse.json({ error: "Kredensial tidak valid" }, { status: 401 });
    };

    if (!user) return handleInvalid();
    
    if (!user.isActive) {
      return NextResponse.json({ error: "Akun dinonaktifkan" }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return handleInvalid();

    // Reset Rate Limit on success
    if (rateLimit) {
      await prisma.rateLimit.update({
        where: { id: rateLimit.id },
        data: { attempts: 0, blockedUntil: null }
      });
    }

    // Create server-side session and set httpOnly cookie
    const token = await generateSessionToken(user.id);
    await setSessionCookie(token);

    // Write Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        details: `Berhasil login dari IP ${ip}`,
      }
    });

    // Return user data
    return NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
