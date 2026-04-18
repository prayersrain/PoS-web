import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    await prisma.stand.update({
      where: { id },
      data: { isActive: false, currentOrderId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error releasing stand:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
