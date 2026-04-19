import { Order, OrderItem, TAX_RATE } from "@/types";

interface ReceiptProps {
  order: Order & { items: OrderItem[] };
  paymentMethod: string;
  cashierName?: string;
}

export function Receipt({ order, paymentMethod, cashierName }: ReceiptProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="receipt-content" style={{ fontFamily: "monospace", fontSize: "12px", maxWidth: "300px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "16px", fontWeight: "bold" }}>WARKOEM PUL</div>
        <div style={{ fontSize: "10px" }}>Jl. Contoh Alamat No. 123</div>
        <div style={{ fontSize: "10px" }}>Telp: 0812-3456-7890</div>
        <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      </div>

      {/* Order Info */}
      <div style={{ marginBottom: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>No:</span>
          <span>#{order.id.slice(-6).toUpperCase()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Tgl:</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Kasir:</span>
          <span>{cashierName || "Admin"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Lokasi:</span>
          <span>
            {order.orderType === "dine-in" 
              ? (order.stand ? `Stand #${order.stand.standNumber}` : (order.table ? order.table.tableNumber : '-'))
              : `Antrian #${order.queueNumber || "-"}`}
          </span>
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

      {/* Items */}
      <div style={{ marginBottom: "8px" }}>
        {order.items.map((item) => (
          <div key={item.id} style={{ marginBottom: "4px" }}>
            <div>{item.menuItem?.name || "Item"}</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>
                {item.quantity} x {formatCurrency(item.subtotal / item.quantity)}
              </span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
            {item.note && (
              <div style={{ fontSize: "10px", fontStyle: "italic" }}>Note: {item.note}</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

      {/* Totals */}
      <div style={{ marginBottom: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal:</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        {order.tax > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Pajak ({(TAX_RATE * 100).toFixed(0)}%):</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
        )}
        <div style={{ borderTop: "1px solid #000", margin: "4px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px" }}>
          <span>TOTAL:</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      <div style={{ marginBottom: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Bayar:</span>
          <span style={{ textTransform: "uppercase" }}>{paymentMethod}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
      <div style={{ textAlign: "center", marginTop: "10px" }}>
        <div>Terima Kasih!</div>
        <div style={{ fontSize: "10px" }}>@warkoempul</div>
      </div>
    </div>
  );
}

// Print-specific styles
export const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .receipt-print, .receipt-print * {
      visibility: visible;
    }
    .receipt-print {
      position: absolute;
      left: 0;
      top: 0;
      width: 80mm;
    }
    .no-print {
      display: none !important;
    }
  }
`;
