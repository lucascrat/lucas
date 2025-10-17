import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

// POST - Finalizar jogo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    console.log(`🏁 API: Finalizando jogo ${resolvedParams.id}...`);
    
    // Verificar autenticação
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o jogo existe e está ativo
    const { data: currentGame, error: fetchError } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (fetchError || !currentGame) {
      console.error('❌ Jogo não encontrado:', fetchError);
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    if (currentGame.status === 'finished') {
      return NextResponse.json({ error: 'Jogo já foi finalizado' }, { status: 400 });
    }

    // Atualizar status do jogo para finalizado
    const { data: game, error } = await supabaseAdmin
      .from('games')
      .update({
        status: 'finished',
        finished_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao finalizar jogo:', error);
      return NextResponse.json({ error: 'Erro ao finalizar jogo' }, { status: 500 });
    }

    console.log('✅ Jogo finalizado com sucesso:', game.name);
    
    // Aqui você pode adicionar lógica para notificar participantes via WebSocket/SSE
    // Por exemplo: notifyParticipants('game_finished', { gameId: resolvedParams.id });

    return NextResponse.json({ 
      game,
      message: 'Jogo finalizado com sucesso!' 
    });

  } catch (error) {
    console.error('❌ Erro ao finalizar jogo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}