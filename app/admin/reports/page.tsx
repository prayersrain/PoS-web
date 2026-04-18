"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Package, 
  CreditCard, 
  Download, 
  Calendar as CalendarIcon,
  ChevronRight,
  BarChart3,
  XCircle,
  Trophy,
  PieChart,
  ArrowUpRight
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface DailyReport {
  totalOrders: number;
  totalRevenue: number;
  paidOrders: number;
  unpaidOrders: number;
  cancelledOrders: number;
  topItems: { name: string; quantity: number; revenue: number }[];
  paymentMethods: { method: string; count: number; total: number }[];
}

export default function ReportsPage() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/daily?date=${date}`);
      if (!res.ok) return;
      const data = await res.json();
      setReport({
        ...data,
        topItems: Array.isArray(data.topItems) ? data.topItems : [],
        paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods : [],
      });
    } catch (e) {
      console.error("Failed to fetch report:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [date]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = () => {
    if (!report) return;

    const csvContent = [
      ["Date", date],
      ["Total Orders", report.totalOrders],
      ["Total Revenue", report.totalRevenue],
      ["Paid Orders", report.paidOrders],
      ["Unpaid Orders", report.unpaidOrders],
      ["Cancelled Orders", report.cancelledOrders],
      [],
      ["Top Items"],
      ["Item", "Quantity", "Revenue"],
      ...report.topItems.map((item) => [item.name, item.quantity, item.revenue]),
      [],
      ["Payment Methods"],
      ["Method", "Count", "Total"],
      ...report.paymentMethods.map((pm) => [pm.method, pm.count, pm.total]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${date}.csv`;
    a.click();
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Badge variant="outline" className="mb-3 border-emerald-200 text-emerald-700 bg-emerald-50 px-3 py-1 font-black uppercase tracking-widest text-[10px]">
            Analytics Engine
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Laporan <span className="text-emerald-500">Finansial</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Pantau arus kas dan performa menu harian Anda.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-auto">
             <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
             <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-11 pr-4 py-6 bg-white border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm focus-visible:ring-emerald-500 min-w-[200px]"
             />
          </div>
          <Button
            onClick={handleExport}
            disabled={!report || loading}
            variant="outline"
            className="w-full sm:w-auto rounded-2xl py-6 px-6 text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50 gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
          <div className="relative">
             <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
             <BarChart3 className="absolute inset-x-0 inset-y-0 m-auto w-5 h-5 text-emerald-200" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Mengkalkulasi Data...</p>
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Package className="w-16 h-16 text-slate-900" />
               </div>
               <CardContent className="p-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pesanan</p>
                  <div className="flex items-baseline gap-2">
                     <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{report.totalOrders}</h2>
                     <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black uppercase">Order</Badge>
                  </div>
               </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-emerald-100 bg-emerald-50/30 shadow-xl shadow-emerald-500/5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp className="w-16 h-16 text-emerald-600" />
               </div>
               <CardContent className="p-6">
                  <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Total Pendapatan</p>
                  <div className="flex items-baseline gap-2">
                     <h2 className="text-3xl font-black text-emerald-600 tracking-tighter">{formatCurrency(report.totalRevenue).replace("Rp", "Rp ")}</h2>
                     <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                  </div>
               </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <CreditCard className="w-16 h-16 text-slate-900" />
               </div>
               <CardContent className="p-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Terbayar Lunas</p>
                  <div className="flex items-baseline gap-2">
                     <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{report.paidOrders}</h2>
                     <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  </div>
               </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <XCircle className="w-16 h-16 text-slate-900" />
               </div>
               <CardContent className="p-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dibatalkan</p>
                  <div className="flex items-baseline gap-2">
                     <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{report.cancelledOrders}</h2>
                     <Badge className="bg-slate-100 text-slate-500 border-0 text-[9px] font-black uppercase">Void</Badge>
                  </div>
               </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Items Table */}
            <Card className="lg:col-span-2 rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/50">
                 <div className="flex items-center justify-between">
                    <div>
                       <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-amber-500" />
                          Menu Terlaris
                       </CardTitle>
                       <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">PERINGKAT BERDASARKAN VOLUME PENJUALAN</CardDescription>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white">
                    <TableRow className="hover:bg-transparent border-slate-50">
                      <TableHead className="w-16 text-center font-black text-[10px] uppercase tracking-widest h-14">Rank</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest h-14">Nama Menu</TableHead>
                      <TableHead className="text-right font-black text-[10px] uppercase tracking-widest h-14">Qty</TableHead>
                      <TableHead className="text-right font-black text-[10px] uppercase tracking-widest h-14">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.topItems.length > 0 ? report.topItems.map((item, index) => (
                      <TableRow key={index} className="group hover:bg-emerald-50/30 border-slate-50 transition-colors">
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${
                            index === 0 ? "bg-amber-100 text-amber-700 shadow-md shadow-amber-500/10" :
                            index === 1 ? "bg-slate-100 text-slate-500" :
                            index === 2 ? "bg-orange-100 text-orange-700" :
                            "bg-slate-50 text-slate-400"
                          }`}>
                            {index + 1}
                          </span>
                        </TableCell>
                        <TableCell className="font-black text-slate-700 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{item.name}</TableCell>
                        <TableCell className="text-right font-bold text-slate-600">{item.quantity}x</TableCell>
                        <TableCell className="text-right font-black text-emerald-600">
                          {formatCurrency(item.revenue).replace("Rp", "Rp ")}
                        </TableCell>
                      </TableRow>
                    )) : (
                       <TableRow>
                          <TableCell colSpan={4} className="text-center py-12 text-slate-400 text-[10px] font-black uppercase tracking-widest">Tidak ada data transaksi</TableCell>
                       </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden flex flex-col">
              <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/50">
                 <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-500" />
                    Pembayaran
                 </CardTitle>
                 <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">DISTRIBUSI METODE TRANSAKSI</CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col gap-4">
                {report.paymentMethods.length > 0 ? report.paymentMethods.map((pm, index) => (
                  <div key={index} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-emerald-200 transition-all">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{pm.method || "LAINNYA"}</p>
                      <h4 className="text-xl font-black text-slate-900 tracking-tighter">{pm.count} <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">Order</span></h4>
                    </div>
                    <div className="text-right">
                       <p className="text-emerald-600 font-black text-sm tracking-tight">{formatCurrency(pm.total).replace("Rp", "Rp ")}</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
                     <CreditCard className="w-10 h-10 text-slate-100" />
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Belum ada transaksi terekam</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="rounded-[2.5rem] border-dashed border-2 border-slate-100 py-24">
           <CardContent className="flex flex-col items-center justify-center gap-4">
              <Package className="w-16 h-16 text-slate-100" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data harian tidak ditemukan untuk tanggal ini</p>
              <Button 
                variant="outline" 
                onClick={() => setDate(new Date().toISOString().split("T")[0])}
                className="rounded-xl font-black text-[9px] uppercase tracking-widest"
              >
                Kembali ke Hari Ini
              </Button>
           </CardContent>
        </Card>
      )}
    </div>
  );
}

