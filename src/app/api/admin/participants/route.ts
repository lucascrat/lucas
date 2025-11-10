import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/admin/participants - List participants (enriched with winnerType/winnerAt)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const search = searchParams.get('search');
    
    let query = supabaseAdmin
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (gameId) {
      query = query.eq('game_id', gameId);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,pix_key.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    const { data: participants, error } = await query;
    
    if (error) {
      console.error('Error fetching participants:', error);
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      );
    }
    
    // Enrich with validated bingo claims (winner type and timestamp)
    let enrichedParticipants = participants || [];
    const participantIds = (participants || []).map((p: any) => p.id);

    if (participantIds.length > 0) {
      let claimsQuery = supabaseAdmin
        .from('bingo_claims')
        .select('participant_id, game_id, bingo_type, claimed_at, validated');

      // Filter by participants for efficiency
      claimsQuery = claimsQuery.in('participant_id', participantIds);

      // Scope by game when provided
      if (gameId) {
        claimsQuery = claimsQuery.eq('game_id', gameId);
      }

      const { data: claims, error: claimsError } = await claimsQuery;

      if (claimsError) {
        console.error('Error fetching bingo claims:', claimsError);
      } else {
        const winnerMap = new Map<string, { winnerType: string; winnerAt: string }>();
        const typeFlagsMap = new Map<string, { hasLine: boolean; hasColumn: boolean; hasFullCard: boolean }>();
        (claims || [])
          .filter((c: any) => c.validated)
          .forEach((c: any) => {
            const current = winnerMap.get(c.participant_id);
            if (!current || new Date(c.claimed_at) > new Date(current.winnerAt)) {
              winnerMap.set(c.participant_id, {
                winnerType: c.bingo_type,
                winnerAt: c.claimed_at,
              });
            }

            // Aggregate flags per participant across validated claims
            const flags = typeFlagsMap.get(c.participant_id) || {
              hasLine: false,
              hasColumn: false,
              hasFullCard: false
            };
            if (c.bingo_type === 'line') flags.hasLine = true;
            if (c.bingo_type === 'column') flags.hasColumn = true;
            if (c.bingo_type === 'full-card') flags.hasFullCard = true;
            typeFlagsMap.set(c.participant_id, flags);
          });

        enrichedParticipants = (participants || []).map((p: any) => {
          const winnerInfo = winnerMap.get(p.id);
          const flags = typeFlagsMap.get(p.id) || {
            hasLine: false,
            hasColumn: false,
            hasFullCard: false
          };
          return {
            ...p,
            is_winner: p.is_winner || Boolean(winnerInfo),
            winnerType: winnerInfo?.winnerType || null,
            winnerAt: winnerInfo?.winnerAt || null,
            hasLine: flags.hasLine,
            hasColumn: flags.hasColumn,
            hasFullCard: flags.hasFullCard,
          };
        });
      }
    }

    return NextResponse.json({ participants: enrichedParticipants });
  } catch (error) {
    console.error('Participants API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/participants - Create participant (for admin use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, pix_key, email, game_id } = body;
    
    if (!name || !phone || !pix_key) {
      return NextResponse.json(
        { error: 'Name, phone, and pix_key are required' },
        { status: 400 }
      );
    }
    
    const { data: participant, error } = await supabaseAdmin
      .from('participants')
      .insert({
        name,
        phone,
        pix_key,
        email,
        game_id,
        device_id: `admin_${Date.now()}` // Generate a unique device_id for admin-created participants
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating participant:', error);
      return NextResponse.json(
        { error: 'Failed to create participant' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ participant }, { status: 201 });
  } catch (error) {
    console.error('Create participant API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}







