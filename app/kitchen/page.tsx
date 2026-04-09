"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Clock, ChefHat, CheckCircle, AlertCircle } from "lucide-react";
import { useOrderUpdates } from "@/hooks/useOrderUpdates";
import { getSessionClient, clearSessionClient } from "@/lib/auth";

interface Order {
  id: string;
  standId: string | null;
  tableId: string | null;
  orderSource: string;
  orderType: string;
  status: string;
  queueNumber: string | null;
  totalAmount: number;
  customerNote: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  note: string | null;
  subtotal: number;
  menuItem: { name: string };
}

function OrderCard({ order, actionLabel, actionColor, onAction }: any) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const getElapsedColor = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    if (diff > 30) return "text-red-600";
    if (diff > 15) return "text-yellow-600";
    return "text-gray-400";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
            order.orderType === "dine-in" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
          }`}>
            {order.orderType === "dine-in" && order.standId
              ? `S${order.standId.slice(-2)}`
              : order.orderType === "take-away"
              ? `Q${order.queueNumber}`
              : `T${order.tableId?.slice(-2)}`}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {order.orderType === "dine-in" && order.standId
                ? `Stand #${order.standId.slice(-2)}`
                : order.orderType === "take-away"
                ? `Queue ${order.queueNumber}`
                : `Table ${order.tableId?.slice(-2)}`}
            </p>
            <p className={`text-xs ${getElapsedColor(order.createdAt)}`}>
              {formatTime(order.createdAt)} • {order.orderSource === "qr" ? "QR" : "Walk-in"}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-4 space-y-2">
        {order.items.map((item: OrderItem) => (
          <div key={item.id} className="flex items-start gap-2">
            <span className="bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5">
              {item.quantity}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.menuItem.name}</p>
              {item.note && (
                <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  <AlertCircle className="w-3 h-3" />
                  <span className="truncate">{item.note}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      {onAction && (
        <div className="p-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => onAction(order.id)}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all active:scale-[0.98] ${
              actionColor === "blue"
                ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                : actionColor === "green"
                ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
                : "bg-gray-600 hover:bg-gray-700 shadow-lg shadow-gray-600/20"
            }`}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

function Column({ title, icon, orders, color, status, onAction }: any) {
  const colorMap: Record<string, any> = {
    yellow: {
      border: "border-yellow-200",
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      countBg: "bg-yellow-100",
      countText: "text-yellow-700",
    },
    blue: {
      border: "border-blue-200",
      bg: "bg-blue-50",
      text: "text-blue-700",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      countBg: "bg-blue-100",
      countText: "text-blue-700",
    },
    green: {
      border: "border-green-200",
      bg: "bg-green-50",
      text: "text-green-700",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      countBg: "bg-green-100",
      countText: "text-green-700",
    },
  };

  const theme = colorMap[color];

  return (
    <div className={`rounded-2xl border ${theme.border} ${theme.bg} flex flex-col h-full`}>
      <div className={`p-4 border-b ${theme.border} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`${theme.iconBg} p-2.5 rounded-xl`}>
            {icon}
          </div>
          <h2 className={`text-lg font-bold ${theme.text}`}>{title}</h2>
        </div>
        <span className={`${theme.countBg} ${theme.countText} px-3 py-1 rounded-full text-sm font-bold`}>
          {orders.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className={`${theme.iconBg} w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3`}>
              {icon}
            </div>
            <p className={`text-sm ${theme.text} font-medium`}>No orders</p>
          </div>
        ) : (
          orders.map((order: Order) => (
            <OrderCard
              key={order.id}
              order={order}
              actionLabel={
                status === "pending"
                  ? "Start Preparing"
                  : status === "preparing"
                  ? "Mark Ready"
                  : "Mark Served"
              }
              actionColor={
                status === "pending"
                  ? "blue"
                  : status === "preparing"
                  ? "green"
                  : "zinc"
              }
              onAction={onAction}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const router = useRouter();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [preparingOrders, setPreparingOrders] = useState<Order[]>([]);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();

      setPendingOrders(data.filter((o: Order) => o.status === "pending"));
      setPreparingOrders(data.filter((o: Order) => o.status === "preparing"));
      setReadyOrders(data.filter((o: Order) => o.status === "ready"));
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderUpdate = useCallback(() => {
    fetchOrders();
  }, []);

  useOrderUpdates(handleOrderUpdate);

  useEffect(() => {
    const session = getSessionClient();
    if (!session) {
      router.push("/login");
    } else if (session.role !== "kitchen") {
      router.push("/admin");
    } else {
      setUser({ name: session.name });
      fetchOrders();
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchOrders();
    } catch (e) {
      console.error("Failed to update order:", e);
    }
  };

  const handleLogout = () => {
    clearSessionClient();
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
          <span className="text-gray-500">Loading Kitchen...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Kitchen Display</h1>
            <p className="text-xs text-gray-500">Warkoem Pul</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.name}</span>
          <button
            onClick={handleLogout}
            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Columns Grid */}
      <main className="flex-1 p-4 grid grid-cols-3 gap-4 overflow-hidden">
        <Column
          title="Pending"
          icon={<Clock className="w-5 h-5 text-yellow-600" />}
          orders={pendingOrders}
          color="yellow"
          status="pending"
          onAction={(id: string) => updateOrderStatus(id, "preparing")}
        />
        <Column
          title="Preparing"
          icon={<ChefHat className="w-5 h-5 text-blue-600" />}
          orders={preparingOrders}
          color="blue"
          status="preparing"
          onAction={(id: string) => updateOrderStatus(id, "ready")}
        />
        <Column
          title="Ready"
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          orders={readyOrders}
          color="green"
          status="ready"
          onAction={(id: string) => updateOrderStatus(id, "served")}
        />
      </main>
    </div>
  );
}
