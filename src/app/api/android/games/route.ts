import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET - Listar jogos ativos para o app Android
export async function GET(request: NextRequest) {
  try {
    console.log('📱 API Android: Buscando jogos ativos...');

    const { data: games, error } = await supabaseAdmin
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
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar jogos:', error);
      return NextResponse.json({ error: 'Erro ao buscar jogos' }, { status: 500 });
    }

    // Formatar dados para o app Android
    const formattedGames = games?.map(game => ({
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
      })).sort((a, b) => new Date(b.drawn_at).getTime() - new Date(a.drawn_at).getTime()) || []
    })) || [];

    console.log(`✅ ${formattedGames.length} jogos encontrados para Android`);
    
    return NextResponse.json({ 
      success: true,
      games: formattedGames 
    });

  } catch (error) {
    console.error('❌ Erro na API Android de jogos:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
