import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { paymentStatus, paymentMethod, paidAt } = await request.json();

    const order = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus,
        paymentMethod: paymentMethod || null,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
