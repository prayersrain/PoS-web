import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";

// Server-side session validation using httpOnly cookie
export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, username: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Error checking session:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
