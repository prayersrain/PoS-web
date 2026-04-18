"use client";

import { useEffect, useState } from "react";
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Wallet,
  ArrowRightCircle,
  History,
  Info,
  Timer,
  BadgeAlert
} from "lucide-react";
import { useNotification } from "@/components/Notification";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface Shift {
  id: string;
  openedAt: string;
  closedAt: string | null;
  cashStart: number;
  cashEnd: number | null;
  expectedCash: number | null;
  status: string;
  cashDifference: number | null;
}

export default function ShiftPage() {
  const { showNotification } = useNotification();
  const [shift, setShift] = useState<Shift | null>(null);
  const [cashStart, setCashStart] = useState("");
  const [loading, setLoading] = useState(true);
  const [openingShift, setOpeningShift] = useState(false);
  const [closingShift, setClosingShift] = useState(false);
  const [cashEnd, setCashEnd] = useState("");
  const [history, setHistory] = useState<Shift[]>([]);

  const fetchShift = async () => {
    try {
      const res = await fetch("/api/shift");
      if (!res.ok) return;
      const data = await res.json();
      setShift(data);
    } catch (e) {
      console.error("Failed to fetch shift:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/shift?history=true");
      if (!res.ok) return;
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch history:", e);
    }
  };

  useEffect(() => {
    fetchShift();
    fetchHistory();
  }, []);

  const handleOpenShift = async () => {
    if (!cashStart) {
      showNotification("Silakan masukkan jumlah kas awal", "warning");
      return;
    }

    setOpeningShift(true);
    try {
      await fetch("/api/shift/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cashStart: parseFloat(cashStart) }),
      });
      fetchShift();
      fetchHistory();
      setCashStart("");
      showNotification("Shift berhasil dibuka!", "success");
    } catch (e) {
      console.error("Failed to open shift:", e);
      showNotification("Gagal membuka shift", "error");
    } finally {
      setOpeningShift(false);
    }
  };

  const handleCloseShift = async () => {
    if (!cashEnd) {
      showNotification("Silakan masukkan jumlah kas akhir", "warning");
      return;
    }

    setClosingShift(true);
    try {
      await fetch("/api/shift/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cashEnd: parseFloat(cashEnd) }),
      });
      fetchShift();
      fetchHistory();
      setCashEnd("");
      showNotification("Shift berhasil ditutup!", "success");
    } catch (e) {
      console.error("Failed to close shift:", e);
      showNotification("Gagal menutup shift", "error");
    } finally {
      setClosingShift(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Memuat Info Shift...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Badge variant="outline" className="mb-3 border-indigo-200 text-indigo-700 bg-indigo-50 px-3 py-1 font-black uppercase tracking-widest text-[10px]">
            Operational Control
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Manajemen <span className="text-indigo-600">Shift</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
            <Timer className="w-4 h-4 text-indigo-400" />
            Pantau kehadiran dan rekonsiliasi kas harian.
          </p>
        </div>
      </div>

      {shift && shift.status === "open" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Shift Card */}
          <Card className="lg:col-span-2 rounded-[2.5rem] border-indigo-100 shadow-2xl shadow-indigo-500/10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Clock className="w-32 h-32 text-indigo-900" />
            </div>
            <CardHeader className="p-8 border-b border-indigo-50 bg-indigo-50/50">
               <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-2 text-indigo-900">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Shift Sedang Berjalan
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mt-1">
                      DIBUKA PADA {new Date(shift.openedAt).toLocaleString("id-ID")}
                    </CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kas Awal</p>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                    {formatCurrency(shift.cashStart).replace("Rp", "Rp ")}
                  </h3>
                </div>
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kas Diharapkan</p>
                  <h3 className="text-2xl font-black text-indigo-600 tracking-tighter">
                    {shift.expectedCash ? formatCurrency(shift.expectedCash).replace("Rp", "Rp ") : "N/A"}
                  </h3>
                </div>
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Durasi Aktif</p>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                    {Math.floor((Date.now() - new Date(shift.openedAt).getTime()) / 3600000)}h{" "}
                    {Math.floor(((Date.now() - new Date(shift.openedAt).getTime()) % 3600000) / 60000)}m
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Close Shift Form */}
          <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black uppercase tracking-widest">Akhiri Shift</CardTitle>
              <CardDescription className="text-xs font-medium text-slate-400 uppercase italic">Pastikan kas fisik sudah dihitung dengan teliti.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Kas Fisik (Rp)</label>
                 <Input
                   type="number"
                   value={cashEnd}
                   onChange={(e) => setCashEnd(e.target.value)}
                   placeholder="0"
                   className="rounded-2xl bg-slate-50 border-transparent py-7 font-black text-xl text-slate-900 focus-visible:ring-indigo-500"
                 />
               </div>
               <Button
                 onClick={handleCloseShift}
                 disabled={closingShift}
                 className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-500/20 gap-2"
               >
                 {closingShift ? "Proses Penutupan..." : "Konfirmasi Tutup Shift"}
                 <ArrowRightCircle className="w-4 h-4" />
               </Button>
               <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                 <Info className="inline w-3 h-3 mr-1 mb-0.5" />
                 Sistem akan mencatat selisih jika kas tidak sesuai.
               </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Open Shift Component */
        <Card className="rounded-[3rem] border-slate-100 shadow-2xl shadow-slate-200/50 p-12 text-center relative overflow-hidden">
           <div className="absolute top-0 inset-x-0 h-2 bg-indigo-500" />
           <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
             <Wallet className="w-10 h-10 text-indigo-300" />
           </div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mb-2">Shift Belum Dibuka</h2>
           <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto uppercase text-[10px] tracking-widest">Silakan input kas modal awal untuk mengaktifkan sistem kasir.</p>

           <div className="max-w-md mx-auto space-y-4">
              <Input
                type="number"
                value={cashStart}
                onChange={(e) => setCashStart(e.target.value)}
                placeholder="Kas Awal (Rp)"
                className="rounded-2xl bg-slate-50 border-transparent py-8 text-center font-black text-2xl text-slate-900 focus-visible:ring-indigo-500"
              />
              <Button
                onClick={handleOpenShift}
                disabled={openingShift}
                className="w-full py-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-2xl shadow-indigo-600/30 gap-3"
              >
                {openingShift ? "Membuka..." : "Aktifkan Shift Sekarang"}
                <ArrowRightCircle className="w-5 h-5" />
              </Button>
           </div>
        </Card>
      )}

      {/* History Section */}
      <div className="pt-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-slate-100 rounded-lg">
             <History className="w-5 h-5 text-slate-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Log Transaksi Shift</h2>
        </div>

        <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-50 h-16">
                <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest">Waktu & Tanggal</TableHead>
                <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-right">Kas Awal</TableHead>
                <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-right">Ekspektasi</TableHead>
                <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-right">Aktual</TableHead>
                <TableHead className="px-8 font-black text-[10px] uppercase tracking-widest text-right">Status Rekonsiliasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">
                    Belum ada data riwayat shift terekam
                  </TableCell>
                </TableRow>
              ) : (
                history.map((s) => {
                  const diff = s.cashDifference || 0;
                  const isPerfect = diff === 0;
                  
                  return (
                    <tr key={s.id} className="group border-slate-50 hover:bg-slate-50/50 transition-all duration-300">
                      <TableCell className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-400 transition-colors" />
                           <div>
                              <p className="text-xs font-black text-slate-900 uppercase">
                                {new Date(s.openedAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                                {new Date(s.openedAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} 
                                {s.closedAt && ` • KELUAR: ${new Date(s.closedAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}`}
                              </p>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 text-right font-bold text-slate-500">{formatCurrency(s.cashStart)}</TableCell>
                      <TableCell className="px-8 text-right font-bold text-indigo-400">{s.expectedCash ? formatCurrency(s.expectedCash) : "-"}</TableCell>
                      <TableCell className="px-8 text-right font-black text-slate-900">{s.cashEnd ? formatCurrency(s.cashEnd) : "-"}</TableCell>
                      <TableCell className="px-8 text-right">
                        <Badge 
                          className={`rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest border-0 transition-all ${
                            isPerfect 
                              ? "bg-green-100 text-green-700 group-hover:bg-green-500 group-hover:text-white" 
                              : diff > 0 
                                ? "bg-blue-100 text-blue-700 group-hover:bg-blue-500 group-hover:text-white"
                                : "bg-red-100 text-red-700 group-hover:bg-red-500 group-hover:text-white"
                          }`}
                        >
                          {isPerfect ? (
                             <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> MATCH</span>
                          ) : (
                             <span className="flex items-center gap-1.5"><BadgeAlert className="w-3 h-3" /> SELISIH {formatCurrency(Math.abs(diff))}</span>
                          )}
                        </Badge>
                      </TableCell>
                    </tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
