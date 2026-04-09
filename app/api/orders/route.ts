import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");

    const where: any = {};
    if (status) {
      where.status = status;
    } else {
      // By default, hide 'awaiting_payment' orders (unpaid QR orders) from dashboard
      where.status = { not: "awaiting_payment" };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      standId,
      tableId,
      orderSource,
      orderType,
      items,
      customerNote,
      createdBy,
    } = body;

    // Calculate totals
    let subtotal = 0;
    const orderItems = items.map((item: any) => {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        note: item.note || null,
        subtotal: itemSubtotal,
      };
    });

    const tax = subtotal * 0.10; // 10% tax
    const totalAmount = subtotal + tax;

    // Create order
    const order = await prisma.order.create({
      data: {
        standId: standId || null,
        tableId: tableId || null,
        orderSource,
        orderType,
        // QR orders start as 'awaiting_payment' so they don't appear in kitchen yet
        status: orderSource === "qr" ? "awaiting_payment" : "pending",
        paymentStatus: "unpaid",
        subtotal,
        tax,
        totalAmount,
        customerNote: customerNote || null,
        createdBy,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // If stand was assigned, mark it as active
    if (standId) {
      await prisma.stand.update({
        where: { id: standId },
        data: { isActive: true, orderId: order.id },
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
