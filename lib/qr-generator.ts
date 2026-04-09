import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { prisma } from "./prisma";
import fs from "fs";
import path from "path";

export async function generateQRCodeForTable(tableId: string, baseUrl: string) {
  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table) throw new Error("Table not found");

  const url = `${baseUrl}/menu/${table.id}?qr=${table.qrCode}`;

  // Generate QR code as data URL (PNG)
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  return { qrDataUrl, url, tableNumber: table.tableNumber };
}

export async function generateAllQRCodes(baseUrl: string) {
  const tables = await prisma.table.findMany({ orderBy: { tableNumber: "asc" } });
  const results: Array<{ tableNumber: string; qrDataUrl: string; url: string }> = [];

  for (const table of tables) {
    const url = `${baseUrl}/menu/${table.id}?qr=${table.qrCode}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    results.push({ tableNumber: table.tableNumber, qrDataUrl, url });
  }

  return results;
}

export async function generatePrintablePDF(qrCodes: Array<{ tableNumber: string; qrDataUrl: string }>) {
  // A4 size: 210mm x 297mm
  // Layout: 3 columns x 5 rows = 15 QR codes per page
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const qrSize = 50; // mm
  const cols = 3;
  const rows = 5;
  const marginX = 10;
  const marginY = 10;
  const gapX = 5;
  const gapY = 5;

  qrCodes.forEach((qr, index) => {
    const page = Math.floor(index / (cols * rows));
    const positionOnPage = index % (cols * rows);
    const col = positionOnPage % cols;
    const row = Math.floor(positionOnPage / cols);

    if (page > 0 && positionOnPage === 0) {
      doc.addPage();
    }

    const x = marginX + col * (qrSize + gapX);
    const y = marginY + row * (qrSize + gapY + 10); // +10 for label

    // Add QR code
    doc.addImage(qr.qrDataUrl, "PNG", x, y, qrSize, qrSize);

    // Add table number label
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(qr.tableNumber, x + qrSize / 2, y + qrSize + 7, { align: "center" });
  });

  return doc.output("arraybuffer");
}

export async function generateAndSaveAllQRCodes(baseUrl: string, outputDir: string) {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tables = await prisma.table.findMany({ orderBy: { tableNumber: "asc" } });

  for (const table of tables) {
    const url = `${baseUrl}/menu/${table.id}?qr=${table.qrCode}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
    });

    // Convert data URL to buffer and save
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const filePath = path.join(outputDir, `${table.tableNumber}.png`);
    fs.writeFileSync(filePath, buffer);
  }

  return tables.length;
}
