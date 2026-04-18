import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";
import { broadcastOrderUpdate } from "@/app/api/sse/orders/route";

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
    const { paymentMethod } = await request.json();

    if (!paymentMethod || !["cash", "qris", "debit", "credit"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({ error: "Order already paid" }, { status: 400 });
    }

    // If QR order awaiting payment, change status to pending
    const newStatus = order.status === "awaiting_payment" ? "pending" : undefined;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: "paid",
        paymentMethod,
        paidAt: new Date(),
        ...(newStatus && { status: newStatus }),
      },
      include: { items: { include: { menuItem: true } } },
    });

    // Broadcast update via SSE
    broadcastOrderUpdate({ type: "payment", order: updatedOrder });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
