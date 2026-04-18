"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Edit, Trash2, X, Save, Search, ImagePlus, Loader2, UtensilsCrossed, Info } from "lucide-react";
import { useNotification } from "@/components/Notification";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  image: string | null;
  isAvailable: boolean;
}

const categories = [
  { value: "nasi", label: "🍚 Nasi" },
  { value: "signature_noodle", label: "🍜 Signature Noodle" },
  { value: "mie", label: "🍝 Mie" },
  { value: "snack", label: "🍟 Snack" },
  { value: "ketan", label: "🍡 Ketan" },
  { value: "pisang", label: "🍌 Pisang" },
  { value: "roti_bakar", label: "🍞 Roti Bakar" },
  { value: "minuman", label: "🥤 Minuman" },
];

export default function MenuPage() {
  const { showNotification, confirmAction } = useNotification();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "nasi",
    price: 0,
    description: "",
    image: "",
    isAvailable: true,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu");
      if (!res.ok) return;
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch menu:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      const { url } = await res.json();
      setFormData((prev) => ({ ...prev, image: url }));
      setImagePreview(url);
      showNotification("Gambar berhasil diupload", "success");
    } catch (e: any) {
      showNotification(e.message || "Gagal upload gambar", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = "/api/menu";
    const method = editingItem ? "PUT" : "POST";

    const payload = editingItem
      ? { id: editingItem.id, ...formData, price: Number(formData.price) }
      : { ...formData, price: Number(formData.price) };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      setShowForm(false);
      setEditingItem(null);
      setFormData({ name: "", category: "nasi", price: 0, description: "", image: "", isAvailable: true });
      setImagePreview(null);
      fetchMenu();
      showNotification(`Menu ${editingItem ? "diperbarui" : "ditambahkan"}!`, "success");
    } catch (e) {
      console.error("Failed to save menu item:", e);
      showNotification("Gagal menyimpan menu", "error");
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description || "",
      image: item.image || "",
      isAvailable: item.isAvailable,
    });
    setImagePreview(item.image || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    confirmAction({
      title: "Hapus Menu?",
      message: "Data menu akan dihapus permanen. Apakah Anda yakin?",
      onConfirm: async () => {
        try {
          await fetch(`/api/menu?id=${id}`, { method: "DELETE" });
          fetchMenu();
          showNotification("Menu berhasil dihapus", "success");
        } catch (e) {
          console.error("Failed to delete menu item:", e);
          showNotification("Gagal menghapus menu", "error");
        }
      }
    });
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          isAvailable: !item.isAvailable,
        }),
      });
      fetchMenu();
    } catch (e) {
      console.error("Failed to update:", e);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedMenu = categories.map((cat) => ({
    ...cat,
    items: filteredItems.filter((item) => item.category === cat.value),
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Badge variant="outline" className="mb-3 border-emerald-200 text-emerald-700 bg-emerald-50 px-3 py-1 font-black uppercase tracking-widest text-[10px]">
            Master Data
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Katalog <span className="text-emerald-500">Menu</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400" />
            Kelola {menuItems.length} hidangan aktif di sistem Anda.
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingItem(null);
            setFormData({ name: "", category: "nasi", price: 0, description: "", image: "", isAvailable: true });
            setImagePreview(null);
            setShowForm(true);
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl px-8 py-7 text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 gap-2 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1"
        >
          <Plus className="w-4 h-4" />
          Tambah Item Baru
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="border-slate-100 shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="CARI NAMA HIDANGAN..."
                className="pl-12 py-7 bg-slate-50 border-transparent rounded-[1.5rem] text-xs font-black placeholder:text-slate-400 focus-visible:ring-emerald-500 transition-all uppercase tracking-widest"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide xl:pb-0">
              <Button
                variant={activeCategory === "all" ? "default" : "secondary"}
                onClick={() => setActiveCategory("all")}
                className={`rounded-[1.25rem] px-6 text-[10px] font-black uppercase tracking-wider h-12 transition-all ${
                  activeCategory === "all" ? "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                Semua
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  variant={activeCategory === cat.value ? "default" : "secondary"}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`rounded-[1.25rem] px-6 text-[10px] font-black uppercase tracking-wider h-12 whitespace-nowrap transition-all ${
                    activeCategory === cat.value ? "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu List */}
      <div className="space-y-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sinkronisasi Menu...</p>
          </div>
        ) : (
          groupedMenu.map((cat) => cat.items.length > 0 && (
            <div key={cat.value} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px bg-slate-200 flex-1" />
                <Badge variant="secondary" className="bg-slate-900 text-white rounded-lg px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
                  {cat.label} • {cat.items.length} ITEM
                </Badge>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cat.items.map((item) => (
                  <Card key={item.id} className="group border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 rounded-[2rem] overflow-hidden relative">
                    <CardContent className="p-0">
                      <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                            <UtensilsCrossed className="w-8 h-8 opacity-20" />
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">No Image</span>
                          </div>
                        )}
                        <Badge 
                          className={`absolute top-4 left-4 border-0 shadow-lg font-black text-[9px] uppercase tracking-widest py-1 px-3 rounded-full ${
                            item.isAvailable ? "bg-emerald-500/90 text-white" : "bg-amber-500/90 text-white"
                          }`}
                        >
                          {item.isAvailable ? "READY" : "SOLDOUT"}
                        </Badge>
                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                           <Button onClick={() => handleEdit(item)} size="icon" className="w-8 h-8 rounded-lg bg-white/90 text-slate-900 hover:bg-emerald-500 hover:text-white backdrop-blur">
                              <Edit className="w-4 h-4" />
                           </Button>
                           <Button onClick={() => handleDelete(item.id)} size="icon" className="w-8 h-8 rounded-lg bg-white/90 text-slate-900 hover:bg-red-500 hover:text-white backdrop-blur">
                              <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg leading-tight group-hover:text-emerald-600 transition-colors">
                            {item.name}
                          </h3>
                          <span className="text-emerald-500 font-black text-lg tracking-tighter">
                            {formatCurrency(item.price).replace("Rp", "Rp ")}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-slate-500 text-xs font-medium line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        
                        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
                           <button 
                             onClick={() => toggleAvailability(item)}
                             className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                               item.isAvailable ? "text-slate-400 hover:text-amber-500" : "text-amber-500 hover:text-emerald-500"
                             }`}
                           >
                              {item.isAvailable ? "SET AS SOLDOUT" : "RESTOCK TO READY"}
                           </button>
                           <Info className="w-4 h-4 text-slate-200" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-slate-100 p-0 overflow-hidden shadow-2xl">
          <div className="bg-slate-900 p-8 text-white relative h-32 flex flex-col justify-end overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             <DialogHeader className="relative z-10 text-left">
               <DialogTitle className="text-xl font-black uppercase tracking-tighter italic">
                 {editingItem ? "Edit Produk" : "Tambah Produk"}
               </DialogTitle>
               <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                 {editingItem ? "PERBARUI SPESIFIKASI MENU" : "DAFTARKAN MENU BARU KE SISTEM"}
               </DialogDescription>
             </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Hidangan</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="rounded-2xl bg-slate-50 border-transparent py-6 font-bold uppercase text-xs"
                    placeholder="E.G. NASI GORENG WARKOP"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData({ ...formData, category: v || "nasi" })}
                  >
                    <SelectTrigger className="rounded-2xl bg-slate-50 border-transparent h-12 font-bold text-xs uppercase">
                      <SelectValue placeholder="PILIH KATEGORI" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 font-bold text-xs uppercase">
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga (IDR)</label>
                  <Input
                    required
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="rounded-2xl bg-slate-50 border-transparent h-12 font-black text-xs text-emerald-600"
                  />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi & Catatan</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-2xl bg-slate-50 border-transparent p-4 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  rows={3}
                  placeholder="TAMBAHKAN DETAIL BAHAN ATAU INFORMASI LAINNYA..."
                />
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visual Produk</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-28 rounded-2xl border-2 border-dashed border-slate-100 hover:border-emerald-200 bg-slate-50 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover rounded-[calc(1rem-1px)]" />
                  ) : (
                    <>
                      <ImagePlus className="w-6 h-6 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Upload Foto Menu</span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                    </div>
                  )}
                </div>
             </div>

             <DialogFooter className="pt-4 flex !justify-center gap-3">
               <Button 
                 type="button" 
                 variant="ghost" 
                 onClick={() => setShowForm(false)}
                 className="rounded-xl px-8 font-black text-[10px] uppercase tracking-widest text-slate-400"
               >
                 Batal
               </Button>
               <Button 
                 type="submit"
                 className="bg-slate-900 hover:bg-emerald-500 text-white rounded-xl px-10 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg"
               >
                 Konfirmasi & Simpan
               </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

