import { NextResponse } from "next/server";
import { createQRISPayment } from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({ error: "Order already paid" }, { status: 400 });
    }

    // Create payment with Midtrans
    const payment = await createQRISPayment({
      orderId: order.id,
      amount: order.totalAmount,
      customerName: "Customer",
      items: order.items.map((item) => ({
        id: item.menuItemId,
        name: item.menuItem.name,
        price: item.subtotal / item.quantity,
        quantity: item.quantity,
      })),
    });

    // Update order with payment info
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "unpaid",
        paymentId: payment.token,
      },
    });

    return NextResponse.json({
      token: payment.token,
      redirectUrl: payment.redirectUrl,
      orderId: order.id,
      amount: order.totalAmount,
    });
  } catch (error: any) {
    console.error("Payment creation error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
