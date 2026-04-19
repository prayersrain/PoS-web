"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, X, Search, Package, Clock, CheckCircle, Printer } from "lucide-react";
import { getSessionClient } from "@/lib/auth";
import { useOrderUpdates } from "@/hooks/useOrderUpdates";
import { siteConfig } from "@/lib/site-config";
import { PrintableReceipt } from "@/components/PrintableReceipt";
import { useNotification } from "@/components/Notification";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader as DialogHead, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import React from "react";
import { playNotificationSound } from "@/lib/sounds";

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

interface Table {
  id: string;
  tableNumber: string;
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
  stand?: any;
  table?: any;
}

export default function OrdersPage() {
  const { showNotification } = useNotification();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stands, setStands] = useState<Stand[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderType, setOrderType] = useState<"dine-in" | "take-away">("dine-in");
  const [selectedLocation, setSelectedLocation] = useState<{ id: string; type: "stand" | "table" } | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerNote, setCustomerNote] = useState("");
  const [showNewOrder, setShowNewOrder] = useState(action === "new-walkin" || action === "new-qr");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [printingOrder, setPrintingOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  useOrderUpdates(() => {
    fetchOrders();
    fetchStands();
    playNotificationSound();
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
      const [menuRes, standsRes, tablesRes, ordersRes] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/stands"),
        fetch("/api/tables"),
        fetch("/api/orders"),
      ]);

      if (menuRes.ok) setMenuItems(await menuRes.json());
      if (standsRes.ok) setStands(await standsRes.json());
      if (tablesRes.ok) setTables(await tablesRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
    } catch (e) {
      console.error("Failed to fetch data:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) setOrders(await res.json());
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    }
  };

  const fetchStands = async () => {
    try {
      const res = await fetch("/api/stands");
      if (res.ok) setStands(await res.json());
    } catch (e) {
      console.error("Failed to fetch stands:", e);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const err = await res.json();
        showNotification(err.error || "Gagal update status", "error");
        return;
      }

      showNotification(`Status pesanan diperbarui ke ${status}`, "success");
      fetchOrders();
      fetchStands();
    } catch (e) {
      console.error("Failed to update status:", e);
      showNotification("Terjadi kesalahan sistem", "error");
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

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    if (orderType === "dine-in" && !selectedLocation) {
      showNotification("Silakan pilih meja atau stand terlebih dahulu", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const session = getSessionClient();
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standId: orderType === "dine-in" && selectedLocation?.type === "stand" ? selectedLocation.id : null,
          tableId: orderType === "dine-in" && selectedLocation?.type === "table" ? selectedLocation.id : null,
          orderSource: "walk-in",
          orderType,
          items: cart.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            note: item.note,
          })),
          customerNote: customerNote || null,
          createdBy: session?.username || "staf",
        }),
      });

      setCart([]);
      setSelectedLocation(null);
      setShowNewOrder(false);
      fetchData();
      showNotification("Pesanan berhasil dibuat!", "success");
    } catch (e) {
      console.error("Failed to create order:", e);
      showNotification("Gagal membuat pesanan", "error");
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
  const cartTax = 0;
  const cartGrandTotal = cartTotal + cartTax;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      preparing: "bg-blue-50 text-blue-700 border-blue-200",
      ready: "bg-green-50 text-green-700 border-green-200",
      served: "bg-gray-50 text-gray-600 border-gray-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${styles[status] || styles.served}`}>
        {status}
      </span>
    );
  };

  const handlePrint = (order: any) => {
    setPrintingOrder(order);
    setTimeout(() => {
      if (receiptRef.current) {
        window.print();
        setPrintingOrder(null);
      }
    }, 100);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-10 text-center font-black animate-pulse">MEMUAT DATA...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight italic uppercase">Pesanan</h1>
          <p className="text-muted-foreground font-medium">Layar pantau dapur dan manajemen antrian</p>
        </div>
        <Button
          onClick={() => setShowNewOrder(!showNewOrder)}
          className="flex items-center gap-2 px-6 py-6 rounded-3xl transition-all shadow-xl shadow-primary/30 font-black uppercase tracking-widest text-xs h-auto"
        >
          <Plus className="w-5 h-5" />
          Order Manual
        </Button>
      </div>

      <Dialog open={showNewOrder} onOpenChange={setShowNewOrder}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-0 shadow-2xl rounded-[2.5rem] bg-background max-h-[90vh] flex flex-col">
          <DialogHead className="flex flex-row items-center justify-between p-8 border-b border-border bg-card">
            <div>
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight uppercase italic">Buat Pesanan</DialogTitle>
              <DialogDescription className="text-xs font-bold tracking-widest mt-1">LUNAS DI DEPAN • NO PAYLATER</DialogDescription>
            </div>
          </DialogHead>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-background">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Pilih Service</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {["dine-in", "take-away"].map((t) => (
                      <button key={t} onClick={() => setOrderType(t as any)} 
                        className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                          orderType === t ? "bg-primary/10 border-primary shadow-lg shadow-primary/10" : "bg-card border-border grayscale-[50%] opacity-60 hover:opacity-100"
                        }`}
                      >
                        <span className="text-3xl">{t === "dine-in" ? "🍽️" : "🥡"}</span>
                        <span className={`font-black text-xs uppercase tracking-widest ${orderType === t ? "text-primary" : "text-muted-foreground"}`}>
                          {t === "dine-in" ? "Dine In" : "Take Away"}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                {orderType === "dine-in" && (
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 italic">Pilih Meja Digital</h3>
                      <div className="grid grid-cols-5 gap-2">
                        {tables.map(t => (
                          <button key={t.id} onClick={() => setSelectedLocation({ id: t.id, type: "table" })}
                            className={`p-3 rounded-xl font-black text-[10px] border-2 transition-all ${
                              selectedLocation?.id === t.id ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-card border-border text-muted-foreground hover:border-indigo-300"
                            }`}
                          >
                            {t.tableNumber}
                          </button>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 italic">Pilih Stand Fisik</h3>
                      <div className="grid grid-cols-5 gap-2">
                        {stands.filter(s => !s.isActive).map(s => (
                          <button key={s.id} onClick={() => setSelectedLocation({ id: s.id, type: "stand" })}
                            className={`p-3 rounded-xl font-black text-[10px] border-2 transition-all ${
                              selectedLocation?.id === s.id ? "bg-emerald-600 border-emerald-600 text-white shadow-lg" : "bg-card border-border text-muted-foreground hover:border-emerald-300"
                            }`}
                          >
                            {s.standNumber}
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Pilih Menu</h3>
                 <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {menuItems.map(item => (
                      <div key={item.id} className="p-4 bg-card rounded-2xl border-2 border-border hover:border-primary/30 shadow-sm transition-all flex items-center justify-between group">
                        <div>
                          <p className="font-bold text-foreground group-hover:text-primary">{item.name}</p>
                          <p className="text-xs font-bold text-muted-foreground uppercase">{formatCurrency(item.price)}</p>
                        </div>
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          onClick={() => addToCart(item)} 
                          className="w-10 h-10 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-border bg-muted/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Bayar</p>
              <p className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(cartGrandTotal)}</p>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <Button type="button" variant="ghost" onClick={() => setShowNewOrder(false)} className="px-8 py-7 font-black text-xs uppercase tracking-widest h-auto">BATAL</Button>
              <Button 
                disabled={submitting || cart.length === 0 || (orderType === "dine-in" && !selectedLocation)} 
                onClick={handleSubmitOrder} 
                className="px-10 py-7 font-black rounded-3xl shadow-xl shadow-primary/30 active:scale-[0.98] transition-all text-xs tracking-[0.2em] uppercase h-auto flex-1 sm:flex-none"
              >
                {submitting ? "PROSES..." : "LUNASKAN & CETAK"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main List UI */}
      <Card className="rounded-[3rem] shadow-sm overflow-hidden border-border bg-card">
        <div className="p-8 border-b border-border flex flex-col xl:flex-row gap-6 items-center bg-card">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari Kode atau Meja..." 
                className="w-full pl-14 pr-4 h-14 bg-background border-2 border-transparent focus-visible:border-primary rounded-3xl font-bold transition-all text-base" />
            </div>
            <div className="flex bg-muted p-2 rounded-3xl gap-1 w-full xl:w-auto overflow-x-auto scrollbar-hide">
              {["all", "pending", "preparing", "ready", "served"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  statusFilter === s ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                  {s}
                </button>
              ))}
            </div>
        </div>

        <div className="divide-y divide-border">
          {filteredOrders.length === 0 ? (
             <div className="p-32 text-center bg-muted/10">
                <Package className="w-20 h-20 text-muted mx-auto mb-6 opacity-30" />
                <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-xs">Belum ada pesanan masuk</p>
             </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="p-8 md:p-10 bg-card hover:bg-muted/30 transition-all group border-l-8 border-transparent hover:border-primary">
                <div className="flex flex-col xl:flex-row xl:items-center gap-6 xl:gap-10">
                  <div className="flex items-center gap-6 min-w-max xl:min-w-[300px]">
                    <div className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center font-black shadow-inner rotate-3 group-hover:rotate-0 transition-transform ${
                       order.status === 'ready' ? 'bg-success/10 text-success' : 
                       order.status === 'preparing' ? 'bg-info/10 text-info' : 'bg-muted text-muted-foreground'
                    }`}>
                       <span className="text-[10px] uppercase opacity-60">Stand</span>
                       <span className="text-2xl">
                          {order.orderType === "dine-in" 
                            ? (order.stand ? `${order.stand.standNumber}` : (order.table ? `T${order.table.tableNumber.slice(1)}` : '-'))
                            : "Q0"}
                       </span>
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-foreground italic tracking-tight uppercase">#{order.id.slice(-6)}</h4>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {order.items.length} ITEM</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap gap-3">
                       {order.items.map((it: any, idx: number) => (
                         <div key={idx} className="px-5 py-2.5 bg-background border-2 border-border rounded-2xl flex items-center gap-3 group-hover:border-primary/20 transition-colors shadow-sm">
                            <span className="font-black text-primary text-xs">{it.quantity}x</span>
                            <span className="text-xs font-black text-foreground uppercase tracking-tighter">{it.menuItem.name}</span>
                            {it.note && <span className="text-[10px] text-destructive font-black">({it.note})</span>}
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-5 justify-between xl:justify-end w-full xl:w-auto">
                    <div className="text-left xl:text-right xl:mr-6">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tagihan</p>
                      <p className="font-black text-foreground tracking-tighter text-lg">{formatCurrency(order.totalAmount)}</p>
                    </div>

                    <div className="flex gap-3">
                        {order.status === "pending" && (
                          <Button onClick={() => updateOrderStatus(order.id, "preparing")} 
                            className="px-8 py-6 bg-info/10 text-info hover:text-info-foreground font-black text-xs uppercase rounded-2xl hover:bg-info transition-all tracking-widest h-auto">
                            MASAK
                          </Button>
                        )}
                        {order.status === "preparing" && (
                          <Button onClick={() => updateOrderStatus(order.id, "ready")} 
                            className="px-8 py-6 bg-primary/10 text-primary hover:text-primary-foreground font-black text-xs uppercase rounded-2xl hover:bg-primary transition-all tracking-widest h-auto">
                            SIAP
                          </Button>
                        )}
                        {order.status === "ready" && (
                          <Button onClick={() => updateOrderStatus(order.id, "served")} 
                            className="px-8 py-6 bg-success/10 text-success hover:text-success-foreground font-black text-xs uppercase rounded-2xl hover:bg-success transition-all tracking-widest shadow-xl shadow-success/20 active:scale-95 h-auto">
                            SAJIKAN
                          </Button>
                        )}
                        {order.status === "served" && (
                          <div className="px-8 py-4 bg-muted/30 text-muted-foreground font-black text-xs uppercase rounded-2xl italic tracking-widest border-2 border-dashed border-border flex items-center h-auto">
                            SELESAI
                          </div>
                        )}
                        
                        <Button variant="outline" size="icon" onClick={() => handlePrint(order)} className="p-4 w-12 h-12 rounded-2xl hover:border-primary hover:text-primary transition-all shadow-sm bg-card">
                           <Printer className="w-6 h-6" />
                        </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {printingOrder && (
        <div>
          <PrintableReceipt
            ref={receiptRef}
            orderId={printingOrder.id}
            tableNumber={printingOrder.stand?.standNumber || printingOrder.table?.tableNumber}
            items={printingOrder.items.map((item: any) => ({
              name: item.menuItem.name,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
              note: item.note
            }))}
            subtotal={printingOrder.totalAmount / (1 + (settings?.taxPercent / 100 || 0.1))}
            tax={printingOrder.totalAmount - (printingOrder.totalAmount / (1 + (settings?.taxPercent / 100 || 0.1)))}
            total={printingOrder.totalAmount}
            paymentMethod="PAID"
            createdBy="Staf"
            createdAt={printingOrder.createdAt}
            settings={settings}
          />
        </div>
      )}
    </div>
  );
}
