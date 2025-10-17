import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Buscar prêmios de um jogo específico para o app Android
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const resolvedParams = await params;
  try {
    console.log(`📱 API Android: Buscando prêmios do jogo ${resolvedParams.gameId}...`);

    // Buscar jogo e seus prêmios
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select(`
        id,
        name,
        status,
        settings
      `)
      .eq('id', resolvedParams.gameId)
      .single();

    if (gameError || !game) {
      console.error('❌ Jogo não encontrado:', gameError);
      return NextResponse.json({ 
        success: false,
        error: 'Jogo não encontrado' 
      }, { status: 404 });
    }

    // Formatar prêmios para o app Android
    const prizes = {
      main_prize: {
        name: 'Prêmio Principal',
        description: 'Cartela completa',
        value: game.settings?.prize_full || 0,
        image_url: game.settings?.prize_image_url || null,
        type: 'full-card'
      },
      secondary_prizes: [
        {
          name: 'Primeira Linha',
          description: 'Primeira linha completa',
          value: game.settings?.prize_line || 0,
          type: 'line'
        },
        {
          name: 'Primeira Coluna',
          description: 'Primeira coluna completa',
          value: game.settings?.prize_column || 0,
          type: 'column'
        }
      ]
    };

    const response = {
      success: true,
      game: {
        id: game.id,
        name: game.name,
        status: game.status
      },
      prizes: prizes
    };

    console.log(`✅ Prêmios do jogo ${resolvedParams.gameId} encontrados`);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Erro na API Android de prêmios:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}