import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseAdmin;

    const { ativo } = await request.json();
    const { id: videoId } = await params;

    if (typeof ativo !== 'boolean') {
      return NextResponse.json({ 
        error: 'Status ativo deve ser um valor booleano' 
      }, { status: 400 });
    }

    // Atualizar status do vídeo
    const { data: video, error } = await supabase
      .from('videos_premiados')
      .update({ ativo })
      .eq('id', videoId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar vídeo:', error);
      return NextResponse.json({ error: 'Erro ao atualizar vídeo' }, { status: 500 });
    }

    if (!video) {
      return NextResponse.json({ error: 'Vídeo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      video
    });

  } catch (error) {
    console.error('Erro na API de atualização de vídeo:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseAdmin;

    const { id: videoId } = await params;

    // Verificar se o vídeo existe e não tem participações associadas
    const { data: participacoes, error: participacoesError } = await supabase
      .from('rifa_participacoes')
      .select('id')
      .eq('video_id', videoId)
      .limit(1);

    if (participacoesError) {
      console.error('Erro ao verificar participações:', participacoesError);
      return NextResponse.json({ error: 'Erro ao verificar participações' }, { status: 500 });
    }

    if (participacoes && participacoes.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir vídeo com participações associadas' 
      }, { status: 400 });
    }

    // Excluir vídeo
    const { error } = await supabase
      .from('videos_premiados')
      .delete()
      .eq('id', videoId);

    if (error) {
      console.error('Erro ao excluir vídeo:', error);
      return NextResponse.json({ error: 'Erro ao excluir vídeo' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Vídeo excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro na API de exclusão de vídeo:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}