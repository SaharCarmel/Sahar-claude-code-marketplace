// SSE Manager - handles Server-Sent Events broadcasting
// Note: This uses a global store, which works in development but
// may need Redis/etc for production multi-instance deployments

// Store connected clients
const clients = new Set<ReadableStreamDefaultController>();

export function addClient(controller: ReadableStreamDefaultController): void {
  clients.add(controller);
}

export function removeClient(controller: ReadableStreamDefaultController): void {
  clients.delete(controller);
}

// Helper function to broadcast to all clients
export function broadcastEvent(event: {
  type: string;
  [key: string]: unknown;
}): void {
  const encoder = new TextEncoder();
  const data = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);

  Array.from(clients).forEach((client) => {
    try {
      client.enqueue(data);
    } catch {
      clients.delete(client);
    }
  });
}

export function getClientCount(): number {
  return clients.size;
}
