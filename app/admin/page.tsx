"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useOrderUpdates } from "@/hooks/useOrderUpdates";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  Plus,
  QrCode,
  TrendingUp,
  Users,
  Package,
  ArrowUpRight,
} from "lucide-react";

interface OrderStats {
  total: number;
  pending: number;
  preparing: number;
  ready: number;
  served: number;
  todayRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    preparing: 0,
    ready: 0,
    served: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleOrderUpdate = useCallback(() => {
    fetchStats();
    fetchRecentOrders();
  }, []);

  useOrderUpdates(handleOrderUpdate);

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/reports/stats");
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const res = await fetch("/api/orders?limit=10");
      if (!res.ok) return;
      const data = await res.json();
      setRecentOrders(data);
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      preparing: "bg-blue-50 text-blue-700 border-blue-200",
      ready: "bg-green-50 text-green-700 border-green-200",
      served: "bg-gray-50 text-gray-600 border-gray-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.served}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    if (paymentStatus === "paid") {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">Paid</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">Unpaid</span>;
  };

  const statsCards = [
    {
      label: "Pending Orders",
      value: stats.pending,
      icon: Clock,
      color: "yellow",
      bg: "bg-yellow-50",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      label: "Preparing",
      value: stats.preparing,
      icon: Package,
      color: "blue",
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Ready",
      value: stats.ready,
      icon: CheckCircle,
      color: "green",
      bg: "bg-green-50",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      label: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      icon: TrendingUp,
      color: "red",
      bg: "bg-red-50",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of today&apos;s operations</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/orders?action=new-qr"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl transition-all hover:shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            QR Order
          </Link>
          <Link
            href="/admin/orders?action=new-walkin"
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-lg shadow-red-600/20 hover:shadow-red-600/30"
          >
            <Plus className="w-4 h-4" />
            New Order
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`${card.bg} rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.iconBg} p-3 rounded-xl`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                {card.color === "red" && (
                  <span className="text-green-600 text-xs font-medium flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +12%
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color === "red" ? "text-gray-900" : `text-${card.color}-700`}`}>
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
              Loading orders...
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No orders yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Stand/Table</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-medium text-gray-900">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        order.orderSource === "qr"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-blue-50 text-blue-700"
                      }`}>
                        {order.orderSource === "qr" ? "QR" : "Walk-in"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.orderType === "dine-in"
                        ? `Stand #${order.standId?.slice(-2) || "-"}`
                        : order.orderType === "take-away"
                        ? `Queue ${order.queueNumber || "-"}`
                        : `Table ${order.tableId?.slice(-2) || "-"}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4">{getPaymentBadge(order.paymentStatus)}</td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
