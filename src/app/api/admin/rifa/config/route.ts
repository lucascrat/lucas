import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Buscar configurações do sistema
    const { data: configs, error } = await supabase
      .from('configuracoes_sistema')
      .select('*')
      .in('chave', [
        'max_participacoes_diarias',
        'max_tentativas_teimozinha_diarias',
        'rifa_ativa',
        'teimozinha_ativa'
      ]);

    if (error) {
      console.error('Erro ao buscar configurações:', error);
      return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
    }

    // Buscar dados da rifa (incluindo YouTube URL)
    const { data: rifas, error: rifaError } = await supabase
      .from('rifas')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (rifaError) {
      console.error('Erro ao buscar rifas:', rifaError);
    }

    // Converter array para objeto
    const configObj = configs?.reduce((acc, config) => {
      acc[config.chave] = config.valor;
      return acc;
    }, {} as Record<string, string>) || {};

    return NextResponse.json({ 
      success: true,
      config: {
        maxParticipacoesDiarias: parseInt(configObj.max_participacoes_diarias || '3'),
        maxTentativasTeimozinhaDiarias: parseInt(configObj.max_tentativas_teimozinha_diarias || '5'),
        rifaAtiva: configObj.rifa_ativa === 'true',
        teimozinhaAtiva: configObj.teimozinha_ativa === 'true'
      },
      rifas: rifas || []
    });

  } catch (error) {
    console.error('Erro na API de configurações:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;

    const { 
      maxParticipacoesDiarias,
      maxTentativasTeimozinhaDiarias,
      rifaAtiva,
      teimozinhaAtiva
    } = await request.json();

    // Validar dados
    if (maxParticipacoesDiarias < 1 || maxParticipacoesDiarias > 10) {
      return NextResponse.json({ 
        error: 'Máximo de participações diárias deve estar entre 1 e 10' 
      }, { status: 400 });
    }

    if (maxTentativasTeimozinhaDiarias < 1 || maxTentativasTeimozinhaDiarias > 20) {
      return NextResponse.json({ 
        error: 'Máximo de tentativas da Teimozinha deve estar entre 1 e 20' 
      }, { status: 400 });
    }

    // Atualizar configurações
    const updates = [
      {
        chave: 'max_participacoes_diarias',
        valor: maxParticipacoesDiarias.toString()
      },
      {
        chave: 'max_tentativas_teimozinha_diarias',
        valor: maxTentativasTeimozinhaDiarias.toString()
      },
      {
        chave: 'rifa_ativa',
        valor: rifaAtiva.toString()
      },
      {
        chave: 'teimozinha_ativa',
        valor: teimozinhaAtiva.toString()
      }
    ];

    // Usar upsert para atualizar ou inserir configurações
    const { error } = await supabase
      .from('configuracoes_sistema')
      .upsert(updates, { 
        onConflict: 'chave',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Erro ao atualizar configurações:', error);
      return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Configurações atualizadas com sucesso'
    });

  } catch (error) {
    console.error('Erro na API de atualização de configurações:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}