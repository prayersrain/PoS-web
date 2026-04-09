import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default users
  const kasirPassword = await bcrypt.hash("kasir123", 10);
  const kitchenPassword = await bcrypt.hash("kitchen123", 10);

  await prisma.user.createMany({
    data: [
      {
        username: "kasir",
        password: kasirPassword,
        role: "kasir",
        name: "Kasir Utama",
      },
      {
        username: "kitchen",
        password: kitchenPassword,
        role: "kitchen",
        name: "Kitchen Staff",
      },
    ],
  });

  console.log("✅ Users created");

  // Create 25 stands
  const stands = Array.from({ length: 25 }, (_, i) => ({
    standNumber: i + 1,
    isActive: false,
  }));

  await prisma.stand.createMany({
    data: stands,
  });

  console.log("✅ Stands created");

  // Create 40 tables with QR codes
  const tables = Array.from({ length: 40 }, (_, i) => ({
    tableNumber: `T${i + 1}`,
    qrCode: `warkoem-qr-t${i + 1}-${Math.random().toString(36).substring(2, 10)}`,
    isQREnabled: true,
  }));

  await prisma.table.createMany({
    data: tables,
  });

  console.log("✅ Tables created");

  // Create menu items (Warkoem Pul real data)
  const menuItems = [
    // MAKANAN BERAT - NASI
    { name: "Nasi Goreng", category: "nasi", price: 16000 },
    { name: "Nasi Gila", category: "nasi", price: 16000 },
    { name: "Nasi Goreng Gila", category: "nasi", price: 18000 },
    { name: "Nasi Usus Mercon", category: "nasi", price: 17000 },
    { name: "Nasi Ayam Cabai Garam", category: "nasi", price: 18000 },
    { name: "Nasi Kulit Cabai Garam", category: "nasi", price: 17000 },
    // SIGNATURE NOODLE
    { name: "Mie Kuwan", category: "signature_noodle", price: 14000, description: "Tersedia Level 1, 2, 3" },
    // MIE
    { name: "Indomie Goreng Original", category: "mie", price: 12000 },
    { name: "Indomie Goreng Double Original", category: "mie", price: 20000 },
    { name: "Indomie Rebus Kari Ayam", category: "mie", price: 12000 },
    { name: "Indomie Rebus Ayam Bawang", category: "mie", price: 12000 },
    { name: "Mie Bangladesh", category: "mie", price: 19000 },
    // MAKANAN RINGAN - SNACK
    { name: "Kentang Goreng", category: "snack", price: 13000 },
    { name: "Tahu Cabai Garam", category: "snack", price: 13000 },
    { name: "Snack Platter", category: "snack", price: 18000, description: "Kentang, Sosis, Tempura" },
    { name: "Otak-Otak", category: "snack", price: 12000 },
    { name: "Dimsum Mix", category: "snack", price: 14000 },
    { name: "Tempura Mix", category: "snack", price: 18000, description: "Sukoi, Bintang, Tempura" },
    // KETAN
    { name: "Ketan Susu Keju", category: "ketan", price: 8000 },
    { name: "Ketan Susu Coklat", category: "ketan", price: 11000 },
    { name: "Ketan Susu Keju Coklat", category: "ketan", price: 12000 },
    { name: "Ketan Susu Chocomaltine", category: "ketan", price: 14000 },
    // PISANG
    { name: "Pisang Bakar Keju", category: "pisang", price: 15000 },
    { name: "Pisang Bakar Coklat", category: "pisang", price: 16000 },
    { name: "Pisang Bakar Keju Coklat", category: "pisang", price: 18000 },
    { name: "Pisang Bakar Chocomaltine", category: "pisang", price: 20000 },
    // ROTI BAKAR
    { name: "Roti Bakar Keju", category: "roti_bakar", price: 10000 },
    { name: "Roti Bakar Coklat", category: "roti_bakar", price: 10000 },
    { name: "Roti Bakar Keju Coklat", category: "roti_bakar", price: 12000 },
    { name: "Roti Bakar Chocomaltine", category: "roti_bakar", price: 15000 },
    // MINUMAN
    { name: "Air Mineral", category: "minuman", price: 7000 },
    { name: "Es Teh Manis", category: "minuman", price: 7000 },
    { name: "Es Teh Tawar", category: "minuman", price: 6000 },
    { name: "Max Tea Tarik", category: "minuman", price: 10000 },
    { name: "Nutrisari All Variant", category: "minuman", price: 8000 },
    { name: "Good Day Capucino", category: "minuman", price: 10000 },
    { name: "Good Day Freeze", category: "minuman", price: 10000 },
    { name: "Nescafe Classic", category: "minuman", price: 8000 },
    { name: "Kapal Api", category: "minuman", price: 7000 },
    { name: "Kopi Kuwan (Kopi Susu)", category: "minuman", price: 16000 },
    { name: "Chocolatos Matcha", category: "minuman", price: 9000 },
    { name: "Dancow Coklat", category: "minuman", price: 10000 },
    { name: "Dancow Vanila", category: "minuman", price: 10000 },
    { name: "Frisian Flag", category: "minuman", price: 7000 },
    { name: "Milo", category: "minuman", price: 9000 },
    { name: "Ovaltine", category: "minuman", price: 10000 },
    { name: "Ovaltine Susu", category: "minuman", price: 14000 },
    { name: "Soda Susu", category: "minuman", price: 13000 },
    { name: "Extra Joss Susu", category: "minuman", price: 7000 },
    { name: "Extra Joss Susu", category: "minuman", price: 10000 },
    { name: "Kukubima Anggur", category: "minuman", price: 7000 },
    { name: "Kukubima Anggur Susu", category: "minuman", price: 10000 },
    { name: "Fanta Botol", category: "minuman", price: 9000 },
    { name: "Fanta Susu", category: "minuman", price: 13000 },
    { name: "Sprite Botol", category: "minuman", price: 9000 },
    { name: "Sprite Susu", category: "minuman", price: 13000 },
    { name: "Cola Cola Botol", category: "minuman", price: 9000 },
    { name: "Coca Susu", category: "minuman", price: 13000 },
  ];

  await prisma.menuItem.createMany({
    data: menuItems.map((item) => ({
      ...item,
      isAvailable: true,
    })),
  });

  console.log(`✅ ${menuItems.length} menu items created`);
  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
