"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Package, CreditCard, Download } from "lucide-react";

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
    try {
      const res = await fetch(`/api/reports/daily?date=${date}`);
      const data = await res.json();
      setReport(data);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Daily sales reports and analytics</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!report}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">
          <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
          Loading report...
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-500">Total Orders</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{report.totalOrders}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-500">Total Revenue</p>
              </div>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(report.totalRevenue)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-500">Paid Orders</p>
              </div>
              <p className="text-3xl font-bold text-blue-600">{report.paidOrders}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg">✕</span>
                </div>
                <p className="text-sm text-gray-500">Cancelled</p>
              </div>
              <p className="text-3xl font-bold text-red-600">{report.cancelledOrders}</p>
            </div>
          </div>

          {/* Top Items */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Top Selling Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4 text-right">Quantity</th>
                    <th className="px-6 py-4 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {report.topItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                          index === 0 ? "bg-yellow-100 text-yellow-700" :
                          index === 1 ? "bg-gray-100 text-gray-600" :
                          index === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-gray-50 text-gray-400"
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-right text-gray-600">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-green-600 font-semibold">
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Payment Methods</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.paymentMethods.map((pm, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <p className="text-sm text-gray-500 capitalize mb-1">{pm.method || "N/A"}</p>
                    <p className="text-2xl font-bold text-gray-900">{pm.count} orders</p>
                    <p className="text-green-600 font-semibold mt-1">{formatCurrency(pm.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No data for selected date</p>
        </div>
      )}
    </div>
  );
}
