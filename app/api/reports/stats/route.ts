import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's orders
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          not: "cancelled",
        },
      },
    });

    // Calculate stats
    const stats = {
      total: todayOrders.length,
      pending: todayOrders.filter((o) => o.status === "pending").length,
      preparing: todayOrders.filter((o) => o.status === "preparing").length,
      ready: todayOrders.filter((o) => o.status === "ready").length,
      served: todayOrders.filter((o) => o.status === "served").length,
      todayRevenue: todayOrders
        .filter((o) => o.paymentStatus === "paid")
        .reduce((sum, o) => sum + o.totalAmount, 0),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
