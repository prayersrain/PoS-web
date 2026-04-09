import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stands = await prisma.stand.findMany({
      orderBy: { standNumber: "asc" },
    });

    return NextResponse.json(stands);
  } catch (error) {
    console.error("Error fetching stands:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Find first inactive stand
    const availableStand = await prisma.stand.findFirst({
      where: { isActive: false },
      orderBy: { standNumber: "asc" },
    });

    if (!availableStand) {
      return NextResponse.json({ error: "No stands available" }, { status: 400 });
    }

    // Mark stand as active
    const stand = await prisma.stand.update({
      where: { id: availableStand.id },
      data: { isActive: true },
    });

    return NextResponse.json(stand);
  } catch (error) {
    console.error("Error assigning stand:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
