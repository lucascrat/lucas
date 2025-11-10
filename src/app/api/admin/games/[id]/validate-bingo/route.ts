import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { checkBingo } from '@/lib/utils';

// POST /api/admin/games/[id]/validate-bingo - Validate bingo claim
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const body = await request.json();
    const { participantId, claimType } = body;
    
    if (!participantId || !claimType) {
      return NextResponse.json(
        { error: 'Participant ID and claim type are required' },
        { status: 400 }
      );
    }
    
    // Get game and participant data
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();
    
    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }
    
    const { data: participant, error: participantError } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .eq('game_id', resolvedParams.id)
      .single();
    
    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }
    
    // Get drawn numbers
    const { data: drawnNumbers, error: drawnError } = await supabaseAdmin
      .from('drawn_numbers')
      .select('number')
      .eq('game_id', resolvedParams.id)
      .order('drawn_at', { ascending: true });
    
    if (drawnError) {
      console.error('Error fetching drawn numbers:', drawnError);
      return NextResponse.json(
        { error: 'Failed to fetch drawn numbers' },
        { status: 500 }
      );
    }
    
    const drawnNumbersArray = drawnNumbers?.map(d => d.number) || [];
    const cardData = participant.card_data;
    
    // Validate the bingo claim
    const bingoResult = checkBingo(cardData, drawnNumbersArray);
    
    let isValid = false;
    if (claimType === 'line') {
      isValid = bingoResult.hasLine;
    } else if (claimType === 'column') {
      isValid = bingoResult.hasColumn;
    } else if (claimType === 'full-card') {
      isValid = bingoResult.hasFullCard;
    }
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid bingo claim' },
        { status: 400 }
      );
    }
    
    // Check if this type of bingo has already been claimed
    const { data: existingClaim, error: claimError } = await supabaseAdmin
      .from('bingo_claims')
      .select('*')
      .eq('game_id', resolvedParams.id)
      .eq('claim_type', claimType)
      .eq('verified', true)
      .limit(1);
    
    if (claimError) {
      console.error('Error checking existing claims:', claimError);
      return NextResponse.json(
        { error: 'Failed to check existing claims' },
        { status: 500 }
      );
    }
    
    if (existingClaim && existingClaim.length > 0) {
      return NextResponse.json(
        { error: `${claimType} bingo has already been claimed` },
        { status: 400 }
      );
    }
    
    // Create the bingo claim
    const { data: bingoClaim, error: insertError } = await supabaseAdmin
      .from('bingo_claims')
      .insert([{
        game_id: resolvedParams.id,
        participant_id: participantId,
        claim_type: claimType,
        verified: true,
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        participants (
          name
        )
      `)
      .single();
    
    if (insertError) {
      console.error('Error creating bingo claim:', insertError);
      return NextResponse.json(
        { error: 'Failed to create bingo claim' },
        { status: 500 }
      );
    }
    
    // Get the prize for this claim type
    const { data: prize, error: prizeError } = await supabaseAdmin
      .from('prizes')
      .select('*')
      .eq('type', claimType)
      .single();
    
    return NextResponse.json({
      bingoClaim,
      prize,
      winner: participant.name,
      claimType
    });
  } catch (error) {
    console.error('Validate bingo error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}