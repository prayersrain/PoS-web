import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
