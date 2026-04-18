import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get orders for a specific table (customer-facing, no auth required)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;

    if (!tableId) {
      return NextResponse.json({ error: "Table ID required" }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: {
        tableId,
        status: { not: "cancelled" },
      },
      orderBy: { createdAt: "desc" },
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
    console.error("Error fetching table orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
