import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação admin
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Configurar Server-Sent Events
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        // Enviar cabeçalhos SSE
        const headers = [
          'data: {"type":"connected","message":"Conectado ao stream de eventos"}\n\n'
        ];
        
        headers.forEach(header => {
          controller.enqueue(encoder.encode(header));
        });

        // Simular eventos periódicos (em uma implementação real, isso viria do banco de dados)
        const interval = setInterval(() => {
          const event = {
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
            data: { status: 'active' }
          };
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        }, 30000); // Heartbeat a cada 30 segundos

        // Cleanup quando a conexão for fechada
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (error) {
    console.error('Erro no SSE:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
