"use client";

import React from "react";
import { siteConfig } from "@/lib/site-config";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  note?: string | null;
}

interface ReceiptProps {
  orderId: string;
  customerName?: string;
  tableNumber?: string | number | null;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  cashReceived?: number;
  change?: number;
  createdBy: string;
  createdAt: string | Date;
  settings?: {
    name: string;
    address?: string | null;
    phone?: string | null;
    footerText?: string | null;
    taxPercent?: number;
  };
}

export const PrintableReceipt = React.forwardRef<HTMLDivElement, ReceiptProps>((props, ref) => {
  const {
    orderId,
    tableNumber,
    items,
    subtotal,
    tax,
    total,
    paymentMethod,
    cashReceived,
    change,
    createdBy,
    createdAt,
    settings
  } = props;

  // Use dynamic settings if provided, fallback to siteConfig
  const storeName = settings?.name || siteConfig.name;
  const storeAddress = settings?.address || siteConfig.contact.address;
  const storePhone = settings?.phone || siteConfig.contact.phone;
  const footerText = settings?.footerText || siteConfig.receipt.footer;

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      ref={ref}
      className="print-only"
      style={{
        width: siteConfig.receipt.width,
        padding: "4mm",
        backgroundColor: "white",
        color: "black",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: "12px",
        lineHeight: "1.2",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "4mm" }}>
        <div style={{ fontSize: "16px", fontWeight: "bold", textTransform: "uppercase" }}>{storeName}</div>
        {storeAddress && <div style={{ fontSize: "10px" }}>{storeAddress}</div>}
        {storePhone && <div style={{ fontSize: "10px" }}>WA: {storePhone}</div>}
      </div>

      <div style={{ borderTop: "1px dashed black", margin: "2mm 0" }}></div>

      {/* Info */}
      <div style={{ fontSize: "10px", marginBottom: "2mm" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>ID: {orderId.slice(-6).toUpperCase()}</span>
          <span>{tableNumber ? `Lokasi: ${tableNumber}` : "Takeaway"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Staff: {createdBy}</span>
        </div>
        <div>Tgl: {formatDate(createdAt)}</div>
      </div>

      <div style={{ borderTop: "1px dashed black", margin: "2mm 0" }}></div>

      {/* Items */}
      <div style={{ marginBottom: "2mm" }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: "2mm" }}>
            <div style={{ fontWeight: "bold" }}>{item.name}</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{item.quantity} x {formatCurrency(item.price)}</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
            {item.note && <div style={{ fontSize: "9px", fontStyle: "italic" }}>* {item.note}</div>}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px dashed black", margin: "2mm 0" }}></div>

      {/* Totals */}
      <div style={{ fontSize: "11px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Pajak ({settings?.taxPercent || 10}%):</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px", marginTop: "1mm" }}>
          <span>TOTAL:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed black", margin: "2mm 0" }}></div>

      {/* Payment */}
      <div style={{ fontSize: "10px", marginBottom: "4mm" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Bayar ({paymentMethod.toUpperCase()}):</span>
          <span>{cashReceived ? formatCurrency(cashReceived) : formatCurrency(total)}</span>
        </div>
        {cashReceived !== undefined && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Kembali:</span>
            <span>{formatCurrency(change || 0)}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "10px", marginTop: "4mm" }}>
        <div>{footerText}</div>
        <div style={{ marginTop: "2mm" }}>--- Terimakasih ---</div>
      </div>
    </div>
  );
});

PrintableReceipt.displayName = "PrintableReceipt";
