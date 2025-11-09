import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

// POST - Iniciar jogo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    console.log(`🚀 API: Iniciando jogo ${resolvedParams.id}...`);
    
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

    if (currentGame.status === 'active') {
      return NextResponse.json({ error: 'Jogo já está ativo' }, { status: 400 });
    }

    if (currentGame.status === 'finished') {
      return NextResponse.json({ error: 'Jogo já foi finalizado' }, { status: 400 });
    }

    // Finalizar quaisquer jogos anteriormente ativos e limpar seus números
    const { data: previousActiveGames, error: listActiveError } = await supabaseAdmin
      .from('games')
      .select('id')
      .eq('status', 'active')
      .neq('id', resolvedParams.id);

    if (listActiveError) {
      console.error('❌ Erro ao listar jogos ativos anteriores:', listActiveError);
      // Prosseguir mesmo assim para garantir que o novo jogo inicie
    }

    if (previousActiveGames && previousActiveGames.length > 0) {
      const previousIds = previousActiveGames.map(g => g.id);
      console.log(`🔧 Finalizando jogos ativos anteriores: ${previousIds.join(', ')}`);

      const { error: finishError } = await supabaseAdmin
        .from('games')
        .update({ status: 'finished', finished_at: new Date().toISOString() })
        .in('id', previousIds);

      if (finishError) {
        console.error('⚠️ Erro ao finalizar jogos anteriores:', finishError);
      }

      const { error: clearNumbersError } = await supabaseAdmin
        .from('drawn_numbers')
        .delete()
        .in('game_id', previousIds);

      if (clearNumbersError) {
        console.error('⚠️ Erro ao limpar números dos jogos anteriores:', clearNumbersError);
      }
    }

    // Atualizar status do jogo atual para ativo
    const { data: game, error } = await supabaseAdmin
      .from('games')
      .update({
        status: 'active',
        started_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao iniciar jogo:', error);
      return NextResponse.json({ error: 'Erro ao iniciar jogo' }, { status: 500 });
    }

    console.log('✅ Jogo iniciado com sucesso:', game.name);
    
    // Aqui você pode adicionar lógica para notificar participantes via WebSocket/SSE
    // Por exemplo: notifyParticipants('game_started', { gameId: resolvedParams.id });

    return NextResponse.json({ 
      game,
      message: 'Jogo iniciado. Jogos anteriores finalizados e números limpos.' 
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar jogo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}