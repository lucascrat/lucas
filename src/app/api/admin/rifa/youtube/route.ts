import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youtube_live_url } = body;

    // Verificar se existe uma rifa ativa
    const { data: existingRifa, error: selectError } = await supabase
      .from('rifas')
      .select('id')
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (selectError) {
      console.error('Erro ao buscar rifa ativa:', selectError);
      return NextResponse.json({ error: 'Erro ao buscar rifa ativa' }, { status: 500 });
    }

    if (existingRifa && existingRifa.length > 0) {
      // Atualizar rifa existente
      const { error: updateError } = await supabase
        .from('rifas')
        .update({ youtube_live_url })
        .eq('id', existingRifa[0].id);

      if (updateError) {
        console.error('Erro ao atualizar URL do YouTube:', updateError);
        return NextResponse.json({ error: 'Erro ao atualizar URL do YouTube' }, { status: 500 });
      }
    } else {
      // Criar nova rifa com URL do YouTube
      const { error: insertError } = await supabase
        .from('rifas')
        .insert({
          nome: 'Rifa da Sorte',
          descricao: 'Rifa principal do sistema',
          youtube_live_url,
          ativo: true,
          data_inicio: new Date().toISOString(),
          data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
          premio_principal: 'Prêmio Principal',
          valor_premio: 1000
        });

      if (insertError) {
        console.error('Erro ao criar rifa com URL do YouTube:', insertError);
        return NextResponse.json({ error: 'Erro ao criar rifa com URL do YouTube' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'URL do YouTube Live salva com sucesso!' 
    });

  } catch (error) {
    console.error('Erro no endpoint YouTube:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}