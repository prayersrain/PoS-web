import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession, deleteSessionCookie } from "@/lib/auth-server";

export async function POST() {
  // Clear httpOnly session cookie and destroy server-side session
  const cookieStore = await cookies();
  const token = cookieStore.get("pos_session_id")?.value;
  await destroySession(token);
  await deleteSessionCookie();

  return NextResponse.json({ success: true });
}
