import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bingo.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

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
  
  // In a real app, you'd check against a database
  // For now, we'll use environment variables
  if (email !== ADMIN_EMAIL) {
    console.log('❌ Email não confere');
    return false;
  }

  // For simplicity, we'll do a direct comparison
  // In production, you should hash the password in the env var
  const isValid = password === ADMIN_PASSWORD;
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

export function verifyToken(token: string): AdminUser | null {
  try {
    console.log('🔍 Verificando token JWT...');
    console.log('🔑 Token recebido:', token ? '[PRESENTE]' : '[AUSENTE]');
    console.log('🔐 JWT_SECRET:', JWT_SECRET ? '[PRESENTE]' : '[AUSENTE]');
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    console.log('✅ Token decodificado com sucesso:', { id: decoded.id, email: decoded.email });
    
    return {
      id: decoded.id,
      email: decoded.email
    };
  } catch (error) {
    console.log('❌ Erro ao verificar token:', error instanceof Error ? error.message : 'Erro desconhecido');
    return null;
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}