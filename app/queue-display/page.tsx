"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock } from "lucide-react";

interface Order {
  id: string;
  queueNumber: string | null;
  status: string;
  orderType: string;
  createdAt: string;
}

export default function QueueDisplay() {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(
        data.filter(
          (o: Order) =>
            o.orderType === "take-away" &&
            o.status !== "served" &&
            o.status !== "cancelled"
        )
      );
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-5 shadow-sm">
        <div className="flex items-center justify-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
            <span className="text-xl">☕</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WARKOEM PUL</h1>
            <p className="text-sm text-gray-500">Take-Away Queue Status</p>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto">
        {/* Ready Orders */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700">Ready to Pick Up</h2>
            <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-bold">
              {ready.length}
            </span>
          </div>
          {ready.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No orders ready yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {ready.map((order) => (
                <div
                  key={order.id}
                  className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 text-center shadow-lg animate-pulse"
                >
                  <span className="text-4xl font-bold text-green-700">
                    {order.queueNumber}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preparing Orders */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-blue-700">Being Prepared</h2>
            <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-bold">
              {preparing.length}
            </span>
          </div>
          {preparing.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No orders being prepared</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {preparing.map((order) => (
                <div
                  key={order.id}
                  className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6 text-center"
                >
                  <span className="text-4xl font-bold text-blue-700">
                    {order.queueNumber}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
