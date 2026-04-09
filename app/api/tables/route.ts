import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAllQRCodes, generatePrintablePDF } from "@/lib/qr-generator";

export async function GET() {
  try {
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
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "generate-qr") {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const qrCodes = await generateAllQRCodes(baseUrl);
      const pdfBuffer = await generatePrintablePDF(qrCodes);

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="qr-codes.pdf"',
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error generating QR codes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
