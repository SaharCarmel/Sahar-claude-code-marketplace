import { NextRequest } from 'next/server';
import { addClient, removeClient } from '@/lib/sse-manager';

// Force dynamic - SSE cannot be statically generated
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Add client to set
      addClient(controller);

      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      // Keep-alive ping every 30 seconds
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepAlive);
          removeClient(controller);
        }
      }, 30000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        removeClient(controller);
      });
    },
    cancel() {
      // Client disconnected
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
