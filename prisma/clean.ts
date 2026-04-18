import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning database...");

  // Delete all refunds
  await prisma.refund.deleteMany();
  console.log("✅ Refunds deleted");

  // Delete all order items
  await prisma.orderItem.deleteMany();
  console.log("✅ Order items deleted");

  // Delete all orders
  await prisma.order.deleteMany();
  console.log("✅ Orders deleted");

  // Reset all stands to inactive
  await prisma.stand.updateMany({
    data: { isActive: false, currentOrderId: null },
  });
  console.log("✅ Stands reset");

  // Close any open shifts
  await prisma.shift.updateMany({
    where: { status: "open" },
    data: { status: "closed", closedAt: new Date() },
  });
  console.log("✅ Shifts reset");

  console.log("🎉 Database cleaned! Ready for fresh start.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
