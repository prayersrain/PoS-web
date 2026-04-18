"use client";

import { useEffect, useState } from "react";
import { 
  Monitor, 
  Users, 
  CheckCircle2, 
  Hash, 
  LayoutGrid,
  Info,
  Activity,
  UserCheck,
  Timer
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Stand {
  id: string;
  standNumber: number;
  isActive: boolean;
  orderId: string | null;
}

export default function StandsPage() {
  const [stands, setStands] = useState<Stand[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStands = async () => {
    try {
      const res = await fetch("/api/stands");
      if (!res.ok) {
        console.error("Failed to fetch stands:", res.status);
        return;
      }
      const data = await res.json();
      setStands(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch stands:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStands();
    const interval = setInterval(fetchStands, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = stands.filter((s) => s.isActive).length;
  const availableCount = stands.filter((s) => !s.isActive).length;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Badge variant="outline" className="mb-3 border-indigo-200 text-indigo-700 bg-indigo-50 px-3 py-1 font-black uppercase tracking-widest text-[10px]">
            Floor Management
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Monitoring <span className="text-indigo-600">Stand Meja</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Pantau ketersediaan meja pelanggan secara real-time.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <UserCheck className="w-16 h-16 text-indigo-600" />
           </div>
           <CardContent className="p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stand Aktif</p>
              <div className="flex items-baseline gap-2">
                 <h2 className="text-4xl font-black text-indigo-600 tracking-tighter">{activeCount}</h2>
                 <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[9px] font-black uppercase tracking-tighter">In Use</Badge>
              </div>
           </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <CheckCircle2 className="w-16 h-16 text-emerald-600" />
           </div>
           <CardContent className="p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tersedia</p>
              <div className="flex items-baseline gap-2">
                 <h2 className="text-4xl font-black text-emerald-600 tracking-tighter">{availableCount}</h2>
                 <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              </div>
           </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Hash className="w-16 h-16 text-slate-900" />
           </div>
           <CardContent className="p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Stand</p>
              <div className="flex items-baseline gap-2">
                 <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{stands.length}</h2>
                 <Badge className="bg-slate-100 text-slate-500 border-0 text-[9px] font-black uppercase">Units</Badge>
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-row items-center justify-between">
           <div>
              <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-2">
                 <LayoutGrid className="w-5 h-5 text-indigo-600" />
                 Visualisasi Floor Plan
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">STATUS UPDATE SETIAP 10 DETIK</CardDescription>
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-100 shadow-sm">
              <Timer className="w-3 h-3 text-indigo-400 animate-spin-slow" />
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Live</span>
           </div>
        </CardHeader>
        <CardContent className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <div className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest">Sinkronisasi data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
              {stands.map((stand) => (
                <div
                  key={stand.id}
                  className={`aspect-square rounded-3xl flex flex-col items-center justify-center border-2 transition-all duration-300 relative group overflow-hidden ${
                    stand.isActive
                      ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20 scale-100"
                      : "bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-white"
                  }`}
                >
                  {stand.isActive && (
                    <div className="absolute top-0 right-0 p-1">
                       <Users className="w-3 h-3 text-indigo-200/50" />
                    </div>
                  )}
                  <span className={`text-xl font-black ${stand.isActive ? "text-white" : "text-slate-900 group-hover:text-indigo-600"}`}>
                    #{stand.standNumber}
                  </span>
                  <p className={`text-[8px] mt-1 font-black uppercase tracking-widest ${
                    stand.isActive
                      ? "text-indigo-100/70"
                      : "text-slate-400"
                  }`}>
                    {stand.isActive ? "DIGUNAKAN" : "KOSONG"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
        <div className="flex items-center gap-3">
           <div className="w-5 h-5 rounded-lg bg-indigo-600 shadow-md" />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Aktif (Meja Terisi)</span>
        </div>
        <div className="flex items-center gap-3">
           <div className="w-5 h-5 rounded-lg bg-slate-100 border-2 border-slate-200" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Tersedia (Siap Digunakan)</span>
        </div>
        <div className="ml-0 sm:ml-auto flex items-center gap-2 text-slate-400">
           <Info className="w-3 h-3" />
           <p className="text-[9px] font-medium italic">Klik stand untuk melihat detail pesanan (Segera hadir)</p>
        </div>
      </div>
    </div>
  );
}

