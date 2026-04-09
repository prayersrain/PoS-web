"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, X, Search, Star } from "lucide-react";

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

const categoryLabels: Record<string, { label: string; icon: string }> = {
  nasi: { label: "Nasi", icon: "🍚" },
  signature_noodle: { label: "Signature", icon: "🍜" },
  mie: { label: "Mie", icon: "🍝" },
  snack: { label: "Snack", icon: "🍟" },
  ketan: { label: "Ketan", icon: "🍡" },
  pisang: { label: "Pisang", icon: "🍌" },
  roti_bakar: { label: "Roti Bakar", icon: "🍞" },
  minuman: { label: "Minuman", icon: "🥤" },
};

const categoryOrder = [
  "nasi",
  "signature_noodle",
  "mie",
  "snack",
  "ketan",
  "pisang",
  "roti_bakar",
  "minuman",
];

export default function CustomerMenuPage() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      setMenuItems(data);
    } catch (e) {
      console.error("Failed to fetch menu:", e);
    } finally {
      setLoading(false);
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

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartTax = cartTotal * 0.10;
  const cartGrandTotal = cartTotal + cartTax;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          orderSource: "qr",
          orderType: "dine-in",
          items: cart.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            note: item.note,
          })),
          createdBy: "qr-customer",
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create order");
      }

      const order = await res.json();
      if (order.id) {
        router.push(`/payment/${order.id}`);
      }
    } catch (e: any) {
      console.error("Failed to submit order:", e);
      alert(e.message || "Failed to create order. Please try again.");
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

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    return item.isAvailable && matchesSearch && matchesCategory;
  });

  const groupedMenu = categoryOrder.map((cat) => ({
    category: cat,
    ...categoryLabels[cat],
    items: filteredItems.filter((item) => item.category === cat),
  }));

  const popularItems = menuItems.filter((item) => item.isAvailable).slice(0, 6);

  if (orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Submitted!</h1>
          <p className="text-gray-500 mb-6">
            Your order has been received and will be prepared shortly.
          </p>
          <button
            onClick={() => {
              setOrderId(null);
              fetchMenu();
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
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-red-600">Warkoem Pul</h1>
              <p className="text-sm text-gray-500">Table {tableId?.toUpperCase()}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-lg">☕</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search menu..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === "all"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {categoryOrder.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {categoryLabels[cat].icon} {categoryLabels[cat].label}
            </button>
          ))}
        </div>
      </header>

      {/* Popular Items */}
      {activeCategory === "all" && !searchQuery && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-bold text-gray-900">Popular</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {popularItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="flex-shrink-0 w-36 bg-white rounded-xl border border-gray-200 p-3 text-left hover:shadow-md transition-shadow"
              >
                <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-2xl">
                  {categoryLabels[item.category]?.icon}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-sm font-bold text-red-600 mt-1">{formatCurrency(item.price)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <main className="p-4 space-y-6">
        {loading ? (
          <div className="text-center text-gray-400 py-12">
            <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
            Loading menu...
          </div>
        ) : groupedMenu.length > 0 ? (
          groupedMenu.map(
            ({ category, label, icon, items }) =>
              items.length > 0 && (
                <div key={category}>
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>{icon}</span>
                    {label}
                    <span className="text-sm font-normal text-gray-400">({items.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((item) => {
                      const cartItem = cart.find((c) => c.menuItemId === item.id);
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                              </div>
                              {item.description && (
                                <p className="text-xs text-gray-500 mb-2">{item.description}</p>
                              )}
                              <p className="text-lg font-bold text-red-600">
                                {formatCurrency(item.price)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {cartItem ? (
                                <div className="flex items-center bg-red-50 rounded-lg overflow-hidden">
                                  <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-2 text-red-600 hover:bg-red-100 transition-colors"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="text-red-600 font-bold w-8 text-center text-sm">
                                    {cartItem.quantity}
                                  </span>
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="p-2 text-red-600 hover:bg-red-100 transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          </div>
                          {cartItem && (
                            <input
                              type="text"
                              placeholder="Add note..."
                              value={cartItem.note}
                              onChange={(e) => updateNote(item.id, e.target.value)}
                              className="mt-3 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
          )
        ) : (
          <div className="text-center text-gray-400 py-12">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No items found</p>
          </div>
        )}
      </main>

      {/* Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-30">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors shadow-lg shadow-red-600/25"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-red-600 text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span>View Cart ({cartCount})</span>
            <span className="ml-2 text-red-200">•</span>
            <span>{formatCurrency(cartGrandTotal)}</span>
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl">
            {/* Cart Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
                <p className="text-sm text-gray-500">{cartCount} items</p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.map((item) => (
                <div key={item.menuItemId} className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                    {item.note && (
                      <p className="text-xs text-amber-600 mt-1 bg-amber-50 px-2 py-1 rounded inline-block">
                        📝 {item.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="p-2 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-gray-900 font-bold w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          addToCart(menuItems.find((m) => m.id === item.menuItemId)!)
                        }
                        className="p-2 text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-semibold text-gray-900 w-20 text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Footer */}
            <div className="p-5 border-t border-gray-100 space-y-3 bg-gray-50 rounded-b-2xl">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900 font-medium">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (10%)</span>
                <span className="text-gray-900 font-medium">{formatCurrency(cartTax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total</span>
                <span className="text-red-600">{formatCurrency(cartGrandTotal)}</span>
              </div>
              <button
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 shadow-lg shadow-red-600/25 mt-2"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Submit Order"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
