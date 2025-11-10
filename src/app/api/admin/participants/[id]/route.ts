import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

// GET /api/admin/participants/:id - Busca um participante por ID
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Admin client indisponível. Configure SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      )
    }

    const { id: participantId } = await context.params
    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID é obrigatório' },
        { status: 400 }
      )
    }

    const { data: participant, error } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single()

    if (error) {
      console.error('Erro ao buscar participante por ID:', error)
      return NextResponse.json(
        { error: 'Falha ao buscar participante' },
        { status: 500 }
      )
    }

    if (!participant) {
      return NextResponse.json(
        { error: 'Participante não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ participant })
  } catch (err) {
    console.error('Participants [id] API error:', err)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}