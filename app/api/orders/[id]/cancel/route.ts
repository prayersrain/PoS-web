import { NextResponse } from "next/server";
import { cancelTransaction } from "@/lib/midtrans";
import { broadcastOrderUpdate } from "@/app/api/sse/orders/route";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await cancelTransaction(id);

    // Broadcast update
    broadcastOrderUpdate({ type: "order_cancelled", orderId: id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cancel error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
