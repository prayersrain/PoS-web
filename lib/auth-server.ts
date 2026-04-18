// Server-side auth functions (only for use in API routes and Server Components)
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { randomBytes } from "crypto";

const SESSION_COOKIE = "pos_session_id";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function generateSessionToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + SESSION_DURATION),
    },
  });
  return token;
}

export async function setSessionCookie(token: string, maxAge?: number) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: maxAge ?? SESSION_DURATION / 1000,
    path: "/",
  });
}

export async function requireAuth(): Promise<{ id: string; userId: string; role: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findFirst({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return null;
  }

  return { id: session.id, userId: session.userId, role: session.user.role };
}

export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}

export async function destroySession(token?: string) {
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
}
