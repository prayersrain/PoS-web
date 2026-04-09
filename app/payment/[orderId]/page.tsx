"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Shield, CreditCard, QrCode } from "lucide-react";

interface Order {
  id: string;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  paymentId: string | null;
  items?: any[];
}

export default function PaymentPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, []);

  useEffect(() => {
    if (!order || order.paymentStatus === "paid") return;

    const interval = setInterval(() => {
      fetchOrder();
    }, 3000);

    return () => clearInterval(interval);
  }, [order]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      setOrder(data);
      if (data.paymentStatus === "paid") {
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
        alert(data.error || "Failed to create payment");
        return;
      }

      setPaymentToken(data.token);
      setPaymentUrl(data.redirectUrl);

      // Open Midtrans payment page in new window
      window.open(data.redirectUrl, "_blank");
    } catch (e) {
      console.error("Payment error:", e);
      alert("Failed to create payment");
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
          <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
          <span className="text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-500 mb-6">
            Your order has been paid and will be prepared shortly.
          </p>
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-600 mb-1">Amount Paid</p>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(order?.totalAmount || 0)}
            </p>
          </div>
          <button
            onClick={() => {
              setPaid(false);
              fetchOrder();
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
          >
            Order Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 p-6 text-center text-white">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold">Secure Payment</h1>
          <p className="text-red-200 text-sm mt-1">Order #{orderId?.slice(-6).toUpperCase()}</p>
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
              disabled={creatingPayment}
              className="w-full p-4 bg-white border-2 border-gray-200 hover:border-red-300 rounded-xl flex items-center gap-4 transition-all group disabled:opacity-50"
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
              disabled={creatingPayment}
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
              disabled={creatingPayment}
              className="w-full p-4 bg-white border-2 border-gray-200 hover:border-green-300 rounded-xl flex items-center gap-4 transition-all group disabled:opacity-50"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <QrCode className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900">E-Wallet</p>
                <p className="text-xs text-gray-500">GoPay, ShopeePay, OVO</p>
              </div>
              <span className="text-gray-400">→</span>
            </button>
          </div>

          {/* Status */}
          {paymentUrl && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-700 text-sm text-center">
                ⏳ Waiting for payment... Payment page opened in new tab.
              </p>
            </div>
          )}

          {/* Loading */}
          {creatingPayment && (
            <div className="text-center py-4">
              <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-2" />
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
    </div>
  );
}
