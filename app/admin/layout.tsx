"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  BarChart3, 
  Settings,
  LogOut, 
  Menu as MenuIcon, 
  X,
  ShieldCheck,
  TrendingUp,
  FileText
} from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { getSessionClient, clearSessionClient } from "@/lib/auth";

const navItems = [
  { href: "/admin", label: "Ringkasan Finansial", icon: TrendingUp },
  { href: "/admin/menu", label: "Manajemen Menu", icon: UtensilsCrossed },
  { href: "/admin/reports", label: "Laporan & Laba", icon: BarChart3 },
  { href: "/admin/settings", label: "Profil Warkop", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
        if (!data.authenticated || data.user.role !== "admin") {
          if (data.user?.role === "kasir") {
             router.push("/kasir");
             return;
          }
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
  }, [router, pathname]);

  // Effect to close sidebar on navigation (mobile)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  // Initial viewport check
  useEffect(() => {
    if (window.innerWidth < 1024) {
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
          <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Memasuki Area Manajemen...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden font-sans">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Managerial / Premium Dark Style */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-[#0f172a] border-r border-slate-800 transition-all duration-300 ease-in-out w-64 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-800 bg-[#1e293b]/50 flex items-center justify-between lg:block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-sm font-black tracking-tighter uppercase italic text-emerald-400">OWNER PANEL</h1>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest leading-none mt-0.5">ADMINISTRATION</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white">
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
                  className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    isActive
                      ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-6 border-t border-slate-800">
             <div className="bg-slate-800/50 rounded-2xl p-4 mb-4 hidden xs:block">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2 text-center sm:text-left">Status Bisnis</p>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                   <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                   <span className="text-xs text-slate-300 font-bold">Operasional Aktif</span>
                </div>
             </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">{user.name}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Super Admin</p>
              </div>
              <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <div className={`flex-1 flex flex-col overflow-y-auto transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-0"}`}>
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                 <MenuIcon className="w-6 h-6" />
              </button>
              <h2 className="text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-[0.2em] md:tracking-[0.3em] font-mono truncate">
                 {siteConfig.name.toUpperCase()} • ADMIN
              </h2>
           </div>
           
           <div className="flex items-center gap-3 md:gap-6">
              <div className="hidden sm:flex flex-col items-end">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-snug">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long' })}
                 </span>
                 <span className="text-xs font-black text-slate-800 leading-none">
                    {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                 </span>
              </div>
           </div>
        </header>
        <main className="p-4 md:p-8 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
           {children}
        </main>
      </div>
    </div>
  );
}
