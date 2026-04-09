"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  Coffee,
  Package,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { getSessionClient } from "@/lib/auth";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  isAvailable: boolean;
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  note: string;
}

interface Stand {
  id: string;
  standNumber: number;
  isActive: boolean;
}

const categories = [
  { value: "all", label: "Semua", icon: "📋" },
  { value: "nasi", label: "Nasi", icon: "🍚" },
  { value: "signature_noodle", label: "Noodle", icon: "🍜" },
  { value: "mie", label: "Mie", icon: "🍝" },
  { value: "snack", label: "Snack", icon: "🍟" },
  { value: "ketan", label: "Ketan", icon: "🍡" },
  { value: "pisang", label: "Pisang", icon: "🍌" },
  { value: "roti_bakar", label: "Roti", icon: "🍞" },
  { value: "minuman", label: "Minuman", icon: "🥤" },
];

export default function POSPage() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stands, setStands] = useState<Stand[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [orderType, setOrderType] = useState<"dine-in" | "take-away">("dine-in");
  const [selectedStand, setSelectedStand] = useState<string>("");
  const [customerNote, setCustomerNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchMenu();
    fetchStands();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      setMenuItems(data.filter((i: MenuItem) => i.isAvailable));
    } catch (e) {
      console.error("Failed to fetch menu:", e);
    } finally {
      setLoading(false);
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

  const clearCart = () => {
    setCart([]);
    setCustomerNote("");
    setSelectedStand("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.10;
  const total = subtotal + tax;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (orderType === "dine-in" && !selectedStand) {
      alert("Pilih stand/meja terlebih dahulu!");
      return;
    }

    setSubmitting(true);
    try {
      const session = getSessionClient();
      const res = await fetch("/api/orders", {
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
          createdBy: session?.id || "system",
        }),
      });

      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Gagal membuat order");

      setLastOrderId(order.id);
      setShowPaymentModal(true);
    } catch (e: any) {
      alert(e.message || "Gagal membuat order");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    clearCart();
    fetchStands();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
          <span className="text-gray-500">Memuat POS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-65px)] bg-gray-50 overflow-hidden">
      {/* LEFT PANEL: Menu */}
      <div className="flex-1 flex flex-col border-r border-gray-200">
        {/* Search & Categories */}
        <div className="p-4 bg-white border-b border-gray-200 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.value
                    ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const inCart = cart.find((c) => c.menuItemId === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className={`bg-white rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md active:scale-[0.98] ${
                    inCart ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-red-200"
                  }`}
                >
                  <div className="w-full h-24 bg-gray-100 rounded-xl mb-3 flex items-center justify-center text-3xl">
                    {categories.find((c) => c.value === item.category)?.icon || "🍽️"}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">{item.name}</h3>
                  <p className="text-red-600 font-bold">{formatCurrency(item.price)}</p>
                  {inCart && (
                    <div className="mt-2 flex items-center justify-center gap-2 bg-red-600 text-white text-xs font-bold py-1.5 rounded-lg">
                      <span>+</span> {inCart.quantity}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {filteredItems.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Menu tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Order Summary */}
      <div className="w-[400px] bg-white flex flex-col shadow-xl">
        {/* Order Type & Stand */}
        <div className="p-5 border-b border-gray-100 space-y-4">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setOrderType("dine-in")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                orderType === "dine-in" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              🍽️ Dine-in
            </button>
            <button
              onClick={() => setOrderType("take-away")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                orderType === "take-away" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              🥡 Take-away
            </button>
          </div>

          {orderType === "dine-in" && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Pilih Stand</label>
              <div className="grid grid-cols-5 gap-2">
                {stands.filter((s) => !s.isActive).map((stand) => (
                  <button
                    key={stand.id}
                    onClick={() => setSelectedStand(stand.id)}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      selectedStand === stand.id
                        ? "bg-red-600 text-white shadow-md"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    #{stand.standNumber}
                  </button>
                ))}
                {stands.filter((s) => !s.isActive).length === 0 && (
                  <p className="col-span-5 text-xs text-yellow-600 bg-yellow-50 p-2 rounded-lg">
                    ⚠️ Semua stand terpakai
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Belum ada pesanan</p>
              <p className="text-xs mt-1">Klik menu untuk menambahkan</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.menuItemId} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
                  </div>
                  <p className="font-bold text-gray-900 text-sm ml-2">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => removeFromCart(item.menuItemId)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => addToCart(menuItems.find((m) => m.id === item.menuItemId)!)}
                      className="p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      const note = prompt("Catatan untuk item ini:", item.note);
                      if (note !== null) {
                        setCart((prev) =>
                          prev.map((c) => (c.menuItemId === item.menuItemId ? { ...c, note } : c))
                        );
                      }
                    }}
                    className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {item.note ? "Edit Note" : "Add Note"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Pay */}
        <div className="p-5 border-t border-gray-200 bg-gray-50 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal ({itemCount} item)</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Pajak (10%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span className="text-red-600">{formatCurrency(total)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={submitting || cart.length === 0}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/25 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Bayar {formatCurrency(total)}
              </>
            )}
          </button>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Batal Order
            </button>
          )}
        </div>
      </div>

      {/* Payment Modal Placeholder */}
      {showPaymentModal && lastOrderId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Order Berhasil!</h2>
            <p className="text-gray-500 mb-6">
              Order #{lastOrderId.slice(-6).toUpperCase()} siap dibayar.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => {
                  router.push(`/payment/${lastOrderId}`);
                  setShowPaymentModal(false);
                }}
                className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                QRIS / Online
              </button>
              <button
                onClick={() => {
                  // Handle cash payment directly
                  router.push(`/admin/orders?paid=${lastOrderId}`);
                  setShowPaymentModal(false);
                }}
                className="py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Banknote className="w-4 h-4" />
                Cash
              </button>
            </div>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
