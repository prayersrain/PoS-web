"use client";

import { useEffect, useState } from "react";
import { Coffee } from "lucide-react";

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
      const data = await res.json();
      setStands(data);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stand Management</h1>
        <p className="text-gray-500 mt-1">Manage table stands for dine-in orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Coffee className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Coffee className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Available</p>
              <p className="text-2xl font-bold text-gray-900">{availableCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Coffee className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stands.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stands Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">All Stands</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center text-gray-400 py-12">
              <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
              Loading stands...
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {stands.map((stand) => (
                <div
                  key={stand.id}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                    stand.isActive
                      ? "bg-green-50 border-green-300 shadow-sm"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className={`text-lg font-bold ${stand.isActive ? "text-green-700" : "text-gray-400"}`}>
                    #{stand.standNumber}
                  </span>
                  <span className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
                    stand.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {stand.isActive ? "Used" : "Free"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-gray-900 font-semibold mb-4">Legend</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-50 border-2 border-green-300 rounded-lg" />
            <span className="text-gray-600 text-sm">Active (in use)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-50 border-2 border-gray-200 rounded-lg" />
            <span className="text-gray-600 text-sm">Available</span>
          </div>
        </div>
      </div>
    </div>
  );
}
