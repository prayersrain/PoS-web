import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.storeSettings.findUnique({
      where: { id: "global" },
    });

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: { id: "global", name: "PoS Warkop" },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    const settings = await prisma.storeSettings.upsert({
      where: { id: "global" },
      update: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        taxPercent: parseFloat(data.taxPercent || "10"),
        footerText: data.footerText,
      },
      create: {
        id: "global",
        name: data.name,
        address: data.address,
        phone: data.phone,
        taxPercent: parseFloat(data.taxPercent || "10"),
        footerText: data.footerText,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
