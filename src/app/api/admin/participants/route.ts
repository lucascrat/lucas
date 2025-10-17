import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/admin/participants - List participants
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
    
    return NextResponse.json({ participants });
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







