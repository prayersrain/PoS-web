import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelTransaction } from "@/lib/midtrans";
import { broadcastOrderUpdate } from "@/app/api/sse/orders/route";
import { requireAuth } from "@/lib/auth-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    // Find the order
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Determine if requester can cancel
    // 1. Authenticated staff/admin
    // 2. QR Customer if status is 'pending' or 'awaiting_payment' AND created by 'qr-customer'
    const isQRManager = order.createdBy === "qr-customer";
    const canCancel = 
      session || 
      (isQRManager && (order.status === "pending" || order.status === "awaiting_payment"));

    if (!canCancel) {
      return NextResponse.json(
        { error: "Wait, the staff is already preparing your food! Cannot cancel now." },
        { status: 403 }
      );
    }

    // If there is a Midtrans payment, cancel it there too
    if (order.paymentId) {
      await cancelTransaction(id);
    } else {
      // Just update DB
      await prisma.order.update({
        where: { id },
        data: { status: "cancelled" },
      });
    }

    // Broadcast update
    broadcastOrderUpdate({ type: "order_cancelled", orderId: id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cancel error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
