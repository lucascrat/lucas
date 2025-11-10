import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Este módulo deve ser importado apenas em código que roda no servidor (rotas de API, ações server, etc.)
if (typeof window !== 'undefined') {
  throw new Error('supabase-server.ts deve ser usado apenas no servidor')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})