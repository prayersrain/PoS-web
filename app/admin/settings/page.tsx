"use client";

import { useEffect, useState } from "react";
import { Save, Building2, MapPin, Phone, Percent, ReceiptText } from "lucide-react";
import { useNotification } from "@/components/Notification";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    name: "",
    address: "",
    phone: "",
    taxPercent: 10,
    footerText: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        showNotification("Pengaturan Toko Berhasil Disimpan!", "success");
      } else {
        showNotification("Gagal menyimpan pengaturan.", "error");
      }
    } catch (e) {
      console.error("Failed to save settings:", e);
      showNotification("Terjadi kesalahan sistem.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-muted-foreground gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="font-medium tracking-widest uppercase text-xs">Mengambil Pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight italic uppercase">Pengaturan Toko</h1>
        <p className="text-muted-foreground font-medium mt-1">Sesuaikan identitas warkop Anda untuk struck dan laporan.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="rounded-[2.5rem] bg-card border-border shadow-sm overflow-hidden p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Store Identity */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-2">Identitas Utama</h3>
              
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase flex items-center gap-2">
                  <Building2 className="w-3 h-3" /> Nama Toko
                </label>
                <Input 
                  type="text" 
                  value={settings.name}
                  onChange={(e) => setSettings({...settings, name: e.target.value})}
                  className="w-full h-14 px-5 bg-background border-2 border-transparent focus-visible:border-primary rounded-2xl font-bold text-foreground transition-all"
                  placeholder="Contoh: Warkoem Pul"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Nomor WhatsApp
                </label>
                <Input 
                  type="text" 
                  value={settings.phone || ""}
                  onChange={(e) => setSettings({...settings, phone: e.target.value})}
                  className="w-full h-14 px-5 bg-background border-2 border-transparent focus-visible:border-primary rounded-2xl font-bold text-foreground transition-all"
                  placeholder="0812..."
                />
              </div>
            </div>

            {/* Address & Tax */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-2">Lokasi & Pajak</h3>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Alamat Lengkap
                </label>
                <textarea 
                  value={settings.address || ""}
                  onChange={(e) => setSettings({...settings, address: e.target.value})}
                   className="w-full px-5 py-4 bg-background border-2 border-transparent focus:border-primary focus:outline-none rounded-2xl font-bold text-foreground transition-all min-h-[100px] resize-y"
                  placeholder="Alamat outlet..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase flex items-center gap-2">
                  <Percent className="w-3 h-3" /> PB1 / Pajak (%)
                </label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={settings.taxPercent}
                  onChange={(e) => setSettings({...settings, taxPercent: parseFloat(e.target.value)})}
                  className="w-full h-14 px-5 bg-background border-2 border-transparent focus-visible:border-primary rounded-2xl font-bold text-foreground transition-all"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-border">
            <label className="text-xs font-black text-muted-foreground uppercase flex items-center gap-2 mb-3">
              <ReceiptText className="w-3 h-3" /> Pesan Penutup Struck
            </label>
            <Input 
              type="text" 
              value={settings.footerText || ""}
              onChange={(e) => setSettings({...settings, footerText: e.target.value})}
              className="w-full h-14 px-5 bg-background border-2 border-transparent focus-visible:border-primary rounded-2xl font-bold text-foreground transition-all"
              placeholder="Terima kasih atas kunjungannya!"
            />
          </div>
        </Card>

        <div className="flex justify-end pr-4">
          <Button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-3 px-10 py-7 rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all disabled:opacity-50 text-xs h-auto"
          >
            <Save className="w-5 h-5" />
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
