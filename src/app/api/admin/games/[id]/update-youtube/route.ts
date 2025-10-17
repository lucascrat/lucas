import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔄 Iniciando atualização do YouTube URL...');
    
    // Verificar autenticação do admin usando o mesmo sistema dos outros endpoints
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin-token');
    console.log('🔑 Token admin:', adminToken ? 'PRESENTE' : 'AUSENTE');

    if (!adminToken) {
      console.log('❌ Token de admin não encontrado');
      return NextResponse.json(
        { error: 'Token de admin não encontrado' },
        { status: 401 }
      );
    }

    // Verificar se o token é válido usando a função verifyToken
    console.log('🔍 Verificando token JWT...');
    const payload = verifyToken(adminToken.value);
    
    if (!payload) {
      console.log('❌ Token inválido');
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    console.log('✅ Admin verificado:', payload.email);

    // Obter o ID do jogo
    const { id: gameId } = await params;
    console.log('🎮 ID do jogo:', gameId);

    // Obter dados da requisição
    const body = await request.json();
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

    // Criar cliente Supabase
    console.log('🔍 Criando cliente Supabase...');
    const supabase = createSupabaseClient();
    console.log('✅ Cliente Supabase criado com sucesso');

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
      .select()
      .single();

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

    console.log('✅ URL do YouTube atualizado com sucesso');
    return NextResponse.json({
      success: true,
      game: updatedGame,
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