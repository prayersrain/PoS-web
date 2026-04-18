"use client";

import { useState } from "react";
import { X, Printer, Check } from "lucide-react";
import { Receipt, printStyles } from "@/components/shared/Receipt";

interface Order {
  id: string;
  standId: string | null;
  tableId: string | null;
  orderSource: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  queueNumber: string | null;
  subtotal: number;
  tax: number;
  totalAmount: number;
  customerNote: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    menuItemId: string;
    quantity: number;
    note: string | null;
    subtotal: number;
    menuItem: { name: string };
  }>;
  stand?: { standNumber: number };
  table?: { tableNumber: string };
}

interface PaymentModalProps {
  order: Order;
  cashierName: string;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export function PaymentModal({ order, cashierName, onClose, onPaymentComplete }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "debit" | "qris">("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change = cashReceivedNum - order.totalAmount;

  const handlePayment = async () => {
    if (paymentMethod === "cash" && cashReceivedNum < order.totalAmount) {
      alert("Uang yang diterima kurang!");
      return;
    }

    setProcessing(true);
    try {
      // Update order status
      await fetch(`/api/orders/${order.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending" }),
      });

      // Update payment
      await fetch(`/api/orders/${order.id}/payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: "paid",
          paymentMethod,
          paidAt: new Date().toISOString(),
        }),
      });

      // Release stand if dine-in
      if (order.standId) {
        await fetch(`/api/stands/${order.standId}/release`, { method: "POST" });
      }

      setShowReceipt(true);
      onPaymentComplete();
    } catch (e) {
      console.error("Payment error:", e);
      alert("Gagal memproses pembayaran");
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (showReceipt) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <style>{printStyles}</style>
        <div className="bg-zinc-800 rounded-lg w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b border-zinc-700 no-print">
            <h2 className="text-lg font-semibold text-white">Pembayaran Berhasil</h2>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-400" />
              </div>
            </div>

            {/* Receipt */}
            <div className="receipt-print bg-white p-4 rounded mb-4">
              <Receipt
                order={order as any}
                paymentMethod={paymentMethod}
                cashierName={cashierName}
              />
            </div>

            <div className="flex gap-3 no-print">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" />
                Cetak Nota
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <style>{printStyles}</style>
      <div className="bg-zinc-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <h2 className="text-xl font-bold text-white">Proses Pembayaran</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-zinc-700/50 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Pesanan</span>
              <span className="text-white">#{order.id.slice(-6).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Tipe</span>
              <span className="text-white capitalize">{order.orderType === "dine-in" ? "Makan di Tempat" : "Bawa Pulang"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Lokasi</span>
              <span className="text-white">
                {order.orderType === "dine-in" 
                  ? (order.stand ? `Stand #${order.stand.standNumber}` : (order.table ? order.table.tableNumber : '-'))
                  : "Bawa Pulang"}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="text-center">
            <p className="text-zinc-400 text-sm">Total Tagihan</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(order.totalAmount)}</p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`py-3 rounded-lg font-medium transition-colors ${
                  paymentMethod === "cash"
                    ? "bg-green-500 text-white"
                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                💵 Tunai
              </button>
              <button
                onClick={() => setPaymentMethod("debit")}
                className={`py-3 rounded-lg font-medium transition-colors ${
                  paymentMethod === "debit"
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                💳 Debit
              </button>
              <button
                onClick={() => setPaymentMethod("qris")}
                className={`py-3 rounded-lg font-medium transition-colors ${
                  paymentMethod === "qris"
                    ? "bg-purple-500 text-white"
                    : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                }`}
              >
                📱 QRIS
              </button>
            </div>
          </div>

          {/* Cash Input */}
          {paymentMethod === "cash" && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Uang yang Diterima
              </label>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="Masukkan jumlah"
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
              />
              {cashReceivedNum > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Total:</span>
                    <span className="text-white">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Received:</span>
                    <span className="text-white">{formatCurrency(cashReceivedNum)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-green-400">Kembalian:</span>
                    <span className={change >= 0 ? "text-green-400" : "text-red-400"}>
                      {formatCurrency(Math.abs(change))}
                    </span>
                  </div>
                  {change < 0 && (
                    <p className="text-red-400 text-sm">⚠️ Uang tidak cukup</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* QRIS Note */}
          {paymentMethod === "qris" && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <p className="text-purple-400 text-sm">
                📱 Pelanggan akan scan kode QRIS dari ponsel mereka. Gunakan ini untuk pelanggan yang membayar via QRIS.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handlePayment}
            disabled={
              processing ||
              (paymentMethod === "cash" && cashReceivedNum < order.totalAmount)
            }
            className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {processing ? "Memproses..." : "Konfirmasi Pembayaran"}
          </button>
        </div>
      </div>
    </div>
  );
}
