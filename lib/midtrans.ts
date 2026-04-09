import { prisma } from "./prisma";

const MIDTRANS_SANDBOX_API = "https://api.sandbox.midtrans.com";
const MIDTRANS_SANDBOX_SNAP = "https://app.sandbox.midtrans.com";
const MIDTRANS_PROD_API = "https://api.midtrans.com";
const MIDTRANS_PROD_SNAP = "https://app.midtrans.com";

const MIDTRANS_API = process.env.NODE_ENV === "production"
  ? { core: MIDTRANS_PROD_API, snap: MIDTRANS_PROD_SNAP }
  : { core: MIDTRANS_SANDBOX_API, snap: MIDTRANS_SANDBOX_SNAP };

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";

export interface CreatePaymentParams {
  orderId: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

// Create QRIS payment using direct API call to Midtrans Snap
export async function createQRISPayment(params: CreatePaymentParams) {
  const auth = Buffer.from(SERVER_KEY + ":").toString("base64");

  // Log for debugging
  console.log("Midtrans Snap URL:", MIDTRANS_API.snap);
  console.log("Server Key (first 10 chars):", SERVER_KEY.substring(0, 10) + "...");

  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount, // This is totalAmount (including tax)
    },
    customer_details: {
      first_name: params.customerName || "Customer",
      email: params.customerEmail || "customer@warkoem.pul", // Dummy valid email
      phone: params.customerPhone || "081234567890",
    },
    item_details: [
      ...params.items.map((item) => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name,
      })),
      // Add tax as a separate item to match gross_amount
      {
        id: "tax-10pct",
        price: params.amount - params.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        quantity: 1,
        name: "Pajak (10%)",
      },
    ],
    enabled_payments: ["qris", "gopay", "shopeepay", "bca_va", "mandiri_va", "bni_va", "bri_va"],
  };

  try {
    // Snap API uses different base URL: app.sandbox.midtrans.com
    const fullUrl = `${MIDTRANS_API.snap}/snap/v1/transactions`;
    console.log("Full Midtrans Snap URL:", fullUrl);

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify(parameter),
    });

    const responseText = await response.text();
    console.log("Midtrans raw response status:", response.status);
    console.log("Midtrans raw response body:", responseText);

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = JSON.parse(responseText);
      } catch {
        // Not JSON
      }
      console.error("Midtrans API Error:", response.status, errorData);
      const errorMessages = (errorData as any).error_messages || [];
      throw new Error(
        errorMessages[0] || `Midtrans API error: ${response.status}`
      );
    }

    const data = JSON.parse(responseText);
    return {
      token: data.token,
      redirectUrl: data.redirect_url,
    };
  } catch (error: any) {
    if (error.message.startsWith("Midtrans")) throw error;
    console.error("Midtrans request error:", error);
    throw new Error(`Failed to create payment: ${error.message}`);
  }
}

// Handle Midtrans HTTP notification
export async function handleNotification(notification: any) {
  try {
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const paymentType = notification.payment_type;
    const fraudStatus = notification.fraud_status;

    console.log(`Notification received. Order: ${orderId}, Status: ${transactionStatus}, Payment: ${paymentType}`);

    // Find the order in database
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    // Handle different transaction statuses
    if (transactionStatus === "capture") {
      if (fraudStatus === "accept") {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "paid",
            paymentMethod: paymentType as any,
            paymentId: notification.transaction_id,
            paidAt: new Date(),
            status: "pending",
          },
        });
      }
    } else if (transactionStatus === "settlement") {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "paid",
          paymentMethod: paymentType as any,
          paymentId: notification.transaction_id,
          paidAt: new Date(),
          status: "pending",
        },
      });
    } else if (transactionStatus === "pending") {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "unpaid",
          paymentMethod: paymentType as any,
          paymentId: notification.transaction_id,
        },
      });
    } else if (transactionStatus === "deny" || transactionStatus === "cancel" || transactionStatus === "expire") {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "unpaid",
          status: "cancelled",
        },
      });
    }

    return notification;
  } catch (error) {
    console.error("Error handling notification:", error);
    throw error;
  }
}

// Refund transaction
export async function processRefund(orderId: string, amount: number, reason: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");
    if (!order.paymentId) throw new Error("No payment to refund");

    const auth = Buffer.from(SERVER_KEY + ":").toString("base64");

    const response = await fetch(`${MIDTRANS_API.core}/v2/${order.paymentId}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        refund_key: `refund-${orderId}-${Date.now()}`,
        amount,
        reason,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error_messages?.[0] || `Refund failed: ${response.status}`);
    }

    const refundData = await response.json();

    await prisma.refund.create({
      data: {
        orderId,
        amount,
        reason,
        refundedBy: "system",
        paymentRefundId: refundData.id || `refund-${orderId}`,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "refunded" },
    });

    return refundData;
  } catch (error: any) {
    console.error("Refund error:", error);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
}

// Cancel transaction
export async function cancelTransaction(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || !order.paymentId) throw new Error("Order or payment not found");

    const auth = Buffer.from(SERVER_KEY + ":").toString("base64");

    const response = await fetch(`${MIDTRANS_API.core}/v2/${order.paymentId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error_messages?.[0] || `Cancel failed: ${response.status}`);
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "cancelled", paymentStatus: "unpaid" },
    });

    return await response.json();
  } catch (error: any) {
    console.error("Cancel error:", error);
    throw new Error(`Failed to cancel transaction: ${error.message}`);
  }
}
