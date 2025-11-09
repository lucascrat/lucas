import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json({ status: 'ok', time: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ status: 'error', message }, { status: 500 });
  }
}