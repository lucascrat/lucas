import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Log das variáveis brutas para debug
    console.log('🔍 Raw environment variables:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'EXISTS' : 'MISSING');
    console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
    console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD);
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'EXISTS' : 'MISSING');
    
    // Verificar se as variáveis de ambiente estão definidas
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENTE' : 'AUSENTE',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENTE' : 'AUSENTE',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENTE' : 'AUSENTE',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL ? 'PRESENTE' : 'AUSENTE',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'PRESENTE' : 'AUSENTE',
      JWT_SECRET: process.env.JWT_SECRET ? 'PRESENTE' : 'AUSENTE',
    };

    console.log('🔍 Verificação das variáveis de ambiente:', envVars);

    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      variables: envVars,
      raw_values: {
        ADMIN_EMAIL: process.env.ADMIN_EMAIL,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao verificar variáveis de ambiente:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao verificar variáveis de ambiente',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}