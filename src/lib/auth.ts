import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = (process.env.JWT_SECRET || 'your-secret-key').trim();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@bingo.com').trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'admin123').trim();

export interface AdminUser {
  id: string;
  email: string;
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  // Debug logging
  console.log('🔍 Verificando credenciais:');
  console.log('📧 Email recebido:', email);
  console.log('📧 Email esperado:', ADMIN_EMAIL);
  console.log('🔑 Senha recebida:', password ? '[PRESENTE]' : '[AUSENTE]');
  console.log('🔑 Senha esperada:', ADMIN_PASSWORD ? '[PRESENTE]' : '[AUSENTE]');
  
  // Trim dos valores para remover quebras de linha
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();
  
  console.log('📧 Email após trim:', trimmedEmail);
  console.log('📧 Email esperado após trim:', ADMIN_EMAIL);
  
  // In a real app, you'd check against a database
  // For now, we'll use environment variables
  if (trimmedEmail !== ADMIN_EMAIL) {
    console.log('❌ Email não confere');
    return false;
  }

  // For simplicity, we'll do a direct comparison
  // In production, you should hash the password in the env var
  const isValid = trimmedPassword === ADMIN_PASSWORD;
  console.log('🔐 Resultado da verificação:', isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO');
  
  return isValid;
}

export function generateToken(user: AdminUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role: 'admin'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export async function verifyToken(token: string): Promise<{ user: { id: string; email: string; role: string } } | null> {
  try {
    console.log('🔍 Verificando token JWT...');
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role?: string };
    console.log('✅ Token válido para:', decoded.email);
    
    return {
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'admin'
      }
    };
  } catch (error) {
    console.log('❌ Token inválido:', error);
    return null;
  }
}



export async function getAdminFromCookie(cookieHeader: string | null): Promise<AdminUser | null> {
  if (!cookieHeader) {
    console.log('❌ Nenhum cookie encontrado');
    return null;
  }

  // Parse cookies
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const token = cookies['admin-token'];
  if (!token) {
    console.log('❌ Token admin não encontrado nos cookies');
    return null;
  }

  const result = await verifyToken(token);
  if (result) {
    return {
      id: result.user.id,
      email: result.user.email
    };
  }
  return null;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}