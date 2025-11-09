import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔄 Iniciando atualização do YouTube URL...');

    // Obter o ID do jogo
    const { id: gameId } = await params;
    console.log('🎮 ID do jogo:', gameId);

    // Obter dados da requisição
    const bodyText = await request.text();
    console.log('📝 Body recebido (raw):', bodyText);
    
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      console.log('❌ Erro ao fazer parse do JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }
    
    console.log('📝 Dados recebidos:', body);
    const { youtube_live_url } = body;

    // Validar URL do YouTube
    console.log('🔍 Validando URL do YouTube:', youtube_live_url);
    if (youtube_live_url && !isValidYouTubeUrl(youtube_live_url)) {
      console.log('❌ URL do YouTube inválida');
      return NextResponse.json(
        { error: 'URL do YouTube inválida' },
        { status: 400 }
      );
    }
    console.log('✅ URL do YouTube válida');

    // Usar cliente Supabase admin
    console.log('🔍 Usando cliente Supabase admin...');
    const supabase = supabaseAdmin;
    console.log('✅ Cliente Supabase admin configurado com sucesso');

    // Verificar se o jogo existe
    console.log('🔍 Verificando se o jogo existe...');
    const { data: existingGame, error: gameError } = await supabase
      .from('games')
      .select('id, name')
      .eq('id', gameId)
      .single();

    if (gameError || !existingGame) {
      console.log('❌ Jogo não encontrado:', gameError);
      return NextResponse.json(
        { error: 'Jogo não encontrado' },
        { status: 404 }
      );
    }
    console.log('✅ Jogo encontrado:', existingGame.name);

    // Atualizar o URL do YouTube
    console.log('🔄 Atualizando URL do YouTube no banco...');
    console.log('📝 Dados para atualização:', { youtube_live_url });
    
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update({ youtube_live_url })
      .eq('id', gameId)
      .select();

    if (updateError) {
      console.error('❌ Erro ao atualizar jogo:', updateError);
      return NextResponse.json(
        { 
          error: 'Erro ao atualizar URL do YouTube',
          details: updateError.message,
          stack: updateError.stack
        },
        { status: 500 }
      );
    }

    if (!updatedGame || updatedGame.length === 0) {
      console.log('❌ Nenhum jogo foi atualizado');
      return NextResponse.json(
        { error: 'Nenhum jogo foi atualizado' },
        { status: 404 }
      );
    }

    const gameResult = updatedGame[0];

    console.log('✅ URL do YouTube atualizado com sucesso');
    return NextResponse.json({
      success: true,
      game: gameResult,
      message: 'URL do YouTube atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

function isValidYouTubeUrl(url: string): boolean {
  if (!url) return true; // URL vazia é válida (remove o link)
  
  // Regex atualizada para aceitar parâmetros de query string completos
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+(\?[\w&=%-]*)?$/;
  return youtubeRegex.test(url);
}