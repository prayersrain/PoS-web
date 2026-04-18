import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const history = searchParams.get("history") === "true";

    if (history) {
      const closedShifts = await prisma.shift.findMany({
        where: { status: "closed" },
        orderBy: { openedAt: "desc" },
        take: 20,
      });
      return NextResponse.json(closedShifts);
    }

    const openShift = await prisma.shift.findFirst({
      where: { status: "open" },
      orderBy: { openedAt: "desc" },
    });

    return NextResponse.json(openShift);
  } catch (error) {
    console.error("Error fetching shift:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
