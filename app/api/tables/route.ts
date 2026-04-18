import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAllQRCodes, generatePrintablePDF } from "@/lib/qr-generator";
import { requireAuth } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "generate-qr") {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
        console.warn(
          "⚠️  QR codes will point to localhost. For phone access, set NEXT_PUBLIC_APP_URL in .env.local to your PC's local IP (e.g., http://192.168.1.100:3000)"
        );
      }
      const qrCodes = await generateAllQRCodes(baseUrl);
      const pdfBuffer = await generatePrintablePDF(qrCodes);

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="qr-codes.pdf"',
        },
      });
    }

    const tables = await prisma.table.findMany({
      orderBy: { tableNumber: "asc" },
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in POST /api/tables:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
