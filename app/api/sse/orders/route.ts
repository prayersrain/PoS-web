import { NextResponse } from "next/server";

// Store active connections
const clients = new Set<ReadableStreamDefaultController>();

// Function to broadcast to all clients
export function broadcastOrderUpdate(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();
  
  clients.forEach((client) => {
    try {
      client.enqueue(encoder.encode(message));
    } catch {
      // Client disconnected, remove from set
      clients.delete(client);
    }
  });
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Add client to set
      clients.add(controller);

      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`));
        } catch {
          clearInterval(heartbeat);
          clients.delete(controller);
        }
      }, 30000);

      // Cleanup on close
      return () => {
        clearInterval(heartbeat);
        clients.delete(controller);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
      "Connection": "keep-alive",
    },
  });
}
