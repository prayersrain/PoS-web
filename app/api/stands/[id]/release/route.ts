import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.stand.update({
      where: { id },
      data: { isActive: false, orderId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error releasing stand:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
