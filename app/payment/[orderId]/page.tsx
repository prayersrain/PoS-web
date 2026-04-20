"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Script from "next/script";
import { CheckCircle, Shield, CreditCard, QrCode, ArrowLeft, Clock, Wallet } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { useNotification } from "@/components/Notification";

declare global {
  interface Window {
    snap: any;
  }
}

interface OrderItem {
  id: string;
  menuItem: { name: string };
  quantity: number;
  note: string | null;
  subtotal: number;
}

interface Order {
  id: string;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  paymentId: string | null;
  tableId: string | null;
  items?: OrderItem[];
  createdAt: string;
}

export default function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { showNotification } = useNotification();
  const orderId = params.orderId as string;
  const tableId = searchParams.get("tableId");

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [snapLoaded, setSnapLoaded] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, []);

  useEffect(() => {
    if (!order || paymentStarted) return;

    const interval = setInterval(() => {
      fetchOrder();
    }, 3000);

    return () => clearInterval(interval);
  }, [order, paymentStarted]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        console.error("Failed to fetch order:", res.status);
        return;
      }
      const data = await res.json();
      setOrder(data);
      if (data.paymentStatus === "paid" && data.status !== "awaiting_payment") {
        setPaid(true);
      }
    } catch (e) {
      console.error("Failed to fetch order:", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setCreatingPayment(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (!res.ok) {
        showNotification(data.error || "Gagal membuat pembayaran", "error");
        return;
      }

      setPaymentToken(data.token);
      setPaymentUrl(data.redirectUrl);
      setPaymentStarted(true);

      // If Snap JS is loaded, use embedded payment
      if (window.snap && data.token) {
        window.snap.pay(data.token, {
          onSuccess: function () {
            // Payment successful, start polling for order update
            setPaymentStarted(false);
            const pollInterval = setInterval(async () => {
              const pollRes = await fetch(`/api/orders/${orderId}`);
              if (pollRes.ok) {
                const pollData = await pollRes.json();
                if (pollData.paymentStatus === "paid") {
                  clearInterval(pollInterval);
                  setPaid(true);
                }
              }
            }, 2000);
          },
          onPending: function () {
            // Payment pending, keep polling
            setPaymentStarted(false);
            const pollInterval = setInterval(async () => {
              const pollRes = await fetch(`/api/orders/${orderId}`);
              if (pollRes.ok) {
                const pollData = await pollRes.json();
                if (pollData.paymentStatus === "paid") {
                  clearInterval(pollInterval);
                  setPaid(true);
                }
              }
            }, 2000);
          },
          onError: function () {
            showNotification("Pembayaran gagal. Silakan coba lagi.", "error");
            setPaymentStarted(false);
          },
          onClose: function () {
            // Customer closed the popup
            setPaymentStarted(false);
          },
        });
      } else if (data.redirectUrl) {
        // Fallback: redirect to Midtrans payment page
        window.location.href = data.redirectUrl;
      }
    } catch (e: any) {
      console.error("Payment error:", e);
      showNotification("Gagal memproses pembayaran: " + e.message, "error");
    } finally {
      setCreatingPayment(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 pb-20">

      {paid && order ? (
        <div className="flex-1">
          {/* Header */}
          <div className="bg-indigo-600 p-6 text-center text-white -mx-4 -mt-4 mb-6">
            <h1 className="text-xl font-bold">{siteConfig.name}</h1>
            <p className="text-indigo-200 text-sm mt-1">Order Confirmed</p>
          </div>

          {/* Success Card */}
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-4">Your order has been paid and will be prepared shortly.</p>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-green-600 mb-1">Amount Paid</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(order.totalAmount)}</p>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Your Order
              </h3>
            </div>

            {/* Order Items */}
            <div className="p-5 space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-start py-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {item.menuItem.name}
                    </p>
                    <p className="text-sm text-gray-500">x{item.quantity}</p>
                    {item.note && (
                      <p className="text-xs text-amber-600 mt-1">📝 {item.note}</p>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="p-5 bg-gray-50 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-indigo-600">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Back to Menu */}
          <div className="mt-6">
            <button
              onClick={() => {
                if (tableId) {
                  window.location.href = `/menu/${tableId}`;
                }
              }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/25"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Menu
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden self-center mx-auto">
          {/* Header */}
          <div className="bg-indigo-600 p-6 text-center text-white">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold">Secure Payment</h1>
            <p className="text-indigo-200 text-sm mt-1">Order #{orderId?.slice(-6).toUpperCase()}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Amount */}
            <div className="bg-gray-50 rounded-xl p-5 text-center">
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(order?.totalAmount || 0)}
              </p>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Choose Payment Method</p>

              {/* QRIS Button */}
              <button
                onClick={handlePay}
                disabled={creatingPayment || paid}
                className="w-full p-4 bg-white border-2 border-gray-200 hover:border-indigo-300 rounded-xl flex items-center gap-4 transition-all group disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <QrCode className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-900">QRIS</p>
                  <p className="text-xs text-gray-500">Scan with any e-wallet</p>
                </div>
                <span className="text-gray-400">→</span>
              </button>

              {/* Bank Transfer Button */}
              <button
                onClick={handlePay}
                disabled={creatingPayment || paid}
                className="w-full p-4 bg-white border-2 border-gray-200 hover:border-blue-300 rounded-xl flex items-center gap-4 transition-all group disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-900">Bank Transfer</p>
                  <p className="text-xs text-gray-500">BCA, Mandiri, BNI, BRI</p>
                </div>
                <span className="text-gray-400">→</span>
              </button>

              {/* E-Wallet Button */}
              <button
                onClick={handlePay}
                disabled={creatingPayment || paid}
                className="w-full p-4 bg-white border-2 border-gray-200 hover:border-green-300 rounded-xl flex items-center gap-4 transition-all group disabled:opacity-50"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-900">E-Wallet</p>
                  <p className="text-xs text-gray-500">GoPay, ShopeePay, OVO</p>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>

            {/* Status */}
            {paymentStarted && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-700 text-sm text-center">
                  ⏳ Processing payment... Complete the payment to continue.
                </p>
              </div>
            )}

            {/* Loading */}
            {creatingPayment && (
              <div className="text-center py-4">
                <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Creating payment...</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Secured by Midtrans • Your payment is encrypted
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
