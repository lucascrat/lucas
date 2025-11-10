import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/auth';

// POST - Inserir número manual
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    console.log(`🎯 API: Inserindo número manual para jogo ${resolvedParams.id}...`);
    
    // Verificar autenticação
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter número do corpo da requisição
    const body = await request.json();
    const { number } = body;

    if (!number || typeof number !== 'number' || number < 1 || number > 75) {
      return NextResponse.json({ error: 'Número inválido. Deve ser entre 1 e 75' }, { status: 400 });
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

    // Verificar se o número já foi sorteado
    if (drawnNumbersList.includes(number)) {
      return NextResponse.json({ error: `O número ${number} já foi sorteado anteriormente` }, { status: 400 });
    }

    // Verificar se todos os números já foram sorteados
    if (drawnNumbersList.length >= 75) {
      return NextResponse.json({ error: 'Todos os números já foram sorteados' }, { status: 400 });
    }

    console.log(`🎯 Número inserido manualmente: ${number}`);

    // Salvar número no banco com flag de inserção manual
    const { data: drawnNumber, error: insertError } = await admin
      .from('drawn_numbers')
      .insert({
        game_id: resolvedParams.id,
        number: number,
        drawn_at: new Date().toISOString(),
        is_manual: true // Flag para indicar que foi inserido manualmente
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao salvar número manual:', insertError);
      return NextResponse.json({ error: 'Erro ao salvar número manual' }, { status: 500 });
    }

    // Atualizar último número no jogo (usando settings JSONB)
    const { error: updateError } = await admin
      .from('games')
      .update({
        settings: {
          ...currentGame.settings,
          last_number: number,
          updated_at: new Date().toISOString()
        }
      })
      .eq('id', resolvedParams.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar jogo:', updateError);
    }

    console.log('✅ Número manual inserido e salvo com sucesso');
    
    // Aqui você pode adicionar lógica para notificar participantes via WebSocket/SSE
    // Por exemplo: notifyParticipants('number_drawn', { gameId: resolvedParams.id, number: number, isManual: true });

    return NextResponse.json({ 
      number: number,
      drawnNumber,
      totalDrawn: drawnNumbersList.length + 1,
      remaining: 75 - (drawnNumbersList.length + 1),
      isManual: true,
      message: `Número ${number} inserido manualmente!`
    });

  } catch (error) {
    console.error('❌ Erro ao inserir número manual:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}