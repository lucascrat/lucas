import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar token do cookie
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token não encontrado' },
        { status: 401 }
      );
    }

    // Verificar se o token é válido
    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Retornar informações do usuário admin
    return NextResponse.json({
      user: {
        id: payload.user.id,
        email: payload.user.email
      }
    });

  } catch (error) {
    console.error('Erro na verificação do admin:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
