import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { verifyAdminCredentials, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando processo de login...');
    
    // Verificar se há dados no body
    const body = await request.text();
    console.log('📝 Body recebido (raw):', body);
    
    if (!body) {
      console.log('❌ Body vazio');
      return NextResponse.json(
        { error: 'Request body is empty' },
        { status: 400 }
      );
    }
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (parseError) {
      console.log('❌ Erro ao fazer parse do JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }
    
    const { email, password } = parsedBody;
    
    console.log('📝 Dados recebidos:', { email, password: password ? '[PRESENTE]' : '[AUSENTE]' });

    if (!email || !password) {
      console.log('❌ Email ou senha ausentes');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Verify admin credentials
    console.log('🔐 Verificando credenciais...');
    const isValid = await verifyAdminCredentials(email, password);
    
    if (!isValid) {
      console.log('❌ Credenciais inválidas');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log('✅ Credenciais válidas, gerando token...');

    // Generate JWT token
    const user = { id: 'admin', email };
    const token = generateToken(user);

    // Create response with token
    const response = NextResponse.json({
      success: true,
      user,
      token
    });

    // Set HTTP-only cookie
    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error', message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  // Logout endpoint
  const response = NextResponse.json({ success: true });
  
  // Clear the cookie
  response.cookies.set('admin-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0
  });

  return response;
}
