import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastOrderUpdate } from "@/app/api/sse/orders/route";
import { requireAuth } from "@/lib/auth-server";

// Define valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "cancelled"],
  served: [], // Terminal state
  cancelled: [], // Terminal state
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();
    const { id: orderId } = await params;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const allowedTransitions = VALID_TRANSITIONS[order.status];
    if (!allowedTransitions || !allowedTransitions.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition: ${order.status} -> ${status}` },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // If order is served or cancelled, release the stand
    if (status === "served" || status === "cancelled") {
      if (order.standId) {
        await prisma.stand.update({
          where: { id: order.standId },
          data: { isActive: false, currentOrderId: null },
        });
      }
    }

    // Broadcast update via SSE
    broadcastOrderUpdate({ type: "order_update", orderId, status });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
