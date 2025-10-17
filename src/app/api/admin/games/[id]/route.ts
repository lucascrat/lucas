import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

// GET - Buscar jogo específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    console.log(`🎮 API: Buscando jogo ${resolvedParams.id}...`);
    
    // Verificar autenticação
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: game, error } = await supabaseAdmin
      .from('bingo_games')
      .select(`
        *,
        bingo_drawn_numbers(number, drawn_at),
        bingo_participants(id, user_id, cartela, status, created_at)
      `)
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar jogo:', error);
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    console.log('✅ Jogo encontrado:', game.name);
    return NextResponse.json({ game });

  } catch (error) {
    console.error('❌ Erro na API do jogo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar jogo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    console.log(`🎮 API: Atualizando jogo ${resolvedParams.id}...`);
    
    // Verificar autenticação
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 Dados para atualização:', body);

    const { data: game, error } = await supabaseAdmin
      .from('bingo_games')
      .update(body)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar jogo:', error);
      return NextResponse.json({ error: 'Erro ao atualizar jogo' }, { status: 500 });
    }

    console.log('✅ Jogo atualizado com sucesso');
    return NextResponse.json({ game });

  } catch (error) {
    console.error('❌ Erro na atualização do jogo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Deletar jogo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    console.log(`🎮 API: Deletando jogo ${resolvedParams.id}...`);
    
    // Verificar autenticação
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from('bingo_games')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) {
      console.error('❌ Erro ao deletar jogo:', error);
      return NextResponse.json({ error: 'Erro ao deletar jogo' }, { status: 500 });
    }

    console.log('✅ Jogo deletado com sucesso');
    return NextResponse.json({ message: 'Jogo deletado com sucesso' });

  } catch (error) {
    console.error('❌ Erro na deleção do jogo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}