import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Buscar configurações de prêmio existentes
    const { data: configs, error } = await supabase
      .from('configuracoes_sistema')
      .select('chave, valor, descricao')
      .in('chave', [
        'rifa_premio_valor',
        'rifa_premio_descricao',
        'teimozinha_premio_valor',
        'teimozinha_premio_descricao'
      ]);

    if (error) {
      console.error('Erro ao buscar configurações de prêmio:', error);
      return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
    }

    // Converter array de configurações em objeto
    const configuracoesPremio = {
      valor_premio_principal: 5000,
      descricao_premio_principal: 'Prêmio Principal da Rifa',
      valor_premio_teimozinha: 100,
      descricao_premio_teimozinha: 'Prêmio da Teimozinha'
    };

    configs?.forEach(config => {
      switch (config.chave) {
        case 'rifa_premio_valor':
          configuracoesPremio.valor_premio_principal = parseFloat(config.valor) || 5000;
          break;
        case 'rifa_premio_descricao':
          configuracoesPremio.descricao_premio_principal = config.valor || 'Prêmio Principal da Rifa';
          break;
        case 'teimozinha_premio_valor':
          configuracoesPremio.valor_premio_teimozinha = parseFloat(config.valor) || 100;
          break;
        case 'teimozinha_premio_descricao':
          configuracoesPremio.descricao_premio_teimozinha = config.valor || 'Prêmio da Teimozinha';
          break;
      }
    });

    return NextResponse.json({ 
      success: true, 
      configuracoes: configuracoesPremio 
    });

  } catch (error) {
    console.error('Erro interno ao buscar configurações de prêmio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      valor_premio_principal,
      descricao_premio_principal,
      valor_premio_teimozinha,
      descricao_premio_teimozinha
    } = body;

    // Validações
    if (!valor_premio_principal || valor_premio_principal <= 0) {
      return NextResponse.json({ error: 'Valor do prêmio principal deve ser maior que zero' }, { status: 400 });
    }

    if (!valor_premio_teimozinha || valor_premio_teimozinha <= 0) {
      return NextResponse.json({ error: 'Valor do prêmio da teimozinha deve ser maior que zero' }, { status: 400 });
    }

    if (!descricao_premio_principal?.trim()) {
      return NextResponse.json({ error: 'Descrição do prêmio principal é obrigatória' }, { status: 400 });
    }

    if (!descricao_premio_teimozinha?.trim()) {
      return NextResponse.json({ error: 'Descrição do prêmio da teimozinha é obrigatória' }, { status: 400 });
    }

    // Configurações a serem salvas/atualizadas
    const configuracoes = [
      {
        chave: 'rifa_premio_valor',
        valor: valor_premio_principal.toString(),
        descricao: 'Valor do prêmio principal da rifa'
      },
      {
        chave: 'rifa_premio_descricao',
        valor: descricao_premio_principal.trim(),
        descricao: 'Descrição do prêmio principal da rifa'
      },
      {
        chave: 'teimozinha_premio_valor',
        valor: valor_premio_teimozinha.toString(),
        descricao: 'Valor do prêmio da teimozinha'
      },
      {
        chave: 'teimozinha_premio_descricao',
        valor: descricao_premio_teimozinha.trim(),
        descricao: 'Descrição do prêmio da teimozinha'
      }
    ];

    // Salvar/atualizar cada configuração
    for (const config of configuracoes) {
      const { error } = await supabase
        .from('configuracoes_sistema')
        .upsert(config, { 
          onConflict: 'chave',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Erro ao salvar configuração ${config.chave}:`, error);
        return NextResponse.json({ 
          error: `Erro ao salvar configuração ${config.chave}` 
        }, { status: 500 });
      }
    }

    console.log('Configurações de prêmio salvas com sucesso:', configuracoes);

    return NextResponse.json({ 
      success: true, 
      message: 'Configurações de prêmio salvas com sucesso',
      configuracoes: {
        valor_premio_principal,
        descricao_premio_principal,
        valor_premio_teimozinha,
        descricao_premio_teimozinha
      }
    });

  } catch (error) {
    console.error('Erro interno ao salvar configurações de prêmio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}