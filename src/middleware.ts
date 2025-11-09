import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  console.log('🔒 Middleware executado para:', request.nextUrl.pathname);
  
  // Check if the request is for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Skip auth check for login page
    if (request.nextUrl.pathname === '/admin/login') {
      console.log('✅ Permitindo acesso à página de login');
      return NextResponse.next();
    }

    // Check for auth token
    const token = request.cookies.get('admin-token')?.value;
    console.log('🍪 Token encontrado:', token ? '[PRESENTE]' : '[AUSENTE]');
    
    if (!token) {
      console.log('❌ Token ausente, redirecionando para login');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Nota: Evitar verificação JWT aqui para compatibilidade com runtime edge
    // Rotas de API fazem verificação completa no servidor Node
    console.log('✅ Token presente, permitindo acesso ao admin');

    console.log('✅ Acesso autorizado para:', request.nextUrl.pathname);
  }

  // Check if the request is for API routes that need authentication
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    // Skip auth check for login API
    if (request.nextUrl.pathname === '/api/admin/login') {
      return NextResponse.next();
    }

    // Check for auth token in header or cookie
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Não validar token aqui; as rotas /api/admin validam internamente
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};