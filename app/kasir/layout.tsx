"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Monitor, 
  LayoutDashboard, 
  ShoppingCart, 
  Table, 
  QrCode, 
  Clock, 
  LogOut, 
  Menu as MenuIcon, 
  X 
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getSessionClient, clearSessionClient } from "@/lib/auth";

const navItems = [
  { href: "/kasir", label: "Monitor", icon: LayoutDashboard },
  { href: "/kasir/pos", label: "POS", icon: Monitor },
  { href: "/kasir/orders", label: "Pesanan", icon: ShoppingCart },
  { href: "/kasir/stands", label: "Stand", icon: Table },
  { href: "/kasir/tables", label: "Meja & QR", icon: QrCode },
  { href: "/kasir/shift", label: "Shift", icon: Clock },
];

export default function KasirLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          clearSessionClient();
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!data.authenticated) {
          clearSessionClient();
          router.push("/login");
          return;
        }

        setUser(data.user);
      } catch {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  // Effect to close sidebar on navigation (mobile)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  // Initial viewport check
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
       setSidebarOpen(false);
    }
  }, []);

  const handleLogout = () => {
    clearSessionClient();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Memuat Dashboard Kasir...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden font-sans">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-indigo-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Operasional Style */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-indigo-900 border-r border-indigo-800 transition-all duration-300 ease-in-out w-64 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-indigo-800 flex items-center justify-between lg:block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Monitor className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-white">
                <h1 className="text-sm font-black tracking-tighter uppercase italic">KASIR MODE</h1>
                <p className="text-[10px] text-indigo-300 font-bold tracking-widest leading-none mt-0.5">STAFF PANEL</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-indigo-300 hover:text-white">
               <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    isActive
                      ? "bg-white text-indigo-900 shadow-xl shadow-black/20"
                      : "text-indigo-200 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-indigo-800 bg-black/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">{user.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest">Online</p>
                </div>
              </div>
              <button onClick={handleLogout} className="p-3 text-indigo-300 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className={`flex-1 flex flex-col overflow-y-auto transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-0"}`}>
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                 <MenuIcon className="w-6 h-6" />
              </button>
              <h2 className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-widest italic truncate max-w-[150px] md:max-w-none">
                 {siteConfig.name} • POS
              </h2>
           </div>
           <div className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
           </div>
        </header>
        <main className="p-4 md:p-8 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-700">
           {children}
        </main>
      </div>
    </div>
  );
}
