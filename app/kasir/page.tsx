"use client";

import { useEffect, useState, useCallback } from "react";
import { useOrderUpdates } from "@/hooks/useOrderUpdates";
import { getSessionClient, User } from "@/lib/auth";
import {
  QrCode,
  LayoutGrid,
  Clock,
  Monitor,
  ShoppingCart,
  ChevronRight,
  TrendingUp,
  Package,
  Activity,
  Zap,
  Coffee,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Table {
  id: string;
  tableNumber: string;
}

interface Stand {
  id: string;
  standNumber: number;
  isActive: boolean;
}

interface OrderStats {
  pending: number;
  preparing: number;
  ready: number;
}

export default function KasirDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [stands, setStands] = useState<Stand[]>([]);
  const [stats, setStats] = useState<OrderStats>({ pending: 0, preparing: 0, ready: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const session = getSessionClient();
      setUser(session);

      const [tablesRes, standsRes, statsRes] = await Promise.all([
        fetch("/api/tables"),
        fetch("/api/stands"),
        fetch("/api/reports/stats"),
      ]);

      if (tablesRes.ok) setTables(await tablesRes.json());
      if (standsRes.ok) setStands(await standsRes.json());
      if (statsRes.ok) {
        const fullStats = await statsRes.json();
        setStats({
          pending: fullStats.pending,
          preparing: fullStats.preparing,
          ready: fullStats.ready,
        });
      }
    } catch (e) {
      console.error("Failed to fetch kasir dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useOrderUpdates(fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="font-black uppercase tracking-[0.3em] text-[10px]">Sinkronisasi Status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Badge variant="outline" className="mb-3 border-indigo-200 text-indigo-700 bg-indigo-50 px-3 py-1 font-black uppercase tracking-widest text-[10px]">
            Live Operations
          </Badge>
          <div className="flex items-center gap-3">
             <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
               Overview <span className="text-indigo-600">Kasir</span>
             </h1>
             <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-lg border border-green-100 mb-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Connected</span>
             </div>
          </div>
          <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            Selamat bekerja, {user?.name || "Staf"}. Pantau antrian dan meja Anda di sini.
          </p>
        </div>
      </div>

      {/* Real-time Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-amber-100 bg-amber-50/30 shadow-xl shadow-amber-500/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clock className="w-16 h-16 text-amber-600" />
           </div>
           <CardContent className="p-8">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Antrian Menunggu</p>
              <div className="flex items-baseline gap-2">
                 <h2 className="text-5xl font-black text-amber-600 tracking-tighter">{stats.pending}</h2>
                 <Badge className="bg-amber-100 text-amber-600 border-0 text-[10px] font-black uppercase">Pending</Badge>
              </div>
           </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-blue-100 bg-blue-50/30 shadow-xl shadow-blue-500/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Package className="w-16 h-16 text-blue-600" />
           </div>
           <CardContent className="p-8">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Proses Dapur</p>
              <div className="flex items-baseline gap-2">
                 <h2 className="text-5xl font-black text-blue-600 tracking-tighter">{stats.preparing}</h2>
                 <Badge className="bg-blue-100 text-blue-600 border-0 text-[10px] font-black uppercase">Cooking</Badge>
              </div>
           </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-emerald-100 bg-emerald-50/30 shadow-xl shadow-emerald-500/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle2 className="w-16 h-16 text-emerald-600" />
           </div>
           <CardContent className="p-8">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Siap Disajikan</p>
              <div className="flex items-baseline gap-2">
                 <h2 className="text-5xl font-black text-emerald-600 tracking-tighter">{stats.ready}</h2>
                 <Badge className="bg-emerald-100 text-emerald-600 border-0 text-[10px] font-black uppercase">Ready</Badge>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Monitoring Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Table QR Monitor */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-row items-center justify-between space-y-0">
             <div>
                <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                   <QrCode className="w-5 h-5 text-indigo-600" />
                   Meja QR Digital
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">SINKRONISASI AKTIF</CardDescription>
             </div>
             <Button asChild variant="ghost" className="h-8 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl gap-1">
                <Link href="/kasir/tables">
                   Detail <ChevronRight className="w-3 h-3" />
                </Link>
             </Button>
          </CardHeader>
          <CardContent className="p-8">
             <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
               {tables.slice(0, 40).map((t) => (
                 <div 
                   key={t.id} 
                   className="aspect-square rounded-2xl bg-slate-50 border-2 border-slate-100 flex flex-col items-center justify-center group hover:bg-white hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
                 >
                   <span className="text-[11px] font-black text-slate-900">{t.tableNumber}</span>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>

        {/* Physical Stand Monitor */}
        <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-row items-center justify-between space-y-0">
             <div>
                <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                   <LayoutGrid className="w-5 h-5 text-indigo-600" />
                   Stand Fisik
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">KETERSEDIAAN LANTAI</CardDescription>
             </div>
             <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Ready</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-indigo-600 rounded-full" /> In-Use</div>
             </div>
          </CardHeader>
          <CardContent className="p-8">
             <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
               {stands.map((s) => {
                 const isActive = s.isActive;
                 return (
                   <div 
                     key={s.id} 
                     className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${
                       isActive 
                         ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20 scale-100" 
                         : "bg-emerald-50 border-transparent hover:border-emerald-500 cursor-pointer"
                     }`}
                   >
                     <span className={`text-[11px] font-black ${isActive ? "text-white" : "text-emerald-700"}`}>
                       {s.standNumber}
                     </span>
                     {isActive && <div className="absolute inset-0 border-2 border-indigo-400/50 animate-ping-slow rounded-2xl" />}
                   </div>
                 );
               })}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Action CTA Block */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-black rounded-[3rem] p-12 text-white shadow-3xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10">
         <div className="relative z-10 flex-1 text-center lg:text-left">
            <Badge className="bg-indigo-500/30 text-indigo-200 border-0 mb-4 px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px]">
               Smart POS Terminal
            </Badge>
            <h3 className="text-4xl font-black italic tracking-tighter mb-4 uppercase leading-none">Siap Melayani <span className="text-indigo-400">Customer?</span></h3>
            <p className="text-indigo-200/80 font-medium max-w-lg text-sm leading-relaxed">Kelola pesanan baru, cetak nota, dan update status antrian langsung dari terminal responsif Anda.</p>
         </div>
         <div className="flex flex-col sm:flex-row gap-5 relative z-10 w-full lg:w-auto">
            <Button asChild className="h-16 px-10 bg-white text-indigo-950 font-black rounded-2xl hover:bg-slate-100 transition-all flex items-center gap-3 text-xs uppercase tracking-widest shadow-xl shadow-white/10 group">
               <Link href="/kasir/pos">
                  <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" /> Buka Area POS
               </Link>
            </Button>
            <Button asChild variant="outline" className="h-16 px-10 bg-indigo-700/20 border-indigo-500/50 text-white font-black rounded-2xl hover:bg-indigo-700/40 transition-all flex items-center gap-3 text-xs uppercase tracking-widest group">
               <Link href="/kasir/orders">
                  <Monitor className="w-5 h-5 group-hover:scale-110 transition-transform" /> Antrian Live
               </Link>
            </Button>
         </div>
         <div className="absolute -top-12 -right-12 opacity-10 pointer-events-none">
            <Coffee className="w-64 h-64" />
         </div>
         <div className="absolute -bottom-20 -left-20 opacity-10 pointer-events-none rotate-12">
            <Activity className="w-80 h-80" />
         </div>
      </div>
    </div>
  );
}

