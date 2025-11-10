import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// POST /api/admin/claims/validate
// Body: { id: string }
// Marca um claim como validado.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body?.id;

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client indisponível no servidor' }, { status: 500 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('bingo_claims')
      .update({ validated: true })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ claim: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro inesperado' }, { status: 500 });
  }
}