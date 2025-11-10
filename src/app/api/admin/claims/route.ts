import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/admin/claims?game_id=...&since=ISO_DATE&only_validated=true|false
// Retorna últimos claims do jogo, enriquecidos com nome do participante.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('game_id');
    const since = searchParams.get('since');
    const onlyValidated = searchParams.get('only_validated') === 'true';

    if (!gameId) {
      return NextResponse.json({ error: 'game_id é obrigatório' }, { status: 400 });
    }

  if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client indisponível no servidor' }, { status: 500 });
  }

    const admin = supabaseAdmin!;

    let query = supabaseAdmin
      .from('bingo_claims')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Filtro temporal (considera created_at e updated_at)
    if (since) {
      // Para capturar inserções recentes e validações recentes
      query = query.or(`created_at.gte.${since},updated_at.gte.${since}`);
    }

    if (onlyValidated) {
      query = query.eq('validated', true);
    }

    const { data: claims, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enriquecer com nome do participante
    const enriched = await Promise.all(
      (claims || []).map(async (c: any) => {
        let participantName: string | null = null;
        if (c.participant_id) {
          try {
            const { data: p, error: pErr } = await admin
              .from('participants')
              .select('id,name')
              .eq('id', c.participant_id)
              .single();
            if (!pErr) participantName = p?.name ?? null;
          } catch (_) {}
        }

        const type = c.claim_type || c.bingo_type;
        const typeLabel =
          type === 'full-card' ? 'Cartela completa' :
          type === 'line' ? 'Linha' :
          type === 'column' ? 'Coluna' : 'Bingo';

        return {
          ...c,
          participant_name: participantName,
          type_label: typeLabel,
        };
      })
    );

    return NextResponse.json({ claims: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro inesperado' }, { status: 500 });
  }
}

// POST /api/admin/claims
// Body: { game_id: string, participant_id: string, claim_type: 'line'|'column'|'full-card' }
// Cria um claim de bingo para teste/admin.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const gameId = body?.game_id;
    const participantId = body?.participant_id;
    const claimType = body?.claim_type;

    if (!gameId || !participantId || !claimType) {
      return NextResponse.json({ error: 'game_id, participant_id e claim_type são obrigatórios' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client indisponível no servidor' }, { status: 500 });
    }

    const { data: claim, error } = await supabaseAdmin
      .from('bingo_claims')
      .insert({
        game_id: gameId,
        participant_id: participantId,
        bingo_type: claimType,
        validated: false,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ claim });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro inesperado' }, { status: 500 });
  }
}