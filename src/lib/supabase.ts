import { createClient } from '@supabase/supabase-js'

// Valores lidos de variáveis de ambiente para uso no cliente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Client para frontend (anon key). Evita crash quando envs faltam em produção.
// Quando as variáveis públicas não estiverem configuradas no Vercel, exporta um cliente no-op
// para que a UI carregue e funcionalidades de realtime sejam simplesmente ignoradas.
const createNoopClient = () => {
  const noopChannel = {
    on: () => noopChannel,
    subscribe: () => ({ unsubscribe: () => {} })
  } as any

  return {
    channel: () => noopChannel
  } as any
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (() => {
      if (typeof window !== 'undefined') {
        console.error('Supabase env ausentes: configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no Vercel.')
      }
      return createNoopClient()
    })()

// Database types
export interface Game {
  id: string
  name: string
  status: 'waiting' | 'active' | 'finished'
  settings: Record<string, unknown>
  created_at: string
  started_at?: string
  finished_at?: string
}

export interface Participant {
  id: string
  game_id: string
  name: string
  email: string
  card_numbers: number[][]
  marked_numbers: number[]
  bingo_claimed: boolean
  is_winner: boolean
  joined_at: string
}

export interface Prize {
  id: string
  game_id: string
  type: 'line' | 'column' | 'full-card'
  name: string
  value: number
  description: string
  claimed: boolean
  winner_id?: string
}

export interface DrawnNumber {
  id: string
  game_id: string
  number: number
  drawn_at: string
}

export interface BingoClaim {
  id: string
  participant_id: string
  game_id: string
  bingo_type: 'line' | 'column' | 'full-card'
  validated: boolean
  claimed_at: string
  validated_at?: string
}

export interface BingoEvent {
  type: 'number-drawn' | 'bingo-claimed' | 'bingo-validated' | 'game-ended' | 'participant-joined'
  gameId: string
  data: Record<string, unknown>
  timestamp: string
}