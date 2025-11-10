import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/auth';

// POST - Resetar jogo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    console.log(`🔄 API: Resetando jogo ${resolvedParams.id}...`);
    
    // Verificar autenticação
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o jogo existe
    const { data: currentGame, error: fetchError } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (fetchError || !currentGame) {
      console.error('❌ Jogo não encontrado:', fetchError);
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    // Deletar números sorteados
    const { error: deleteNumbersError } = await supabaseAdmin
      .from('drawn_numbers')
      .delete()
      .eq('game_id', resolvedParams.id);

    if (deleteNumbersError) {
      console.error('❌ Erro ao deletar números sorteados:', deleteNumbersError);
      return NextResponse.json({ error: 'Erro ao resetar números sorteados' }, { status: 500 });
    }

    // Resetar participantes (opcional - manter ou remover)
    const { error: resetParticipantsError } = await supabaseAdmin
      .from('participants')
      .update({ status: 'waiting' })
      .eq('game_id', resolvedParams.id);

    if (resetParticipantsError) {
      console.error('❌ Erro ao resetar participantes:', resetParticipantsError);
    }

    // Resetar status do jogo (usando settings JSONB)
    const { data: game, error } = await supabaseAdmin
      .from('games')
      .update({
        status: 'waiting',
        started_at: null,
        finished_at: null,
        settings: {
          ...currentGame.settings,
          last_number: null,
          updated_at: new Date().toISOString()
        }
      })
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao resetar jogo:', error);
      return NextResponse.json({ error: 'Erro ao resetar jogo' }, { status: 500 });
    }

    console.log('✅ Jogo resetado com sucesso:', game.name);
    
    // Aqui você pode adicionar lógica para notificar participantes via WebSocket/SSE
    // Por exemplo: notifyParticipants('game_reset', { gameId: resolvedParams.id });

    return NextResponse.json({ 
      game,
      message: 'Jogo resetado com sucesso!' 
    });

  } catch (error) {
    console.error('❌ Erro ao resetar jogo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}