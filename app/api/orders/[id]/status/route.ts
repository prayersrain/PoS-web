import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastOrderUpdate } from "@/app/api/sse/orders/route";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await request.json();
    const { id: orderId } = await params;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // If order is served or cancelled, release the stand
    if (status === "served" || status === "cancelled") {
      if (order.standId) {
        await prisma.stand.update({
          where: { id: order.standId },
          data: { isActive: false, orderId: null },
        });
      }
    }

    // Broadcast update via SSE
    broadcastOrderUpdate({ type: "order_update", orderId, status });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
