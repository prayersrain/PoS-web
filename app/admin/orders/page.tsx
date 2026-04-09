"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, X, Search, Package, Clock, CheckCircle } from "lucide-react";
import { getSessionClient } from "@/lib/auth";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
}

interface Stand {
  id: string;
  standNumber: number;
  isActive: boolean;
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  note: string;
}

interface Order {
  id: string;
  standId: string | null;
  tableId: string | null;
  orderSource: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  queueNumber: string | null;
  totalAmount: number;
  createdAt: string;
  items: any[];
}

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const action = searchParams.get("action");

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stands, setStands] = useState<Stand[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderType, setOrderType] = useState<"dine-in" | "take-away">("dine-in");
  const [selectedStand, setSelectedStand] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerNote, setCustomerNote] = useState("");
  const [showNewOrder, setShowNewOrder] = useState(action === "new-walkin" || action === "new-qr");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchMenu();
    fetchStands();
    fetchOrders();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      setMenuItems(data);
    } catch (e) {
      console.error("Failed to fetch menu:", e);
    }
  };

  const fetchStands = async () => {
    try {
      const res = await fetch("/api/stands");
      const data = await res.json();
      setStands(data);
    } catch (e) {
      console.error("Failed to fetch stands:", e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1, note: "" }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => c.menuItemId !== menuItemId);
    });
  };

  const updateNote = (menuItemId: string, note: string) => {
    setCart((prev) =>
      prev.map((c) => (c.menuItemId === menuItemId ? { ...c, note } : c))
    );
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    if (orderType === "dine-in" && !selectedStand) {
      alert("Please select a stand");
      return;
    }

    setSubmitting(true);
    try {
      const session = getSessionClient();
      if (!session) {
        alert("Session expired. Please login again.");
        return;
      }

      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standId: orderType === "dine-in" ? selectedStand : null,
          tableId: null,
          orderSource: "walk-in",
          orderType,
          items: cart.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            note: item.note,
          })),
          customerNote: customerNote || null,
          createdBy: session.id,
        }),
      });

      setCart([]);
      setSelectedStand("");
      setCustomerNote("");
      setShowNewOrder(false);
      fetchStands();
      fetchOrders();
      alert("Order created successfully!");
    } catch (e) {
      console.error("Failed to create order:", e);
      alert("Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTax = cartTotal * 0.10;
  const cartGrandTotal = cartTotal + cartTax;

  const availableStands = stands.filter((s) => !s.isActive);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "preparing":
        return <Package className="w-4 h-4 text-blue-600" />;
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
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
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.served}`}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage and create new orders</p>
        </div>
        <button
          onClick={() => setShowNewOrder(!showNewOrder)}
          className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-lg shadow-red-600/20 font-medium"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* New Order Modal */}
      {showNewOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">New Order</h2>
                <p className="text-sm text-gray-500 mt-1">Create a new walk-in order</p>
              </div>
              <button
                onClick={() => setShowNewOrder(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Order Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOrderType("dine-in")}
                    className={`py-4 rounded-xl font-semibold transition-all ${
                      orderType === "dine-in"
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    🍽️ Dine-in
                  </button>
                  <button
                    onClick={() => setOrderType("take-away")}
                    className={`py-4 rounded-xl font-semibold transition-all ${
                      orderType === "take-away"
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    🥡 Take-away
                  </button>
                </div>
              </div>

              {/* Stand Selection */}
              {orderType === "dine-in" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Stand
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                    {availableStands.map((stand) => (
                      <button
                        key={stand.id}
                        onClick={() => setSelectedStand(stand.id)}
                        className={`py-3 rounded-xl font-bold transition-all ${
                          selectedStand === stand.id
                            ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        #{stand.standNumber}
                      </button>
                    ))}
                  </div>
                  {availableStands.length === 0 && (
                    <p className="text-yellow-600 text-sm mt-3 bg-yellow-50 p-3 rounded-xl">
                      ⚠️ No stands available. Please wait for current orders to be served.
                    </p>
                  )}
                </div>
              )}

              {/* Menu Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Add Items ({cart.length} selected)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {menuItems.map((item) => {
                    const cartItem = cart.find((c) => c.menuItemId === item.id);
                    return (
                      <div
                        key={item.id}
                        className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div>
                          <p className="text-gray-900 text-sm font-medium">{item.name}</p>
                          <p className="text-red-600 text-sm font-semibold">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {cartItem ? (
                            <div className="flex items-center bg-white rounded-lg overflow-hidden border border-gray-200">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="p-2 text-gray-600 hover:bg-gray-100"
                              >
                                -
                              </button>
                              <span className="text-gray-900 w-8 text-center text-sm font-bold">{cartItem.quantity}</span>
                              <button
                                onClick={() => addToCart(item)}
                                className="p-2 text-red-600 hover:bg-red-50"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-gray-900 font-semibold mb-3">Cart Summary</h3>
                  <div className="space-y-2 mb-4">
                    {cart.map((item) => (
                      <div key={item.menuItemId} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-gray-900 text-sm">{item.name} × {item.quantity}</p>
                          <input
                            type="text"
                            placeholder="Note..."
                            value={item.note}
                            onChange={(e) => updateNote(item.menuItemId, e.target.value)}
                            className="mt-1 w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-900 placeholder-gray-400"
                          />
                        </div>
                        <span className="text-gray-900 text-sm font-medium ml-4">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-900">{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tax (10%)</span>
                      <span className="text-gray-900">{formatCurrency(cartTax)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                      <span className="text-gray-900">Total</span>
                      <span className="text-red-600">{formatCurrency(cartGrandTotal)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Note (optional)
                </label>
                <textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={2}
                  placeholder="Any special requests..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowNewOrder(false)}
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={submitting || cart.length === 0}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
              >
                {submitting ? "Creating..." : "Create Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Filters */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-2">
            {["all", "pending", "preparing", "ready", "served"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Orders */}
        <div className="divide-y divide-gray-50">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                      order.orderType === "dine-in" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {order.orderType === "dine-in" && order.standId
                        ? `S${order.standId.slice(-2)}`
                        : order.orderType === "take-away"
                        ? `Q${order.queueNumber}`
                        : `T${order.tableId?.slice(-2)}`}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">#{order.id.slice(-6).toUpperCase()}</p>
                      <p className="text-sm text-gray-500">
                        {order.items?.length || 0} items • {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      order.paymentStatus === "paid"
                        ? "bg-green-50 text-green-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}>
                      {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
