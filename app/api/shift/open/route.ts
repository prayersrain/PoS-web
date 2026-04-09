import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { cashStart } = await request.json();

    const shift = await prisma.shift.create({
      data: {
        openedBy: "system",
        cashStart,
        status: "open",
      },
    });

    return NextResponse.json(shift);
  } catch (error) {
    console.error("Error opening shift:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
