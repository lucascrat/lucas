import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET - Buscar jogo específico para o app Android
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    console.log(`📱 API Android: Buscando jogo ${resolvedParams.id}...`);

    const { data: game, error } = await supabaseAdmin
      .from('games')
      .select(`
        id,
        name,
        status,
        settings,
        created_at,
        started_at,
        finished_at,
        drawn_numbers(
          number,
          drawn_at
        )
      `)
      .eq('id', resolvedParams.id)
      .single();

    if (error || !game) {
      console.error('❌ Jogo não encontrado:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Jogo não encontrado' 
      }, { status: 404 });
    }

    // Formatar dados para o app Android
    const formattedGame = {
      id: game.id,
      name: game.name,
      status: game.status,
      prize_line: game.settings?.prize_line || 0,
      prize_column: game.settings?.prize_column || 0,
      prize_full: game.settings?.prize_full || 0,
      prize_image_url: game.settings?.prize_image_url || null,
      last_number: game.settings?.last_number || null,
      created_at: game.created_at,
      started_at: game.started_at,
      finished_at: game.finished_at,
      drawn_numbers: game.drawn_numbers?.map(dn => ({
        number: dn.number,
        drawn_at: dn.drawn_at
      })).sort((a, b) => new Date(b.drawn_at).getTime() - new Date(a.drawn_at).getTime()) || [],
      total_drawn: game.drawn_numbers?.length || 0,
      remaining_numbers: 75 - (game.drawn_numbers?.length || 0)
    };

    console.log(`✅ Jogo ${resolvedParams.id} encontrado para Android`);
    
    return NextResponse.json({ 
      success: true,
      game: formattedGame 
    });

  } catch (error) {
    console.error('❌ Erro na API Android de jogo específico:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}