import { createClient } from '@supabase/supabase-js'

// Valores lidos de variáveis de ambiente para uso no cliente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Client para frontend (anon key). Não inicializa service role aqui para evitar crash no cliente.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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