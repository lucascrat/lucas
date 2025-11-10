import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/auth';

// POST - Upload de imagem do prêmio
export async function POST(request: NextRequest) {
  try {
    console.log('📸 API: Fazendo upload de imagem...');
    
    // Verificar autenticação
    const token = request.cookies.get('admin-token')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.' 
      }, { status: 400 });
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Máximo 5MB.' 
      }, { status: 400 });
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop();
    const fileName = `prize-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    
    console.log(`📁 Nome do arquivo: ${fileName}`);

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload para Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('bingo-prizes')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Erro no upload:', error);
      return NextResponse.json({ error: 'Erro ao fazer upload da imagem' }, { status: 500 });
    }

    // Obter URL pública da imagem
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('bingo-prizes')
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;
    
    console.log('✅ Upload realizado com sucesso:', imageUrl);

    return NextResponse.json({ 
      imageUrl,
      fileName,
      message: 'Imagem enviada com sucesso!' 
    });

  } catch (error) {
    console.error('❌ Erro no upload:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
