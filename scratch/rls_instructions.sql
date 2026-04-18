-- ==========================================
-- SUPABASE ROW LEVEL SECURITY (RLS) HARDENING
-- ==========================================
-- Jalankan script SQL ini di halaman "SQL Editor" pada dashboard Supabase Anda.
-- Ini akan memastikan data Anda aman dari akses publik, namun tetap mengizinkan
-- pelanggan untuk melihat menu lewat aplikasi Anda.

-- 1. Mengaktifkan RLS untuk semua tabel penting
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shift" ENABLE ROW LEVEL SECURITY;

-- 2. Mengaktifkan RLS untuk Menu dan Stand (Publik boleh BACA, tapi tidak nulis)
ALTER TABLE "MenuItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Stand" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Table" ENABLE ROW LEVEL SECURITY;

-- 3. Membuat Policy Akses (Public Read-Only) untuk Menu
CREATE POLICY "Public can view active menus" ON "MenuItem"
FOR SELECT USING (true); -- Semua orang bisa lihat menu

CREATE POLICY "Public can view tables and stands" ON "Stand"
FOR SELECT USING (true);

CREATE POLICY "Public can view tables" ON "Table"
FOR SELECT USING (true);

-- 4. Semua Modifikasi (Insert/Update/Delete) harus lewat Service Role
-- Karena backend web Next.js kita menggunakan 'supabaseAdmin' (Service Role Key),
-- RLS otomatis dilewati (bypass) untuk semua aksi dari kode tersebut.
-- Artinya, user Anonim dari browser/Postman TIDAK AKAN BISA mengubah data apa pun secara langsung!

-- 5. Hardening Storage Menu-Images (Hanya lewat kode admin yang diperbolehkan)
-- (Ini bisa diisi langsung lewat menu Storage Policy di dashboard Supabase)
