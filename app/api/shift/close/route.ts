import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cashEnd } = await request.json();

    const openShift = await prisma.shift.findFirst({
      where: { status: "open" },
      orderBy: { openedAt: "desc" },
    });

    if (!openShift) {
      return NextResponse.json({ error: "No open shift" }, { status: 400 });
    }

    const expectedCash = openShift.cashStart;

    const shift = await prisma.shift.update({
      where: { id: openShift.id },
      data: {
        cashEnd,
        expectedCash,
        status: "closed",
        closedAt: new Date(),
      },
    });

    return NextResponse.json(shift);
  } catch (error) {
    console.error("Error closing shift:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
