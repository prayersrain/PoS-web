"use client";

import { useEffect, useState } from "react";
import { 
  Download, 
  QrCode, 
  Monitor, 
  FileText, 
  CheckCircle2, 
  Shapes,
  Printer,
  ChevronRight,
  Info,
  Layers,
  Sparkles
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { useNotification } from "@/components/Notification";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Table {
  id: string;
  tableNumber: string;
  qrCode: string;
  isQREnabled: boolean;
}

export default function TablesPage() {
  const { showNotification } = useNotification();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/tables");
      if (!res.ok) return;
      const data = await res.json();
      setTables(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch tables:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleDownloadQR = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/tables?action=generate-qr");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${siteConfig.name.toLowerCase()}-qr-codes.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      showNotification("PDF Kode QR berhasil diunduh", "success");
    } catch (e) {
      console.error("Failed to generate QR codes:", e);
      showNotification("Gagal membuat Kode QR. Silakan coba lagi.", "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Badge variant="outline" className="mb-3 border-indigo-200 text-indigo-700 bg-indigo-50 px-3 py-1 font-black uppercase tracking-widest text-[10px]">
            Inventory Assets
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Meja & <span className="text-indigo-600">Kode QR</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
            <QrCode className="w-4 h-4 text-indigo-400" />
            Kelola meja dan unduh kode QR untuk akses menu digital.
          </p>
        </div>
        
        <Button
          onClick={handleDownloadQR}
          disabled={generating}
          className="rounded-2xl py-7 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-500/30 gap-3 group"
        >
          {generating ? (
            <>
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               Generating PDF...
            </>
          ) : (
            <>
               <Printer className="w-4 h-4 group-hover:scale-125 transition-transform" />
               Cetak Semua QR (PDF)
            </>
          )}
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="rounded-[2rem] border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shapes className="w-16 h-16 text-slate-900" />
           </div>
           <CardContent className="p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Entitas Meja</p>
              <div className="flex items-baseline gap-2">
                 <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{tables.length}</h2>
                 <Badge className="bg-slate-100 text-slate-500 border-0 text-[9px] font-black uppercase">Units</Badge>
              </div>
           </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-indigo-100 bg-indigo-50/30 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sparkles className="w-16 h-16 text-indigo-600" />
           </div>
           <CardContent className="p-6">
              <p className="text-[10px] font-black text-indigo-600/60 uppercase tracking-widest mb-1">Layanan QR Aktif</p>
              <div className="flex items-baseline gap-2">
                 <h2 className="text-4xl font-black text-indigo-600 tracking-tighter">
                   {tables.filter((t) => t.isQREnabled).length}
                 </h2>
                 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/50">
           <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Daftar Meja Terdaftar
           </CardTitle>
           <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">SINKRONISASI DENGAN DATABASE SISTEM</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                <div className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest">Memuat Grid...</p>
             </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`aspect-square rounded-[2rem] flex flex-col items-center justify-center border-2 transition-all duration-300 group ${
                    table.isQREnabled
                      ? "bg-white border-indigo-100 shadow-lg shadow-indigo-500/5 hover:border-indigo-500 hover:scale-105"
                      : "bg-slate-50 border-slate-200 opacity-60 grayscale hover:grayscale-0 hover:bg-white"
                  }`}
                >
                  <QrCode className={`w-6 h-6 mb-2 ${table.isQREnabled ? "text-indigo-600" : "text-slate-400"}`} />
                  <span className={`text-lg font-black ${table.isQREnabled ? "text-indigo-900" : "text-slate-500"}`}>
                    {table.tableNumber}
                  </span>
                  <Badge variant="outline" className={`mt-2 py-0 h-4 border-0 text-[7px] font-black uppercase ${
                    table.isQREnabled
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-slate-100 text-slate-400"
                  }`}>
                    {table.isQREnabled ? "ACTIVE" : "DISABLED"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guide Section */}
      <Card className="rounded-[2.5rem] border-indigo-50 bg-indigo-50/20 p-8">
        <div className="flex items-center gap-3 mb-8">
           <FileText className="w-6 h-6 text-indigo-500" />
           <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Panduan Penggunaan</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Ekstraksi PDF",
              desc: "Klik tombol unduh di atas untuk mendapatkan file PDF berisi semua kode QR.",
              icon: Download
            },
            {
              title: "Cetak & Laminasi",
              desc: "Gunakan kertas berkualitas (Art Paper) dan laminasi agar tahan air dan awet.",
              icon: Printer
            },
            {
              title: "Penempatan Meja",
              desc: "Tempel kode QR sesuai nomor meja. Pastikan stiker berada di posisi yang mudah di-scan.",
              icon: Shapes
            }
          ].map((step, i) => (
            <div key={i} className="flex gap-4 group">
              <div className="w-10 h-10 rounded-2xl bg-white border border-indigo-100 shadow-sm flex items-center justify-center text-xs font-black text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                {i + 1}
              </div>
              <div>
                 <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-1">{step.title}</h4>
                 <p className="text-slate-500 text-xs leading-relaxed font-medium capitalize">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-8 border-t border-indigo-100/50 flex items-center gap-2 text-indigo-500">
           <Info className="w-4 h-4" />
           <p className="text-[10px] font-black uppercase tracking-widest italic">Tips: Bersihkan kode QR secara rutin dari sisa makanan/minuman pelanggan.</p>
        </div>
      </Card>
    </div>
  );
}

