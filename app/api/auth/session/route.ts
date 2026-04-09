import { NextResponse } from "next/server";

// With sessionStorage, session is managed client-side
// This endpoint just confirms the API is working
export async function GET() {
  return NextResponse.json({ message: "Session managed client-side via sessionStorage" });
}
