import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET /api/admin/prizes - List all prizes
export async function GET(request: NextRequest) {
  try {
    const { data: prizes, error } = await supabaseAdmin
      .from('prizes')
      .select('*')
      .order('type', { ascending: true });
    
    if (error) {
      console.error('Error fetching prizes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prizes' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ prizes });
  } catch (error) {
    console.error('Prizes API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/prizes - Create new prize
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, description, value, image_url } = body;
    
    if (!type || !title) {
      return NextResponse.json(
        { error: 'Type and title are required' },
        { status: 400 }
      );
    }
    
    const prizeData = {
      type,
      title,
      description: description || '',
      value: value || 0,
      image_url: image_url || null,
      created_at: new Date().toISOString()
    };
    
    const { data: prize, error } = await supabaseAdmin
      .from('prizes')
      .insert([prizeData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating prize:', error);
      return NextResponse.json(
        { error: 'Failed to create prize' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ prize }, { status: 201 });
  } catch (error) {
    console.error('Create prize error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/prizes - Update prize
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, type, title, description, value, image_url } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Prize ID is required' },
        { status: 400 }
      );
    }
    
    const updateData: Record<string, unknown> = {};
    if (type) updateData.type = type;
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (value !== undefined) updateData.value = value;
    if (image_url !== undefined) updateData.image_url = image_url;
    
    const { data: prize, error } = await supabaseAdmin
      .from('prizes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating prize:', error);
      return NextResponse.json(
        { error: 'Failed to update prize' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ prize });
  } catch (error) {
    console.error('Update prize error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
