import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";
import { broadcastOrderUpdate } from "@/app/api/sse/orders/route";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        stand: true,
        table: true,
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

    // Validate items data and look up prices from DB
    let subtotal = 0;
    const validatedItems: any[] = [];
    for (const item of items) {
      if (!item.menuItemId || !item.quantity || item.quantity < 1) {
        return NextResponse.json({ error: "Invalid item data" }, { status: 400 });
      }

      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem || !menuItem.isAvailable) {
        return NextResponse.json({ error: `Menu item ${item.menuItemId} not found or unavailable` }, { status: 400 });
      }

      const itemSubtotal = menuItem.price * item.quantity;
      subtotal += itemSubtotal;
      validatedItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        note: item.note || null,
        subtotal: itemSubtotal,
        price: menuItem.price,
      });
    }

    const taxRate = orderSource === "qr" ? 0.03 : 0;
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const totalAmount = Math.round((subtotal + tax) * 100) / 100;

    // Generate queue number for take-away orders
    const queueNumber = orderType === "take-away"
      ? await generateQueueNumber()
      : null;

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
        queueNumber,
        subtotal,
        tax,
        totalAmount,
        customerNote: customerNote || null,
        createdBy,
        items: {
          create: validatedItems,
        },
      },
      include: {
        stand: true,
        table: true,
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
        data: { isActive: true, currentOrderId: order.id },
      });
      // Re-fetch order to include newly linked stand data
      const finalOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          stand: true,
          table: true,
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });
      if (finalOrder) {
        broadcastOrderUpdate({ type: "new_order", order: finalOrder });
        return NextResponse.json(finalOrder);
      }
    }

    broadcastOrderUpdate({ type: "new_order", order });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Generate auto-incrementing queue number for take-away orders (resets daily)
async function generateQueueNumber(): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const count = await prisma.order.count({
    where: {
      orderType: "take-away",
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  return String(count + 1).padStart(3, "0");
}
