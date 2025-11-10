import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/auth';

// POST - Sortear próximo número
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    console.log(`🎲 API: Sorteando número para jogo ${resolvedParams.id}...`);
    
    // Verificar autenticação
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client indisponível' }, { status: 500 });
    }
    const admin = supabaseAdmin!;

    // Verificar se o jogo existe e está ativo
    const { data: currentGame, error: fetchError } = await admin
      .from('games')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (fetchError || !currentGame) {
      console.error('❌ Jogo não encontrado:', fetchError);
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    if (currentGame.status !== 'active') {
      return NextResponse.json({ error: 'Jogo não está ativo' }, { status: 400 });
    }

    // Buscar números já sorteados
    const { data: drawnNumbers, error: drawnError } = await admin
      .from('drawn_numbers')
      .select('number')
      .eq('game_id', resolvedParams.id);

    if (drawnError) {
      console.error('❌ Erro ao buscar números sorteados:', drawnError);
      return NextResponse.json({ error: 'Erro ao buscar números sorteados' }, { status: 500 });
    }

    const drawnNumbersList = drawnNumbers?.map(n => n.number) || [];
    console.log(`📊 Números já sorteados: ${drawnNumbersList.length}/75`);

    // Verificar se todos os números já foram sorteados
    if (drawnNumbersList.length >= 75) {
      return NextResponse.json({ error: 'Todos os números já foram sorteados' }, { status: 400 });
    }

    // Gerar número aleatório que ainda não foi sorteado
    let newNumber: number;
    do {
      newNumber = Math.floor(Math.random() * 75) + 1;
    } while (drawnNumbersList.includes(newNumber));

    console.log(`🎯 Número sorteado: ${newNumber}`);

    // Salvar número sorteado no banco
    const { data: drawnNumber, error: insertError } = await admin
      .from('drawn_numbers')
      .insert({
        game_id: resolvedParams.id,
        number: newNumber,
        drawn_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao salvar número sorteado:', insertError);
      return NextResponse.json({ error: 'Erro ao salvar número sorteado' }, { status: 500 });
    }

    // Atualizar último número sorteado no jogo (usando settings JSONB)
    const { error: updateError } = await admin
      .from('games')
      .update({
        settings: {
          ...currentGame.settings,
          last_number: newNumber,
          updated_at: new Date().toISOString()
        }
      })
      .eq('id', resolvedParams.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar jogo:', updateError);
    }

    console.log('✅ Número sorteado e salvo com sucesso');
    
    // Aqui você pode adicionar lógica para notificar participantes via WebSocket/SSE
    // Por exemplo: notifyParticipants('number_drawn', { gameId: resolvedParams.id, number: newNumber });

    return NextResponse.json({ 
      number: newNumber,
      drawnNumber,
      totalDrawn: drawnNumbersList.length + 1,
      remaining: 75 - (drawnNumbersList.length + 1),
      message: `Número ${newNumber} sorteado!`
    });

  } catch (error) {
    console.error('❌ Erro ao sortear número:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}