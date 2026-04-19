"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, X, Search, Star, Home, Receipt, Monitor, ChevronRight, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useOrderUpdates } from "@/hooks/useOrderUpdates";
import { siteConfig } from "@/lib/site-config";
import { useNotification } from "@/components/Notification";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  image: string | null;
  isAvailable: boolean;
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  note: string;
}

interface TableInfo {
  tableNumber: string;
  isQREnabled: boolean;
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
  const searchParams = useSearchParams();
  const { showNotification, confirmAction } = useNotification();
  const router = useRouter();
  const tableId = params.tableId as string;
  const qrCode = searchParams.get("qr");

  // State
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'orders' | 'cart'>('home');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTableAndMenu();
  }, [tableId]); // Re-fetch if tableId changes

  const fetchTableAndMenu = async () => {
    try {
      // Validate table
      const tableRes = await fetch("/api/tables");
      if (tableRes.ok) {
        const tables = await tableRes.json();
        if (Array.isArray(tables)) {
          const table = tables.find((t: any) => t.id === tableId);
          if (!table) {
            setError("Invalid table. Please scan a valid QR code.");
            setLoading(false);
            return;
          }
          setTableInfo({ tableNumber: table.tableNumber, isQREnabled: table.isQREnabled });
        }
      }

      // Fetch menu
      const menuRes = await fetch("/api/menu");
      if (menuRes.ok) {
        const data = await menuRes.json();
        setMenuItems(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to load:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const res = await fetch(`/api/orders/table/${tableId}`);
      if (res.ok) {
        const data = await res.json();
        setMyOrders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    }
  };

  useOrderUpdates(() => {
    fetchMyOrders();
  });

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchMyOrders();
    }
  }, [activeTab]);

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
  const cartTax = Math.round(cartTotal * 0.03 * 100) / 100;
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
        setCart([]); 
        setOrderId(order.id);
        showNotification("Pesanan diterima! Dapur akan segera menyiapkannya.", "success");
      }
    } catch (e: any) {
      console.error("Failed to submit order:", e);
      showNotification(e.message || "Gagal membuat pesanan. Silakan coba lagi.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    confirmAction({
      title: "Batalkan Pesanan?",
      message: "Pesanan yang sudah dibatalkan tidak dapat dikembalikan. Apakah Anda yakin?",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/orders/${orderId}/cancel`, {
            method: "POST",
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to cancel order");
          }

          showNotification("Pesanan berhasil dibatalkan", "success");
          fetchMyOrders();
        } catch (e: any) {
          console.error("Failed to cancel order:", e);
          showNotification(e.message || "Gagal membatalkan pesanan. Silakan hubungi kasir.", "error");
        }
      }
    });
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
    return item.isAvailable && matchesSearch;
  });

  const popularItems = menuItems.filter((item) => item.isAvailable).slice(0, 6);

  if (orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] p-8 text-center max-w-sm w-full shadow-2xl border border-gray-100/50">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Order Confirmed!</h1>
          <p className="text-gray-500 mb-8 font-medium">
            Your order has been received and sent to the kitchen.
          </p>
          <div className="flex flex-col gap-3">
            <button
               onClick={() => router.push(`/payment/${orderId}?tableId=${tableId}`)}
               className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.98]"
             >
               Bayar Sekarang
             </button>
            <button
              onClick={() => {
                setOrderId(null);
                setActiveTab('orders');
              }}
              className="px-6 py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl font-bold transition-all active:scale-[0.98]"
            >
              View My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==== Tab Views ====

  const renderHomeTab = () => (
    <div className="pb-36 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Premium */}
      <header className="bg-white px-5 pt-6 pb-4 rounded-b-[1.8rem] shadow-sm border-b border-gray-100/50 z-10 relative">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-black text-indigo-600 tracking-tight">{siteConfig.name}</h1>
            <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Table {tableInfo?.tableNumber || tableId?.toUpperCase()}
            </p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner filter drop-shadow-sm border border-indigo-100/50">
            <Monitor className="w-5 h-5" />
          </div>
        </div>
      </header>

      {/* Category Slider */}
      <div className="mt-6 mb-1 px-5">
        <h2 className="text-base font-black text-gray-900 mb-2 tracking-tight">Categories</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide snap-x">
        <div className="w-2 flex-shrink-0"></div>
        <button
          onClick={() => setActiveCategory("all")}
          className={`snap-start px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeCategory === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Menu
        </button>
        {categoryOrder.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`snap-start px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeCategory === cat
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className="text-sm">{categoryLabels[cat].icon}</span>
            {categoryLabels[cat].label}
          </button>
        ))}
      </div>

      {/* Popular Items Horizontal List */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 tracking-tight">
             Popular Choices <Star className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-sm" /> 
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide snap-x">
          {popularItems.map((item) => (
            <div key={`pop-${item.id}`} className="snap-start flex-shrink-0 w-40 bg-white rounded-[1.5rem] border border-gray-50 shadow-sm hover:shadow-xl p-3.5 transition-all relative overflow-hidden group">
               <div className="absolute top-0 right-0 -mr-8 -mt-8 w-20 h-20 bg-indigo-50 rounded-full blur-2xl opacity-40 group-hover:bg-indigo-100 transition-colors"></div>
               
               <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-2xl mb-3 border-[3px] border-white shadow-sm ring-1 ring-gray-100/50">
                 {categoryLabels[item.category]?.icon}
               </div>
               <div className="relative z-10">
                 <h3 className="font-bold text-gray-900 leading-tight mb-1 truncate text-sm">{item.name}</h3>
                 <p className="text-indigo-600 font-extrabold text-[13px] mb-3">{formatCurrency(item.price)}</p>
                 <button 
                  onClick={() => addToCart(item)}
                  className="w-full py-2 bg-gray-50/80 hover:bg-indigo-50 text-gray-900 hover:text-indigo-600 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5 active:scale-95 border border-gray-100/50">
                  <Plus className="w-3.5 h-3.5" strokeWidth={3}/> Tambah
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu List */}
      <div id="menu-grid" className="px-5 mt-4 space-y-10">
        {categoryOrder.map((cat) => {
          // Filter if category is selected, otherwise show all categories (but only available items)
          if (activeCategory !== "all" && activeCategory !== cat) return null;

          const items = menuItems.filter((i) => i.category === cat && i.isAvailable);
          if (items.length === 0) return null;
          return (
            <div key={cat} id={`cat-${cat}`} className="scroll-mt-6">
              <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2 tracking-tight">
                <span className="text-xl drop-shadow-sm">{categoryLabels[cat].icon}</span>
                {categoryLabels[cat].label}
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {items.map((item) => {
                  const cartItem = cart.find((c) => c.menuItemId === item.id);
                  return (
                    <div key={item.id} className="bg-white rounded-[1.2rem] p-3.5 border border-gray-50 shadow-sm flex gap-3.5 active:scale-[0.98] transition-transform">
                       {item.image ? (
                         <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                       ) : (
                         <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center text-3xl flex-shrink-0 shadow-inner">
                           {categoryLabels[cat].icon}
                         </div>
                       )}
                       <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900 text-[15px] leading-snug line-clamp-2">{item.name}</h3>
                            {item.description && <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 font-medium">{item.description}</p>}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-extrabold text-indigo-600 text-sm">{formatCurrency(item.price)}</span>
                            {cartItem ? (
                              <div className="flex items-center bg-gray-100/80 backdrop-blur-sm rounded-full p-0.5 h-8 shadow-inner">
                                <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 flex items-center justify-center bg-white rounded-full text-gray-700 shadow-sm active:scale-90 transition-transform"><Minus className="w-3.5 h-3.5" strokeWidth={3}/></button>
                                <span className="text-xs font-bold w-7 text-center">{cartItem.quantity}</span>
                                <button onClick={() => addToCart(item)} className="w-7 h-7 flex items-center justify-center bg-indigo-600 rounded-full text-white shadow-sm active:scale-90 transition-transform"><Plus className="w-3.5 h-3.5" strokeWidth={3}/></button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(item)} className="h-8 px-4 bg-gray-50 hover:bg-indigo-50 text-gray-900 hover:text-indigo-700 rounded-full text-xs font-bold flex items-center justify-center shadow-sm border border-gray-100/50 active:scale-95 transition-all">
                                Tambah
                              </button>
                            )}
                          </div>
                       </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );

  const renderSearchTab = () => (
    <div className="min-h-screen bg-gray-50 px-5 pt-6 pb-28 animate-in fade-in zoom-in-95 duration-300">
      <h1 className="text-xl font-black text-gray-900 mb-4 tracking-tight">Discovery</h1>
      <div className="relative mb-6 sticky top-4 z-10 group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-indigo-400 drop-shadow-sm transition-transform group-focus-within:scale-110" strokeWidth={2.5} />
        </div>
        <input
          type="text"
          autoFocus
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Lagi pengen apa?"
          className="w-full pl-11 pr-11 py-3 bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg shadow-gray-200/40 rounded-2xl text-gray-900 font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all caret-indigo-600"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X className="w-3.5 h-3.5" strokeWidth={3} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {searchQuery ? (
           filteredItems.length > 0 ? (
             filteredItems.map(item => {
                const cartItem = cart.find((c) => c.menuItemId === item.id);
                return (
                  <div key={item.id} className="bg-white rounded-2xl p-3 border border-gray-50 shadow-sm flex gap-3.5 items-center animate-in slide-in-from-bottom-2">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                           {categoryLabels[item.category]?.icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate mb-0.5 text-sm">{item.name}</h3>
                      <p className="font-extrabold text-indigo-600 text-xs">{formatCurrency(item.price)}</p>
                    </div>
                    <div>
                      {cartItem ? (
                         <div className="flex items-center bg-gray-100/80 backdrop-blur-sm rounded-full p-0.5 h-8 shadow-inner">
                           <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 flex items-center justify-center bg-white rounded-full text-gray-700 shadow-sm active:scale-90"><Minus className="w-3.5 h-3.5" strokeWidth={3}/></button>
                           <span className="text-xs font-bold w-6 text-center">{cartItem.quantity}</span>
                           <button onClick={() => addToCart(item)} className="w-7 h-7 flex items-center justify-center bg-indigo-600 rounded-full text-white shadow-sm active:scale-90"><Plus className="w-3.5 h-3.5" strokeWidth={3}/></button>
                         </div>
                      ) : (
                         <button onClick={() => addToCart(item)} className="h-8 px-4 bg-gray-50 hover:bg-indigo-50 text-gray-900 hover:text-indigo-700 rounded-full text-[11px] font-bold flex items-center shadow-sm border border-gray-100/50 active:scale-95 transition-all">
                           Tambah
                         </button>
                      )}
                    </div>
                  </div>
                )
             })
           ) : (
             <div className="text-center py-24 text-gray-400 animate-in fade-in">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 opacity-50">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-medium">No delicious matches found for <span className="font-bold text-gray-600">"{searchQuery}"</span></p>
             </div>
           )
        ) : (
          <div className="text-center py-24 text-gray-400 opacity-60">
               <p className="font-medium">Type something delicious to find...</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderOrdersTab = () => (
    <div className="min-h-screen bg-gray-50 px-5 pt-6 pb-28 animate-in slide-in-from-right-8 duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">My Orders</h1>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">Table {tableInfo?.tableNumber}</p>
        </div>
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-700 shadow-sm border border-gray-100">
          <Receipt className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-5">
        {myOrders.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-gray-100 border-dashed shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl shadow-inner">🍽️</div>
              <p className="text-gray-500 font-bold mb-5">You haven't ordered anything yet.</p>
              <button 
                onClick={() => setActiveTab('home')}
                className="px-8 py-3.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-full transition-colors active:scale-95 border border-indigo-100">
                Browse Menu
              </button>
           </div>
        ) : (
           myOrders.map((order) => {
             const statusColors: Record<string, string> = {
                pending: "bg-amber-100 text-amber-700 border-amber-200",
                preparing: "bg-blue-100 text-blue-700 border-blue-200",
                ready: "bg-green-100 text-green-700 border-green-200",
                served: "bg-gray-100 text-gray-700 border-gray-200",
                awaiting_payment: "bg-purple-100 text-purple-700 border-purple-200",
              };
              const statusLabels: Record<string, string> = {
                pending: "Waiting Kitchen",
                preparing: "Preparing",
                ready: "Ready",
                served: "Served",
                awaiting_payment: "Payment Pending",
              };

             const isExpanded = expandedOrders.has(order.id);
             const toggleExpand = () => {
                setExpandedOrders(prev => {
                   const next = new Set(prev);
                   if (next.has(order.id)) next.delete(order.id);
                   else next.add(order.id);
                   return next;
                });
             };

             // Determine step activity
             const s = order.status;
             const steps = [
               { id: 'pending', label: 'Order Placed', done: true }, // Always true if it exists
               { id: 'preparing', label: 'Preparing', done: s === 'preparing' || s === 'ready' || s === 'served' },
               { id: 'ready', label: 'Ready to Serve', done: s === 'ready' || s === 'served' },
               { id: 'served', label: 'Served', done: s === 'served' }
             ];

             return (
               <div key={order.id} className="bg-white rounded-[1.2rem] border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                 {/* Decorative Accent Line */}
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-indigo-400 to-indigo-600"></div>

                  <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 mb-0.5 tracking-wider uppercase">ORDER ID</p>
                      <p className="text-xs font-black text-gray-900 tracking-tight">#{order.id.slice(-6).toUpperCase()}</p>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                        statusColors[order.status] || "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-5">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-start text-sm">
                        <div className="flex gap-3">
                          <span className="font-black text-gray-900 w-5">{item.quantity}x</span>
                          <span className="font-semibold text-gray-600">{item.menuItem.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 border-dashed">
                    <span className="text-sm font-bold text-gray-500">Total Amount</span>
                    <span className="text-lg font-black text-indigo-600">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>

                  <button 
                    onClick={toggleExpand}
                    className="w-full mt-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm border border-gray-100">
                     {isExpanded ? 'Hide Tracker' : 'Track Order'}
                     {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                  </button>

                  {/* Dropdown Tracker */}
                  <div className={`mt-3 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}>
                     <div className="bg-white rounded-xl p-4 border border-gray-100 relative">
                        {/* Connecting Line background */}
                        <div className="absolute left-[27px] top-[30px] bottom-[30px] w-0.5 bg-gray-200"></div>
                        <div className="space-y-5 relative">
                           {steps.map((step, idx) => (
                              <div key={step.id} className="flex items-center gap-4">
                                 <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 transition-colors ${
                                    step.done ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-300 text-transparent"
                                 }`}>
                                    <CheckCircle className="w-3 h-3" />
                                 </div>
                                 <div className="flex-1">
                                    <p className={`text-sm font-bold ${step.done ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  {(order.status === 'pending' || order.status === 'awaiting_payment') && (
                     <button 
                      onClick={() => handleCancelOrder(order.id)}
                      className="mt-4 w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-red-100 active:scale-95 text-sm">
                        <X className="w-4 h-4"/> Cancel Order
                     </button>
                  )}

                  {order.status === 'awaiting_payment' && (
                     <button 
                      onClick={() => router.push(`/payment/${order.id}?tableId=${tableId}`)}
                      className="mt-5 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 active:scale-95">
                        Proceed to Payment <ChevronRight className="w-4 h-4"/>
                     </button>
                  )}
               </div>
             )
           })
        )}
      </div>
    </div>
  );

  const renderCartTab = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-[180px] animate-in slide-in-from-top-4 duration-300">
      <div className="px-5 pt-6 pb-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Keranjang</h1>
        <p className="text-xs font-bold text-indigo-600 mt-0.5">{cartCount} menu di dalam</p>
      </div>

      <div className="flex-1 px-5 py-6 space-y-4">
         {cart.length === 0 ? (
            <div className="text-center mt-12 animate-in fade-in zoom-in-95">
               <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                 <ShoppingCart className="w-10 h-10 text-gray-400" />
               </div>
               <h2 className="text-xl font-black text-gray-900 mb-2">Cart is thirsty & hungry</h2>
               <p className="text-gray-500 font-medium mb-8">Add something delicious from the menu.</p>
               <button 
                onClick={() => setActiveTab('home')}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/30 active:scale-95">
                Back to Menu
               </button>
            </div>
         ) : (
            cart.map((item) => (
               <div key={item.menuItemId} className="bg-white rounded-[1.2rem] p-3.5 border border-gray-50 shadow-sm flex flex-col gap-2.5">
                 <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 leading-tight mb-0.5 text-sm">{item.name}</h3>
                      <p className="font-extrabold text-indigo-600 text-xs">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center bg-gray-50 rounded-full p-0.5 border border-gray-100 shadow-inner">
                        <button onClick={() => removeFromCart(item.menuItemId)} className="w-7 h-7 flex items-center justify-center bg-white rounded-full text-gray-700 shadow-sm active:scale-90 transition-transform"><Minus className="w-3.5 h-3.5" strokeWidth={3}/></button>
                        <span className="text-xs font-black w-7 text-center">{item.quantity}</span>
                        <button onClick={() => addToCart(menuItems.find((m) => m.id === item.menuItemId)!)} className="w-7 h-7 flex items-center justify-center bg-indigo-600 rounded-full text-white shadow-sm active:scale-90 transition-transform"><Plus className="w-3.5 h-3.5" strokeWidth={3}/></button>
                    </div>
                 </div>
                 <div className="pt-2.5 border-t border-gray-50">
                    <div className="relative">
                       <input
                         type="text"
                         value={item.note}
                         onChange={(e) => updateNote(item.menuItemId, e.target.value)}
                         placeholder="Catatan..."
                         className="w-full text-xs py-2 px-3 bg-gray-50/50 border border-gray-100 rounded-lg text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all caret-indigo-600"
                       />
                    </div>
                 </div>
               </div>
            ))
         )}
      </div>

      {cart.length > 0 && (
         <div className="fixed bottom-[74px] left-0 right-0 bg-white border-t border-gray-100/80 px-5 pt-3.5 pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-20 rounded-t-[2.2rem]">
            <div className="space-y-1.5 mb-4 px-2">
               <div className="flex justify-between text-xs">
                 <span className="text-gray-500 font-bold">Subtotal</span>
                 <span className="text-gray-900 font-black">{formatCurrency(cartTotal)}</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-gray-500 font-bold">Tax (3%)</span>
                 <span className="text-gray-900 font-black">{formatCurrency(cartTax)}</span>
               </div>
            </div>
            <button 
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-xl shadow-black/20 flex items-center justify-between px-5 disabled:opacity-70 disabled:shadow-none active:scale-[0.98]"
            >
              <span className="text-base">{submitting ? 'Processing...' : 'Place Order'}</span>
              {!submitting && <span className="text-base font-black text-indigo-400">{formatCurrency(cartGrandTotal)}</span>}
            </button>
         </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-indigo-200">
      {error ? (
          <div className="flex items-center justify-center min-h-screen p-5">
             <div className="text-center p-8 bg-white rounded-[2rem] shadow-2xl max-w-sm w-full border border-gray-100">
               <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <X className="w-12 h-12 text-red-500" strokeWidth={2.5} />
               </div>
               <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Access Denied</h2>
               <p className="text-gray-500 font-medium mb-8 leading-relaxed">{error}</p>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 py-3 rounded-xl border border-gray-100 shadow-inner">Please scan valid QR</p>
             </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center min-h-screen">
             <div className="w-14 h-14 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6" />
             <p className="text-gray-400 font-bold tracking-wide animate-pulse uppercase text-sm">Loading Menu...</p>
          </div>
        ) : (
          <div className="relative h-full overflow-hidden">
            {/* Active Tab View Rendering */}
            <div className="h-full overflow-y-auto">
              {activeTab === 'home' && renderHomeTab()}
              {activeTab === 'search' && renderSearchTab()}
              {activeTab === 'orders' && renderOrdersTab()}
              {activeTab === 'cart' && renderCartTab()}
            </div>

            {/* Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] pb-safe rounded-t-[1.2rem]">
               <div className="flex justify-around items-center h-[72px] max-w-md mx-auto px-4 pb-1">
                 <button 
                   onClick={() => setActiveTab("home")} 
                   className="relative flex flex-col items-center justify-center w-[22%] h-full gap-0.5 group">
                   <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${activeTab === "home" ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}>
                     <Home className={`w-5 h-5 mb-0.5 transition-all duration-300 ${activeTab === "home" ? "scale-110 drop-shadow-sm" : "group-active:scale-95"}`} strokeWidth={activeTab === "home" ? 2.5 : 2} />
                     <span className={`text-[9px] font-bold tracking-wide transition-opacity ${activeTab === "home" ? "opacity-100" : "opacity-0 absolute"}`}>Menu</span>
                   </div>
                 </button>
                 <button 
                   onClick={() => setActiveTab("search")} 
                   className="relative flex flex-col items-center justify-center w-[22%] h-full gap-0.5 group">
                   <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${activeTab === "search" ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}>
                     <Search className={`w-5 h-5 mb-0.5 transition-all duration-300 ${activeTab === "search" ? "scale-110 drop-shadow-sm" : "group-active:scale-95"}`} strokeWidth={activeTab === "search" ? 2.5 : 2} />
                     <span className={`text-[9px] font-bold tracking-wide transition-opacity ${activeTab === "search" ? "opacity-100" : "opacity-0 absolute"}`}>Search</span>
                   </div>
                 </button>
                 <button 
                   onClick={() => setActiveTab("orders")} 
                   className="relative flex flex-col items-center justify-center w-[22%] h-full gap-0.5 group">
                   <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${activeTab === "orders" ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}>
                     <Receipt className={`w-5 h-5 mb-0.5 transition-all duration-300 ${activeTab === "orders" ? "scale-110 drop-shadow-sm" : "group-active:scale-95"}`} strokeWidth={activeTab === "orders" ? 2.5 : 2} />
                     <span className={`text-[9px] font-bold tracking-wide transition-opacity ${activeTab === "orders" ? "opacity-100" : "opacity-0 absolute"}`}>Orders</span>
                   </div>
                 </button>
                 <button 
                   onClick={() => setActiveTab("cart")} 
                   className="relative flex flex-col items-center justify-center w-[22%] h-full gap-0.5 group">
                   <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${activeTab === "cart" ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"}`}>
                     <div className="relative">
                       <ShoppingCart className={`w-5 h-5 mb-0.5 transition-all duration-300 ${activeTab === "cart" ? "scale-110 drop-shadow-sm" : "group-active:scale-95"}`} strokeWidth={activeTab === "cart" ? 2.5 : 2} />
                       {cartCount > 0 && (
                         <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white shadow-sm">
                           {cartCount}
                         </span>
                       )}
                     </div>
                     <span className={`text-[9px] font-bold tracking-wide transition-opacity ${activeTab === "cart" ? "opacity-100" : "opacity-0 absolute"}`}>Cart</span>
                   </div>
                 </button>
               </div>
             </div>
          </div>
        )}
    </div>
  );
}
