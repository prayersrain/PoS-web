"use client";

import { useEffect, useState } from "react";
import { Clock, DollarSign, TrendingUp } from "lucide-react";

interface Shift {
  id: string;
  openedAt: string;
  closedAt: string | null;
  cashStart: number;
  cashEnd: number | null;
  expectedCash: number | null;
  status: string;
}

export default function ShiftPage() {
  const [shift, setShift] = useState<Shift | null>(null);
  const [cashStart, setCashStart] = useState("");
  const [loading, setLoading] = useState(true);
  const [openingShift, setOpeningShift] = useState(false);
  const [closingShift, setClosingShift] = useState(false);
  const [cashEnd, setCashEnd] = useState("");

  const fetchShift = async () => {
    try {
      const res = await fetch("/api/shift");
      const data = await res.json();
      setShift(data);
    } catch (e) {
      console.error("Failed to fetch shift:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShift();
  }, []);

  const handleOpenShift = async () => {
    if (!cashStart) {
      alert("Please enter starting cash amount");
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
      setCashStart("");
    } catch (e) {
      console.error("Failed to open shift:", e);
    } finally {
      setOpeningShift(false);
    }
  };

  const handleCloseShift = async () => {
    if (!cashEnd) {
      alert("Please enter ending cash amount");
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
      setCashEnd("");
    } catch (e) {
      console.error("Failed to close shift:", e);
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
      <div className="text-center text-gray-400 py-12">
        <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
        Loading shift info...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
        <p className="text-gray-500 mt-1">Open and close cash register shifts</p>
      </div>

      {shift && shift.status === "open" ? (
        <div className="space-y-6">
          {/* Active Shift Card */}
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm">
            <div className="p-6 border-b border-green-100 bg-green-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-green-800">Shift is Open</h2>
                  <p className="text-sm text-green-600">
                    Opened: {new Date(shift.openedAt).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-500">Starting Cash</p>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(shift.cashStart)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-500">Expected Cash</p>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {shift.expectedCash ? formatCurrency(shift.expectedCash) : "-"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-500">Duration</p>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {Math.floor((Date.now() - new Date(shift.openedAt).getTime()) / 3600000)}h{" "}
                  {Math.floor(((Date.now() - new Date(shift.openedAt).getTime()) % 3600000) / 60000)}m
                </p>
              </div>
            </div>
          </div>

          {/* Close Shift */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-gray-900 font-semibold mb-4">Close Shift</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="number"
                value={cashEnd}
                onChange={(e) => setCashEnd(e.target.value)}
                placeholder="Counted cash amount"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                onClick={handleCloseShift}
                disabled={closingShift}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 shadow-lg shadow-red-600/20"
              >
                {closingShift ? "Closing..." : "Close Shift"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Shift</h2>
          <p className="text-gray-500 mb-6">Open a new shift to start processing orders</p>

          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="number"
              value={cashStart}
              onChange={(e) => setCashStart(e.target.value)}
              placeholder="Starting cash amount"
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={handleOpenShift}
              disabled={openingShift}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 shadow-lg shadow-green-600/20 whitespace-nowrap"
            >
              {openingShift ? "Opening..." : "Open Shift"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
