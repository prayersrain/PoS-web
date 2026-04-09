import { NextResponse } from "next/server";
import { handleNotification } from "@/lib/midtrans";

export async function POST(request: Request) {
  try {
    const notification = await request.json();
    
    console.log("Midtrans notification received:", JSON.stringify(notification, null, 2));

    // Handle the notification
    await handleNotification(notification);

    // Always return 200 to Midtrans
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
