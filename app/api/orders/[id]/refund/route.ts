import { NextResponse } from "next/server";
import { processRefund } from "@/lib/midtrans";
import { requireAuth } from "@/lib/auth-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { amount, reason } = await request.json();

    if (!amount || !reason) {
      return NextResponse.json({ error: "Amount and reason required" }, { status: 400 });
    }

    const refund = await processRefund(id, amount, reason);

    return NextResponse.json({ success: true, refund });
  } catch (error: any) {
    console.error("Refund error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
