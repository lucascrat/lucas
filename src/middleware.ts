import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export function middleware(request: NextRequest) {
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

    // Verify token
    const user = verifyToken(token);
    console.log('🔐 Verificação do token:', user ? '✅ VÁLIDO' : '❌ INVÁLIDO');
    if (!user) {
      console.log('❌ Token inválido, redirecionando para login');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
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

    // Verify token
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-admin-user', JSON.stringify(user));
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};