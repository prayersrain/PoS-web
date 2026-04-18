"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, Trash2, CreditCard, Wallet, QrCode, Banknote, Monitor, Printer, Plus as PlusIcon, Minus as MinusIcon } from "lucide-react";
import { getSessionClient } from "@/lib/auth";
import { useOrderUpdates } from "@/hooks/useOrderUpdates";
import { siteConfig } from "@/lib/site-config";
import { PrintableReceipt } from "@/components/PrintableReceipt";
import { useNotification } from "@/components/Notification";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Script from "next/script";

declare global {
  interface Window {
    snap: any;
  }
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
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

interface Stand {
  id: string;
  standNumber: number;
  isActive: boolean;
}

interface Table {
  id: string;
  tableNumber: string;
}

const categoryLabels: Record<string, string> = {
  nasi: "Nasi",
  signature_noodle: "Mie Spesial",
  mie: "Mie",
  snack: "Snack",
  ketan: "Ketan",
  pisang: "Pisang",
  roti_bakar: "Roti Bakar",
  minuman: "Minuman",
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

export default function POSPage() {
  const router = useRouter();
  const { showNotification } = useNotification();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stands, setStands] = useState<Stand[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState<{ id: string; type: "stand" | "table" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "debit" | "credit" | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  useOrderUpdates(() => {
    fetchData();
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    }
  };

  const fetchData = async () => {
    try {
      const [menuRes, standsRes, tablesRes] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/stands"),
        fetch("/api/tables"),
      ]);

      if (menuRes.ok) {
        const data = await menuRes.json();
        setMenuItems(Array.isArray(data) ? data.filter((i: MenuItem) => i.isAvailable) : []);
      }
      if (standsRes.ok) {
        const data = await standsRes.json();
        setStands(Array.isArray(data) ? data : []);
      }
      if (tablesRes.ok) {
        const data = await tablesRes.json();
        setTables(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch data:", e);
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

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) =>
          c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0);
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
  };

  const updateNote = (menuItemId: string, note: string) => {
    setCart((prev) =>
      prev.map((c) => (c.menuItemId === menuItemId ? { ...c, note } : c))
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.10 * 100) / 100;
  const total = subtotal + tax;
  const change = paymentMethod === "cash" ? Math.round((parseFloat(cashReceived) - total) * 100) / 100 : 0;

  const availableStands = stands.filter((s) => !s.isActive);

  const handleCheckout = async () => {
    if (!paymentMethod) return;
    if (paymentMethod === "cash" && parseFloat(cashReceived) < total) return;

    setSubmitting(true);
    try {
      const session = getSessionClient();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standId: selectedLocation?.type === "stand" ? selectedLocation.id : null,
          tableId: selectedLocation?.type === "table" ? selectedLocation.id : null,
          orderSource: "walk-in",
          orderType: "dine-in",
          items: cart.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            note: item.note || null,
          })),
          customerNote: null,
          createdBy: session?.username || "kasir",
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create order");
      }

      const order = await res.json();

      if (paymentMethod === "qris") {
        const payRes = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        });

        if (!payRes.ok) {
          const error = await payRes.json();
          throw new Error(error.error || "Gagal membuat transaksi Midtrans");
        }

        const { token } = await payRes.json();

        if (window.snap) {
          window.snap.pay(token, {
            onSuccess: () => {
              showNotification("Pembayaran QRIS Berhasil!", "success");
              setLastOrder({
                ...order,
                paymentMethod: paymentMethod,
              });
              setOrderSuccess(true);
              setCart([]);
              setCashReceived("");
              setPaymentMethod(null);
            },
            onPending: () => {
              showNotification("Menunggu pembayaran QRIS...", "info");
              setLastOrder({
                ...order,
                paymentMethod: paymentMethod,
              });
              setOrderSuccess(true);
              setCart([]);
            },
            onError: (err: any) => {
              console.error("Midtrans Error:", err);
              showNotification("Pembayaran Gagal!", "error");
            },
            onClose: () => {
              showNotification("Jendela pembayaran ditutup", "warning");
              setLastOrder({
                ...order,
                paymentMethod: paymentMethod,
              });
              setOrderSuccess(true);
              setCart([]);
            }
          });
        }
      } else {
        await fetch(`/api/orders/${order.id}/payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethod }),
        });

        setLastOrder({
          ...order,
          paymentMethod: paymentMethod,
          cashReceived: paymentMethod === "cash" ? parseFloat(cashReceived) : undefined,
          change: paymentMethod === "cash" ? change : undefined,
        });
        setOrderSuccess(true);
        showNotification("Pesanan berhasil dibuat!", "success");
      }
    } catch (e: any) {
      showNotification(e.message || "Gagal membuat pesanan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewOrder = () => {
    setCart([]);
    setSelectedLocation(null);
    setShowPayment(false);
    setPaymentMethod(null);
    setCashReceived("");
    setOrderSuccess(false);
  };

  const handlePrint = () => {
    if (receiptRef.current) {
      window.print();
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
    return matchesSearch && matchesCategory;
  });

  const groupedMenu = categoryOrder.map((cat) => ({
    category: cat,
    label: categoryLabels[cat],
    items: filteredItems.filter((item) => item.category === cat),
  }));

  if (orderSuccess && lastOrder) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-6">
        <div>
          <PrintableReceipt
            ref={receiptRef}
            orderId={lastOrder.id}
            tableNumber={
              selectedLocation?.type === "table" 
                ? tables.find(t => t.id === selectedLocation.id)?.tableNumber 
                : stands.find(s => s.id === selectedLocation?.id)?.standNumber
            }
            items={cart.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
              note: item.note
            }))}
            subtotal={subtotal}
            tax={tax}
            total={total}
            paymentMethod={paymentMethod || "cash"}
            cashReceived={paymentMethod === "cash" ? parseFloat(cashReceived) : undefined}
            change={change}
            createdBy={lastOrder.createdBy}
            createdAt={lastOrder.createdAt}
            settings={settings}
          />
        </div>

        <div className="bg-white rounded-3xl p-10 text-center max-w-lg shadow-2xl border border-gray-100">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Monitor className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pesanan Berhasil!</h1>
          <p className="text-gray-500 mb-8 text-lg">Pesanan #{lastOrder.id.slice(-6).toUpperCase()} telah dikirim ke dapur.</p>
          
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={handlePrint}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
            >
              <Printer className="w-6 h-6" />
              Cetak Nota ( थर्मल 58mm )
            </button>
            <button
              onClick={handleNewOrder}
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all active:scale-[0.98]"
            >
              Order Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 h-[calc(100vh-8rem)] bg-background flex overflow-hidden fade-in animate-in">
      {/* LEFT: Menu Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-background border-r border-border">
        {/* Search + Category Header */}
        <div className="p-4 border-b border-border flex-shrink-0 bg-card">
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu..."
              className="w-full pl-11 pr-4 h-12 bg-background border-border rounded-xl text-foreground focus:ring-primary focus-visible:ring-primary font-medium shadow-sm transition-all text-base"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Button
              variant={activeCategory === "all" ? "default" : "secondary"}
              onClick={() => setActiveCategory("all")}
              className={`rounded-xl font-bold whitespace-nowrap shadow-sm h-10 px-6 ${activeCategory === "all" ? "" : "text-muted-foreground hover:text-foreground"}`}
            >
              Semua
            </Button>
            {categoryOrder.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "secondary"}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-xl font-bold whitespace-nowrap shadow-sm h-10 px-6 ${activeCategory === cat ? "" : "text-muted-foreground hover:text-foreground"}`}
              >
                {categoryLabels[cat]}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Grid Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="font-medium">Memuat menu...</p>
            </div>
          ) : (
            <div className="space-y-8 pb-10">
              {groupedMenu.map(({ category, label, items }) => (
                items.length > 0 && (
                  <div key={category}>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-8 h-px bg-gray-200" />
                      {label}
                      <span className="bg-gray-200 text-gray-500 px-2 py-0.5 rounded text-[10px]">{items.length}</span>
                    </h3>
                    <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                      {items.map((item) => {
                        const inCart = cart.find((c) => c.menuItemId === item.id);
                        return (
                          <Card
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className={`cursor-pointer border-2 transition-all duration-300 relative group overflow-hidden bg-card ${
                              inCart
                                ? "border-primary shadow-md shadow-primary/10 ring-2 ring-primary/20 scale-[1.02]"
                                : "border-border hover:border-primary/50 hover:shadow-lg shadow-sm"
                            }`}
                          >
                            {item.image && (
                              <img src={item.image} alt={item.name} className="w-full h-28 object-cover transition-transform duration-500 group-hover:scale-110" />
                            )}
                            <CardContent className={`p-4 ${!item.image ? 'pt-5' : ''}`}>
                              <p className="font-bold text-foreground text-sm leading-tight mb-1 group-hover:text-primary transition-colors truncate">{item.name}</p>
                              <p className="text-lg font-black text-primary">{formatCurrency(item.price)}</p>
                            </CardContent>
                            
                            {inCart ? (
                              <Badge className="absolute top-3 right-3 w-8 h-8 flex flex-col items-center justify-center rounded-full text-xs font-black shadow-lg shadow-primary/30 pointer-events-none p-0 aspect-square">
                                {inCart.quantity}
                              </Badge>
                            ) : (
                              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 p-1.5 rounded-full text-primary">
                                <PlusIcon className="w-5 h-5" />
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart Column */}
      <div className="w-[420px] flex-shrink-0 p-4 pl-0">
        <div className="bg-card rounded-2xl shadow-xl border border-border flex flex-col h-full overflow-hidden">
          {/* Cart Header / Stand Selection */}
          <div className="p-4 border-b border-border bg-muted/20">
            <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-3">Pesanan Baru</h2>
            <select
              value={selectedLocation ? `${selectedLocation.type}:${selectedLocation.id}` : ""}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) setSelectedLocation(null);
                else {
                  const [type, id] = val.split(":");
                  setSelectedLocation({ id, type: type as any });
                }
              }}
              className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-4 py-2 text-sm font-bold ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none shadow-sm cursor-pointer"
            >
              <option value="">-- Pilih Lokasi --</option>
              
              <optgroup label="Meja Digital (QR)">
                {tables.map(t => (
                  <option key={t.id} value={`table:${t.id}`}>{t.tableNumber}</option>
                ))}
              </optgroup>

              <optgroup label="Stand Fisik (Antrian)">
                {stands.filter(s => !s.isActive).map((s) => (
                  <option key={s.id} value={`stand:${s.id}`}>
                    Stand #{s.standNumber}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-background">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                <Plus className="w-12 h-12 mb-3 stroke-[1.5]" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Belum ada item</p>
                <p className="text-xs text-muted-foreground">Klik menu di kiri untuk menambah</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.menuItemId} className="bg-card rounded-2xl p-3 border-2 border-border hover:border-primary/20 transition-colors shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-bold text-foreground text-sm leading-tight flex-1 pr-2">{item.name}</p>
                    <span className="text-sm font-black text-foreground">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-card rounded-xl border border-border shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, -1)}
                        className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors rounded-l-xl"
                      >
                        <MinusIcon className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-black text-foreground">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, 1)}
                        className="p-2 text-muted-foreground hover:bg-success/10 hover:text-success transition-colors rounded-r-xl"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <Input
                      type="text"
                      placeholder="Catatan..."
                      value={item.note}
                      onChange={(e) => updateNote(item.menuItemId, e.target.value)}
                      className="flex-1 h-9 bg-card border border-border rounded-xl text-[11px] placeholder:text-muted-foreground/50"
                    />
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.menuItemId)}
                      className="p-2 w-9 h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Footer */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm">
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <span>Pajak (10%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between items-end pt-3 border-t border-border mt-2">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-tighter">Total Bayar</span>
                  <span className="text-3xl font-black text-primary leading-none">{formatCurrency(total)}</span>
                </div>
              </div>
              
              <Button
                onClick={() => setShowPayment(true)}
                disabled={!selectedLocation}
                className="w-full py-7 text-lg font-black transition-all shadow-xl shadow-primary/30 active:scale-[0.98] rounded-2xl"
              >
                {!selectedLocation ? "Pilih Lokasi Dahulu" : "Bayar Sekarang"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal Overlay */}
      {/* Payment Modal Overlay */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-0 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] rounded-[2rem]">
          {/* Modal Header */}
          <DialogHeader className="p-6 border-b border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black text-foreground tracking-tight">Metode Pembayaran</DialogTitle>
                <DialogDescription className="text-sm font-bold uppercase tracking-widest mt-1">Selesaikan Transaksi</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6 bg-card">
            {/* Total Amount Card */}
            <div className="bg-primary rounded-3xl p-6 text-center shadow-lg shadow-primary/20">
              <p className="text-primary-foreground/80 text-xs font-black uppercase tracking-[0.2em] mb-1">Total yang harus dibayar</p>
              <p className="text-4xl font-black text-primary-foreground tracking-tight">{formatCurrency(total)}</p>
            </div>

            {/* Payment Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`p-5 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                  paymentMethod === "cash" ? "border-success bg-success/10 shadow-inner" : "border-border bg-muted/30 hover:border-primary/30 hover:bg-background"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === "cash" ? "bg-success text-success-foreground" : "bg-background text-success shadow-sm"}`}>
                  <Banknote className="w-6 h-6" />
                </div>
                <span className="font-black text-xs uppercase tracking-widest text-foreground">Tunai (Cash)</span>
              </button>
              
              <button
                onClick={() => setPaymentMethod("qris")}
                className={`p-5 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                  paymentMethod === "qris" ? "border-purple-500 bg-purple-500/10 shadow-inner" : "border-border bg-muted/30 hover:border-primary/30 hover:bg-background"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === "qris" ? "bg-purple-500 text-white" : "bg-background text-purple-600 shadow-sm"}`}>
                  <QrCode className="w-6 h-6" />
                </div>
                <span className="font-black text-xs uppercase tracking-widest text-foreground">QRIS Dinamis</span>
              </button>
              
              <button
                onClick={() => setPaymentMethod("debit")}
                className={`p-5 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                  paymentMethod === "debit" ? "border-info bg-info/10 shadow-inner" : "border-border bg-muted/30 hover:border-primary/30 hover:bg-background"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === "debit" ? "bg-info text-info-foreground" : "bg-background text-info shadow-sm"}`}>
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="font-black text-xs uppercase tracking-widest text-foreground">Debit (EDC)</span>
              </button>
              
              <button
                onClick={() => setPaymentMethod("credit")}
                className={`p-5 border-2 rounded-2xl flex flex-col items-center gap-3 transition-all ${
                  paymentMethod === "credit" ? "border-warning bg-warning/10 shadow-inner" : "border-border bg-muted/30 hover:border-primary/30 hover:bg-background"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === "credit" ? "bg-warning text-warning-foreground" : "bg-background text-warning shadow-sm"}`}>
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="font-black text-xs uppercase tracking-widest text-foreground">Kredit (EDC)</span>
              </button>
            </div>

            {/* Cash Input Detail */}
            {paymentMethod === "cash" && (
              <div className="space-y-3 p-4 bg-success/10 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-success-foreground ml-2">Uang yang diterima</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-success-foreground text-xl">Rp</span>
                  <Input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-6 border-2 border-success/30 bg-background rounded-2xl text-2xl font-black text-foreground focus:outline-none focus:ring-4 focus:ring-success/20 placeholder:text-muted-foreground/50"
                  />
                </div>
                {parseFloat(cashReceived) >= total && (
                  <div className="bg-background border-2 border-success rounded-2xl p-4 flex justify-between items-center shadow-lg shadow-success/20">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Kembalian</span>
                    <span className="text-2xl font-black text-success">{formatCurrency(change)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-6 pt-0 bg-card">
            <Button
              onClick={handleCheckout}
              disabled={
                submitting ||
                !paymentMethod ||
                (paymentMethod === "cash" && parseFloat(cashReceived) < total)
              }
              className="w-full py-7 rounded-2xl font-black text-xl transition-all shadow-xl shadow-primary/30 active:scale-[0.98]"
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                  Memproses...
                </div>
              ) : paymentMethod === "qris" ? "Buat Tagihan QRIS" : "Selesaikan Transaksi"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
