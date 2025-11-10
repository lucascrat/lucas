import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Buscar estatísticas em paralelo
    const [
      participacoesResult,
      numerosResult,
      sorteiosResult,
      teimozinhaResult,
      videosResult
    ] = await Promise.all([
      // Total de participações
      supabase
        .from('rifa_participacoes')
        .select('id', { count: 'exact', head: true }),
      
      // Total de números gerados
      supabase
        .from('rifa_numeros')
        .select('id', { count: 'exact', head: true }),
      
      // Total de sorteios realizados
      supabase
        .from('sorteios')
        .select('id', { count: 'exact', head: true }),
      
      // Estatísticas da Teimozinha
      supabase
        .from('teimozinha_tentativas')
        .select('id, ganhou', { count: 'exact' }),
      
      // Total de vídeos ativos
      supabase
        .from('videos_premiados')
        .select('id', { count: 'exact', head: true })
        .eq('ativo', true)
    ]);

    // Verificar erros
    if (participacoesResult.error) {
      console.error('Erro ao buscar participações:', participacoesResult.error);
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
    }

    if (numerosResult.error) {
      console.error('Erro ao buscar números:', numerosResult.error);
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
    }

    if (sorteiosResult.error) {
      console.error('Erro ao buscar sorteios:', sorteiosResult.error);
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
    }

    if (teimozinhaResult.error) {
      console.error('Erro ao buscar Teimozinha:', teimozinhaResult.error);
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
    }

    if (videosResult.error) {
      console.error('Erro ao buscar vídeos:', videosResult.error);
      return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
    }

    // Calcular estatísticas da Teimozinha
    const teimozinhaTentativas = teimozinhaResult.data || [];
    const teimozinhaVitorias = teimozinhaTentativas.filter(t => t.ganhou).length;

    // Buscar participações de hoje
    const hoje = new Date().toISOString().split('T')[0];
    const { count: participacoesHojeCount, error: participacoesHojeError } = await supabase
      .from('rifa_participacoes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${hoje}T00:00:00.000Z`)
      .lt('created_at', `${hoje}T23:59:59.999Z`);

    if (participacoesHojeError) {
      console.error('Erro ao buscar participações de hoje:', participacoesHojeError);
    }

    // Buscar último sorteio
    const { data: ultimoSorteio, error: ultimoSorteioError } = await supabase
      .from('sorteios')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (ultimoSorteioError && ultimoSorteioError.code !== 'PGRST116') {
      console.error('Erro ao buscar último sorteio:', ultimoSorteioError);
    }

    const stats = {
      totalParticipacoes: participacoesResult.count || 0,
      totalNumeros: numerosResult.count || 0,
      totalSorteios: sorteiosResult.count || 0,
      participacoesHoje: participacoesHojeCount || 0,
      videosAtivos: videosResult.count || 0,
      teimozinha: {
        totalTentativas: teimozinhaTentativas.length,
        totalVitorias: teimozinhaVitorias,
        taxaSucesso: teimozinhaTentativas.length > 0 
          ? ((teimozinhaVitorias / teimozinhaTentativas.length) * 100).toFixed(1)
          : '0.0'
      },
      ultimoSorteio: ultimoSorteio || null
    };

    return NextResponse.json({ 
      success: true,
      stats
    });

  } catch (error) {
    console.error('Erro na API de estatísticas:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}