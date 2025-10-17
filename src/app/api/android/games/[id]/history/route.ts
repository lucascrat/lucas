import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Buscar histórico de números sorteados para o app Android
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    console.log(`📱 API Android: Buscando histórico do jogo ${resolvedParams.id}...`);

    // Verificar se o jogo existe
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('id, name, status')
      .eq('id', resolvedParams.id)
      .single();

    if (gameError || !game) {
      console.error('❌ Jogo não encontrado:', gameError);
      return NextResponse.json({ 
        success: false,
        error: 'Jogo não encontrado' 
      }, { status: 404 });
    }

    // Buscar histórico de números sorteados
    const { data: drawnNumbers, error: historyError } = await supabaseAdmin
      .from('drawn_numbers')
      .select('number, drawn_at')
      .eq('game_id', resolvedParams.id)
      .order('drawn_at', { ascending: false });

    if (historyError) {
      console.error('❌ Erro ao buscar histórico:', historyError);
      return NextResponse.json({ 
        success: false,
        error: 'Erro ao buscar histórico' 
      }, { status: 500 });
    }

    // Formatar dados para o app Android
    const history = drawnNumbers?.map(dn => ({
      number: dn.number,
      drawn_at: dn.drawn_at,
      formatted_time: new Date(dn.drawn_at).toLocaleString('pt-BR')
    })) || [];

    const response = {
      success: true,
      game: {
        id: game.id,
        name: game.name,
        status: game.status
      },
      history: {
        numbers: history,
        total_drawn: history.length,
        remaining_numbers: 75 - history.length,
        last_number: history.length > 0 ? history[0].number : null,
        last_drawn_at: history.length > 0 ? history[0].drawn_at : null
      }
    };

    console.log(`✅ Histórico do jogo ${resolvedParams.id} encontrado: ${history.length} números`);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Erro na API Android de histórico:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}