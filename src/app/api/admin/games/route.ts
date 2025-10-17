import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

// GET - Listar todos os jogos
export async function GET(request: NextRequest) {
  try {
    console.log('🎮 API: Listando jogos...');
    
    // Verificar autenticação
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: games, error } = await supabaseAdmin
      .from('games')
      .select(`
        *,
        drawn_numbers(number),
        participants(id, name, email, card_numbers, marked_numbers, bingo_claimed, is_winner)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar jogos:', error);
      return NextResponse.json({ error: 'Erro ao buscar jogos' }, { status: 500 });
    }

    console.log(`✅ ${games?.length || 0} jogos encontrados`);
    return NextResponse.json({ games });

  } catch (error) {
    console.error('❌ Erro na API de jogos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar novo jogo
export async function POST(request: NextRequest) {
  try {
    console.log('🎮 API: Criando novo jogo...');
    
    // Verificar autenticação
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, prize_line, prize_column, prize_full, prize_image_url, youtube_live_url } = body;

    console.log('📝 Dados do jogo:', { name, description, prize_line, prize_column, prize_full, youtube_live_url });

    // Criar novo jogo
    const { data: game, error } = await supabaseAdmin
      .from('games')
      .insert({
        name: name || 'Novo Jogo de Bingo',
        status: 'waiting',
        youtube_live_url: youtube_live_url || null,
        settings: {
          description: description || 'Jogo criado pelo painel admin',
          prize_line: prize_line || 50.00,
          prize_column: prize_column || 100.00,
          prize_full: prize_full || 500.00,
          prize_image_url: prize_image_url || null
        },
        started_at: null,
        finished_at: null
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar jogo:', error);
      return NextResponse.json({ error: 'Erro ao criar jogo' }, { status: 500 });
    }

    console.log('✅ Jogo criado com sucesso:', game.id);
    return NextResponse.json({ game }, { status: 201 });

  } catch (error) {
    console.error('❌ Erro na criação do jogo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
