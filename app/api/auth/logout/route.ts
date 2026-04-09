import { NextResponse } from "next/server";

export async function POST() {
  // Client will clear sessionStorage
  return NextResponse.json({ success: true });
}
