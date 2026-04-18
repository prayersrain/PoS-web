import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    const date = dateParam ? new Date(dateParam) : new Date();
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    // Get orders for the day
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
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

    // Calculate stats
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const paidOrders = orders.filter((o) => o.paymentStatus === "paid").length;
    const unpaidOrders = orders.filter((o) => o.paymentStatus === "unpaid").length;
    const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;

    // Top items
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = itemMap.get(item.menuItemId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal;
        } else {
          itemMap.set(item.menuItemId, {
            name: item.menuItem.name,
            quantity: item.quantity,
            revenue: item.subtotal,
          });
        }
      });
    });

    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Payment methods breakdown
    const paymentMap = new Map<string, { count: number; total: number }>();
    orders
      .filter((o) => o.paymentStatus === "paid")
      .forEach((order) => {
        const method = order.paymentMethod || "unknown";
        const existing = paymentMap.get(method);
        if (existing) {
          existing.count += 1;
          existing.total += order.totalAmount;
        } else {
          paymentMap.set(method, { count: 1, total: order.totalAmount });
        }
      });

    const paymentMethods = Array.from(paymentMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
    }));

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      paidOrders,
      unpaidOrders,
      cancelledOrders,
      topItems,
      paymentMethods,
    });
  } catch (error) {
    console.error("Error fetching daily report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
