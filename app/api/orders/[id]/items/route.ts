import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastOrderUpdate } from "@/app/api/sse/orders/route";
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
    const { items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Items required" }, { status: 400 });
    }

    // Calculate new items total
    let newSubtotal = 0;
    const newItems = items.map((item: any) => {
      const itemSubtotal = item.price * item.quantity;
      newSubtotal += itemSubtotal;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        note: item.note || null,
        subtotal: itemSubtotal,
      };
    });

    // Get current order
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Calculate new totals
    const newOrderSubtotal = order.subtotal + newSubtotal;
    const newOrderTax = Math.round(newOrderSubtotal * 0.10 * 100) / 100;
    const newOrderTotal = Math.round((newOrderSubtotal + newOrderTax) * 100) / 100;

    // Add items to order
    await prisma.orderItem.createMany({
      data: newItems.map((item: any) => ({
        ...item,
        orderId: id,
      })),
    });

    // Update order totals
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        subtotal: newOrderSubtotal,
        tax: newOrderTax,
        totalAmount: newOrderTotal,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Broadcast update
    broadcastOrderUpdate({ type: "order_updated", orderId: id });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error adding items:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
