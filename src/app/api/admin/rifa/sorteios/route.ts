import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Buscar sorteios
    const { data: sorteios, error } = await supabase
      .from('sorteios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar sorteios:', error);
      return NextResponse.json({ error: 'Erro ao buscar sorteios' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      sorteios: sorteios || []
    });

  } catch (error) {
    console.error('Erro na API de sorteios:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;

    const { tipo_sorteio, valor_premio } = await request.json();

    if (!tipo_sorteio || !valor_premio) {
      return NextResponse.json({ 
        error: 'Tipo de sorteio e valor do prêmio são obrigatórios' 
      }, { status: 400 });
    }

    if (!['rifa', 'teimozinha'].includes(tipo_sorteio)) {
      return NextResponse.json({ 
        error: 'Tipo de sorteio deve ser "rifa" ou "teimozinha"' 
      }, { status: 400 });
    }

    if (valor_premio <= 0) {
      return NextResponse.json({ 
        error: 'Valor do prêmio deve ser maior que zero' 
      }, { status: 400 });
    }

    // Chamar Edge Function para realizar sorteio
    const { data, error } = await supabase.functions.invoke('realizar-sorteio', {
      body: {
        tipo_sorteio,
        valor_premio
      }
    });

    if (error) {
      console.error('Erro ao realizar sorteio:', error);
      return NextResponse.json({ 
        error: 'Erro ao realizar sorteio' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      sorteio: data
    });

  } catch (error) {
    console.error('Erro na API de sorteio:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}