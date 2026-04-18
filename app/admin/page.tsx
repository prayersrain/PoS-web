"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useOrderUpdates } from "@/hooks/useOrderUpdates";
import { getSessionClient, User } from "@/lib/auth";
import {
  TrendingUp,
  ArrowUpRight,
  Package,
  ClipboardList,
  UtensilsCrossed,
  Settings,
  BarChart3,
  Users,
  Wallet
} from "lucide-react";
import React from "react";

interface OrderStats {
  total: number;
  pending: number;
  preparing: number;
  ready: number;
  served: number;
  todayRevenue: number;
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
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

  const fetchData = useCallback(async () => {
    try {
      const session = getSessionClient();
      setUser(session);

      const [statsRes, ordersRes] = await Promise.all([
        fetch("/api/reports/stats"),
        fetch("/api/orders?limit=10"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setRecentOrders(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch admin dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useOrderUpdates(fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-muted-foreground gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="font-bold uppercase tracking-widest text-[10px]">Menganalisis Data Finansial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 fade-in animate-in">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2.5rem] border-0 shadow-2xl relative overflow-hidden">
          <CardContent className="p-10">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <TrendingUp className="w-32 h-32" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-4">Total Omset Hari Ini</p>
            <div className="flex items-end gap-3 mb-6">
               <h3 className="text-5xl font-black tracking-tighter leading-none">{formatCurrency(stats.todayRevenue)}</h3>
               <span className="text-emerald-400 text-sm font-black flex items-center mb-1">
                  <ArrowUpRight className="w-4 h-4" /> 8.4%
               </span>
            </div>
            <div className="flex gap-4">
               <Link href="/admin/reports" className="px-6 py-3 bg-white/10 hover:bg-white/20 transition-all rounded-2xl text-xs font-black uppercase tracking-widest">
                  Detail Laporan
               </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-muted shadow-sm group hover:border-emerald-500 transition-all">
          <CardContent className="p-8 h-full flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <Package className="w-6 h-6" />
              </div>
              <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] mb-1">Pesanan Sukses</p>
              <h3 className="text-3xl font-black text-foreground">{stats.served}</h3>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-4 italic">Total pesanan selesai</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-muted shadow-sm group hover:border-emerald-500 transition-all">
          <CardContent className="p-8 h-full flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <Wallet className="w-6 h-6" />
              </div>
              <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] mb-1">Transaksi Aktif</p>
              <h3 className="text-3xl font-black text-foreground">{stats.pending + stats.preparing + stats.ready}</h3>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-4 italic">Sedang dalam proses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions List */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border-muted shadow-sm overflow-hidden">
          <CardHeader className="p-8 border-b border-border flex flex-row items-center justify-between pb-8">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-6 h-6 text-muted-foreground" />
              <CardTitle className="font-black text-xl text-foreground tracking-tight">Transaksi Terakhir</CardTitle>
            </div>
            <Link href="/admin/reports" className="text-xs font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest">
              Analisis Lengkap
            </Link>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="py-20 text-center text-[10px] font-black tracking-widest text-muted-foreground uppercase">Belum ada data transaksi</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border">
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4 text-right">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/50 transition-all group">
                      <td className="px-6 py-5">
                        <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase ${
                          order.status === 'served' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[11px] font-black text-foreground uppercase tracking-tight truncate max-w-[200px]">
                           {order.items.map((i:any) => i.menuItem.name).join(", ")}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase">{new Date(order.createdAt).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-foreground text-xs">
                        {formatCurrency(order.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Managerial Quick Actions */}
        <div className="space-y-6">
           <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-600/20">
              <h3 className="font-black text-xl mb-4 italic tracking-tight">Kontrol Manajemen</h3>
              <div className="grid grid-cols-1 gap-3">
                 <Link href="/admin/menu" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                    <div className="flex items-center gap-3">
                       <UtensilsCrossed className="w-5 h-5" />
                       <span className="text-xs font-black uppercase tracking-widest text-white/90">Update Menu</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </Link>
                 <Link href="/admin/settings" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                    <div className="flex items-center gap-3">
                       <Settings className="w-5 h-5" />
                       <span className="text-xs font-black uppercase tracking-widest text-white/90">Ubah Profil</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </Link>
                 <Link href="/admin/reports" className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                    <div className="flex items-center gap-3">
                       <BarChart3 className="w-5 h-5" />
                       <span className="text-xs font-black uppercase tracking-widest text-white/90">Laba Rugi</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </Link>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-8 border-2 border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                 <Users className="w-5 h-5 text-slate-400" />
                 <h4 className="font-black text-sm uppercase tracking-widest text-slate-900">Aktivitas Tim</h4>
              </div>
              <div className="space-y-4">
                 {[1].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-slate-100 rounded-full" />
                       <div className="flex-1">
                          <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Kasir Warkop</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Shift Sedang Berjalan</p>
                       </div>
                       <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
