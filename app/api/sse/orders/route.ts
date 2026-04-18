import { NextResponse } from "next/server";

// Store active connections with metadata for cleanup
interface ClientInfo {
  controller: ReadableStreamDefaultController;
  lastSeen: number;
}

const clients = new Set<ClientInfo>();
const MAX_CLIENTS = 100;
const STALE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Cleanup stale connections periodically
let lastCleanup = 0;
function cleanupStaleClients() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return; // Run cleanup at most every 1 minute
  lastCleanup = now;

  for (const client of clients) {
    if (now - client.lastSeen > STALE_TIMEOUT) {
      clients.delete(client);
    }
  }
}

// Function to broadcast to all clients
export function broadcastOrderUpdate(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();

  cleanupStaleClients();

  const deadClients: ClientInfo[] = [];
  for (const client of clients) {
    try {
      client.controller.enqueue(encoder.encode(message));
      client.lastSeen = Date.now();
    } catch {
      deadClients.push(client);
    }
  }

  for (const client of deadClients) {
    clients.delete(client);
  }
}

export async function GET() {
  const encoder = new TextEncoder();

  // Prevent unbounded growth
  if (clients.size >= MAX_CLIENTS) {
    return new NextResponse("Too many connections", { status: 503 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const clientInfo: ClientInfo = { controller, lastSeen: Date.now() };
      clients.add(clientInfo);

      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`));
          clientInfo.lastSeen = Date.now();
        } catch {
          clearInterval(heartbeat);
          clients.delete(clientInfo);
        }
      }, 30000);

      // Cleanup on close
      return () => {
        clearInterval(heartbeat);
        clients.delete(clientInfo);
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
