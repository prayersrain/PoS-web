import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning up order history...");

  // Delete records in order of dependencies
  await prisma.orderItem.deleteMany({});
  console.log("✅ OrderItem cleared");

  await prisma.payment.deleteMany({});
  console.log("✅ Payment cleared");

  await prisma.refund.deleteMany({});
  console.log("✅ Refund cleared");

  // Important: Before deleting orders, we must decouple them from Stands
  await prisma.stand.updateMany({
    data: {
      isActive: false,
      currentOrderId: null,
    },
  });
  console.log("✅ Stands detached from orders");

  await prisma.order.deleteMany({});
  console.log("✅ Order cleared");

  console.log("✨ Cleanup completed! Menu Items, Users, and Tables are still intact.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
