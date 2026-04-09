"use client";

import { useEffect, useState } from "react";
import { Download, QrCode, Coffee } from "lucide-react";

interface Table {
  id: string;
  tableNumber: string;
  qrCode: string;
  isQREnabled: boolean;
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/tables");
      const data = await res.json();
      setTables(data);
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
      a.download = "warkoem-qr-codes.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to generate QR codes:", e);
      alert("Failed to generate QR codes");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tables & QR Codes</h1>
          <p className="text-gray-500 mt-1">Manage tables and download QR codes for printing</p>
        </div>
        <button
          onClick={handleDownloadQR}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-lg shadow-red-600/20 font-medium disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {generating ? "Generating..." : "Download All QR (PDF)"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Coffee className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Tables</p>
              <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">QR Enabled</p>
              <p className="text-2xl font-bold text-gray-900">
                {tables.filter((t) => t.isQREnabled).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">All Tables</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center text-gray-400 py-12">
              <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
              Loading tables...
            </div>
          ) : (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                    table.isQREnabled
                      ? "bg-purple-50 border-purple-300"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <QrCode className={`w-5 h-5 mb-1 ${table.isQREnabled ? "text-purple-600" : "text-gray-400"}`} />
                  <span className={`text-sm font-bold ${table.isQREnabled ? "text-purple-700" : "text-gray-400"}`}>
                    {table.tableNumber}
                  </span>
                  <span className={`text-xs mt-0.5 px-2 py-0.5 rounded-full ${
                    table.isQREnabled
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {table.isQREnabled ? "QR" : "Off"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-gray-900 font-semibold mb-4">How to Use QR Codes</h3>
        <ol className="text-gray-600 text-sm space-y-3">
          {[
            'Click "Download All QR (PDF)" to get printable QR codes',
            "Print the PDF and cut out each QR code",
            "Laminate each QR code for durability",
            "Place QR codes on corresponding tables (T1, T2, T3, etc.)",
            "Customers scan QR code to access digital menu",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
