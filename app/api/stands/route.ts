import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Atomically claim the first inactive stand to prevent race condition
    const result = await prisma.stand.updateMany({
      where: { isActive: false },
      data: { isActive: true },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "No stands available" }, { status: 400 });
    }

    // Fetch the stand we just activated
    const stand = await prisma.stand.findFirst({
      where: { isActive: true, currentOrderId: null },
      orderBy: { standNumber: "asc" },
    });

    if (!stand) {
      return NextResponse.json({ error: "No stands available" }, { status: 400 });
    }

    return NextResponse.json(stand);
  } catch (error) {
    console.error("Error assigning stand:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
